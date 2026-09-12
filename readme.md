# Asynchronous Image Processing API

A high-performance, event-driven backend system designed to handle heavy compute tasks (image manipulation) without blocking the main web server. Built on a decoupled architecture, this project separates the API gateway from the computational worker using a message queue.

## System Architecture

This system uses a decoupled, non-blocking flow:
1. **The Web API (Fastify):** Acts as the gatekeeper. It accepts incoming image uploads, creates a database tracking record, pushes a job to the message queue, and immediately returns a `202 Accepted` status to the client.
2. **The Message Broker (Redis + BullMQ):** Acts as the shock absorber. It queues incoming tasks in-memory, ensuring the system doesn't crash under sudden high load.
3. **The Background Worker (Standalone Node Process):** Polls the queue, fetches the raw image from cloud storage, performs heavy CPU math via Sharp, uploads the result, and marks the database record as completed.

## Tech Stack

* **Runtime:** Node.js (with `tsx` for execution)
* **Language:** TypeScript
* **API Framework:** Fastify (Lightweight & high performance)
* **Job Queue:** BullMQ & Redis
* **Image Engine:** Sharp (Fast, `libvips`-based processing)
* **ORM:** Prisma
* **Database:** PostgreSQL (Neon / Supabase)
* **Storage:** Cloudflare R2 / Supabase Storage

## Project Structure

The codebase is organized using a domain-driven, modular approach suitable for Fastify plugins:

```text
image-processing-backend/
├── src/
│   ├── plugins/            # Global setups (Prisma, Redis clients)
│   ├── routes/             # Feature-based endpoint modules
│   │   └── images/
│   │       ├── index.ts    # Maps URL paths to handlers
│   │       ├── schemas.ts  # JSON Input Validation (Typebox)
│   │       └── handler.ts  # The actual business logic
│   │       └── service.ts  
│   ├── api.ts              # API Gateway entry point
│   └── worker.ts           # Independent Background Worker script
├── prisma/
│   └── schema.prisma       # Database schema definition
├── .env                    # Environment variables
└── package.json
```

## How to run
1. clone the project
```text
git clone [project_git_url]
```
2. initiate prisma with whatever PostgresSQL host of your choice
```text
prisma generate
```
3. run it
```text
npm run dev:api
```
now it should be available on `localhost:3000`. I plan to push this on prod once all the essential parts are completed.
