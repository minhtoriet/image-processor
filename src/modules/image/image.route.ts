// Maps URL paths to handlers
// routes/images.ts
import type { FastifyInstance } from "fastify";
import { ImageJobResponseSchema } from "./image.schema";
import { Type } from '@sinclair/typebox'
import { errorResponseSchema } from "../error.schema";
import { imageUploadHandler } from "./image.controller";
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');


export async function imageRoutes(app: FastifyInstance) {
  await mkdir(UPLOAD_DIR, {recursive : true})
  app.post('/upload', {
    schema: {
      summary: 'upload an image',
      consumes: ['multipart/form-data'],
      // body: Type.Object({
      //   file: Type.Unknown({ type: 'string', format: 'binary' } as any)
      // }),
      response: {
        201: ImageJobResponseSchema,
        400: Type.Object({ error: Type.String() }),
        500: errorResponseSchema,
      }
    },
    preHandler: [app.auth],
  },imageUploadHandler);
}