# Image Processor: Colored ASCII Art Generator

Upload a picture, get back a **colored ASCII-art rendering** of it. Each pixel block becomes a character whose shape reflects brightness and whose color matches the original pixel.

Under the hood it is an asynchronous, queue-based backend: the API never does the heavy image work itself. It stores the upload, records a job, and hands the work to a separate worker process.

> **Status: work in progress.** The backend pipeline (auth, upload, queue, worker, storage) works end to end. The React frontend is still the default Vite template, and a few things are stubbed. See [Current status](#current-status) and [Known gaps](#known-gaps).

## How it works

```text
Client ──POST /api/images/upload──▶ Fastify API ──▶ Cloudflare R2   (original saved under uploads/)
                                        │
                                        ├──▶ Postgres (Neon): ImageJob row, status QUEUED
                                        └──▶ Redis / BullMQ: job on "image-queue"
                                                         │
                                                         ▼
                                              Worker (separate process)
                                              1. mark job PROCESSING
                                              2. download original from R2
                                              3. render ASCII with Sharp
                                              4. upload output/ascii/<uuid>.txt and output/image/<uuid>.png
                                              5. mark job COMPLETED (or FAILED) and store the output keys
```

1. **API (Fastify):** authenticates the user, validates the upload (JPEG, PNG or WebP, max 5 MB), stores the file in R2, creates an `ImageJob` row, enqueues a BullMQ job, and returns `201` with the job id immediately.
2. **Queue (Redis + BullMQ):** buffers jobs between the API and the worker.
3. **Worker:** runs the conversion and records the results. It can be run and scaled independently of the API.

### The ASCII conversion

Implemented in `src/services/ascii.service.ts`:

- Resizes the image to **100 columns**; the row count follows the aspect ratio, corrected for the fact that characters are taller than wide.
- Picks a character per cell from the ramp `.:-=+*#%@` based on perceived luminance (`0.299R + 0.587G + 0.114B`).
- Produces two outputs: a plain-text `.txt` file, and a **colored PNG**, built by drawing each character as an SVG `<tspan>` filled with the cell's original RGB color on a black background, then rasterized with Sharp.

## Tech stack

| Area | Choice |
| --- | --- |
| Runtime / language | Node.js (ESM), TypeScript, run with `tsx` |
| API framework | Fastify 5, TypeBox schemas and type provider |
| API docs | `@fastify/swagger` + Swagger UI at `/documentation` |
| Auth | `@fastify/jwt` + `@fastify/cookie` (JWT in an httpOnly cookie), `bcrypt` password hashing |
| Uploads | `@fastify/multipart` |
| Queue | BullMQ on Redis |
| Image processing | Sharp |
| ORM / database | Prisma 7 with the Neon adapter, PostgreSQL (Neon) |
| Object storage | Cloudflare R2 (S3-compatible, via `@aws-sdk/client-s3`) |
| Frontend | React 19 + Vite (in `web/`) |

## Project structure

```text
image-processor/
├── prisma/
│   └── schema.prisma            # User, ImageJob, ProcessingPreset, JobStatus enum
├── prisma.config.ts             # Prisma CLI config (reads DATABASE_URL_UNPOOLED)
├── neon.ts                      # Neon project / branch config
├── src/
│   ├── api.ts                   # API entry: registers plugins + routes, listens on :3000
│   ├── worker.ts                # BullMQ worker entry (runs separately from the API)
│   ├── modules/
│   │   ├── user/                # register / login / logout / me  (route, controller, service, schema)
│   │   ├── image/               # upload endpoint                  (route, controller, service, schema)
│   │   ├── hash.ts              # bcrypt helpers
│   │   └── error.schema.ts      # shared error response schema
│   ├── services/
│   │   ├── ascii.service.ts     # image → ASCII text + colored PNG
│   │   ├── storage.service.ts   # R2 upload / download / delete / signed URLs
│   │   └── storageTest.ts       # manual R2 smoke test
│   ├── lib/                     # Prisma and Redis/BullMQ singletons (shared by API and worker)
│   ├── plugins/                 # Fastify plugins exposing prisma / redis / imageQueue
│   └── types/                   # Fastify + JWT type augmentation
└── web/                         # React + Vite frontend (proxies /api → localhost:3000)
```

## API

Interactive docs are served at `http://localhost:3000/documentation`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/healthcheck` | none | Liveness check (returns `202 {"status":"OK"}`) |
| `POST` | `/api/users/register` | none | Create an account (`email`, `password` of 8 to 200 chars) |
| `POST` | `/api/users/login` | none | Verifies credentials, sets an httpOnly `token` cookie, returns `204` |
| `POST` | `/api/users/logout` | none | Clears the `token` cookie |
| `GET` | `/api/users/me` | yes | Current user |
| `POST` | `/api/images/upload` | yes | Multipart upload (one file); creates and enqueues a job, returns `201` |
| `POST` | `/api/image-jobs/count` | yes | Debug route that returns the total number of jobs |

Protected routes accept the JWT from the cookie or an `Authorization: Bearer <token>` header. Tokens currently expire after **2 minutes**.

## Data model

- **User**: `id` (uuid), unique `email`, hashed `password`.
- **ImageJob**: `status` (`QUEUED` → `PROCESSING` → `COMPLETED` / `FAILED`), `originalImageDir` (R2 key of the upload), `resultTextUrl` and `resultImageUrl` (R2 keys of the outputs), owner `userId`, and a `presetId`.
- **ProcessingPreset**: size / format / effects settings. Left over from the original generic image-processing design and **not used by the worker yet**.

Storage columns hold **R2 object keys, not URLs**; URLs are meant to be generated on read (see `getSignedDownloadUrl`).

## Getting started

### Prerequisites

- Node.js (recent LTS or newer) and npm
- A PostgreSQL database (the project is set up for [Neon](https://neon.com))
- A Redis instance (local or hosted)
- A Cloudflare R2 bucket with an access key

### 1. Clone and install

```bash
git clone https://github.com/minhtoriet/image-processor.git
cd image-processor
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```dotenv
# Postgres: pooled URL for the app, direct/unpooled URL for Prisma CLI migrations
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# Redis (used by both the API and the worker)
REDIS_URL=redis://localhost:6379

# JWT signing secret
SECRET_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

### 3. Set up the database

`prisma/migrations/` and the generated client (`src/generated/prisma`) are git-ignored, so create them locally:

```bash
npx prisma generate
npx prisma migrate dev --name init     # or: npx prisma db push
```

The upload endpoint currently hardcodes `presetId: 1`, so a preset row with id 1 must exist, or job creation will fail on the foreign key. Insert any placeholder row for now (the worker does not read its values):

```sql
INSERT INTO "ProcessingPreset" (name, "targetWidth", "targetHeight", format, effects)
VALUES ('ascii', 100, 0, 'png', '{}');
```

### 4. Run it

The API and the worker are separate processes. Start each in its own terminal:

```bash
npm run dev:api       # API on http://localhost:3000
npm run dev:worker    # background worker
```

Optional frontend (currently the Vite starter page):

```bash
cd web
npm install
npm run dev
```

### 5. Try it

1. `POST /api/users/register` with `{ "email": "...", "password": "..." }`
2. `POST /api/users/login`, which sets the auth cookie
3. `POST /api/images/upload` with a multipart file, then watch the worker log the job as completed. The outputs appear in your R2 bucket under `output/ascii/` and `output/image/`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev:api` / `dev:worker` | Run the API / worker with `tsx watch` |
| `npm run start:api` / `start:worker` | Run the compiled output from `dist/` |
| `npm start` | Run API and worker together via `concurrently` |

There is no `build` script yet, so the `start:*` scripts have nothing to run until one is added.

## Current status

**Working**
- User registration, login (cookie-based JWT), logout, `/me`
- Authenticated image upload to Cloudflare R2
- BullMQ job queue and a standalone worker with PROCESSING / COMPLETED / FAILED status tracking
- Colored ASCII rendering (text + PNG) saved back to R2
- Swagger documentation

**In progress**
- Frontend UI: `web/` is still the default Vite + React template, with only a small fetch helper (`web/src/api.ts`) wired for cookie auth and 401 handling

## Known gaps

- **Upload ignores the logged-in user.** `image.controller.ts` creates jobs with a hardcoded `userId` and `presetId` instead of the authenticated user's id and a real preset.
- **No way to fetch results yet.** There are no endpoints to get a job's status or download its outputs; `getSignedDownloadUrl` exists but is unused.
- **Short sessions, no refresh.** Tokens and cookies last 2 minutes and there is no refresh flow.
- **Presets unused.** `ProcessingPreset` is not read by the worker; output width is fixed at 100 columns.
- **No tests**, and no `build` script.
- `src/services/storageTest.ts` and `src/plugins/redisTest.ts` are manual smoke-test scripts, not part of the app.
