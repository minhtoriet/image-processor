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


export async function imageRoutes(fastify: FastifyInstance) {
  await mkdir(UPLOAD_DIR, {recursive : true})
  fastify.post('/upload', {
    schema: {
      summary: 'upload an image',
      response: {
        201: ImageJobResponseSchema,
        400: Type.Object({ error: Type.String() }),
        500: errorResponseSchema,
      }
    }
  },imageUploadHandler);
}