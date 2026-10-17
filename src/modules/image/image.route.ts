// Maps URL paths to handlers
// routes/images.ts
import type { FastifyInstance } from "fastify";
import { ImageJobResponseSchema, JobParamsSchema, JobResponseSchema, type JobParamsDto } from "./image.schema";
import { Type } from '@sinclair/typebox'
import { errorResponseSchema } from "../error.schema";
import { getJobHandler, imageUploadHandler } from "./image.controller";

export async function imageRoutes(app: FastifyInstance) {
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
      },
      security: [{ bearerAuth: [] }]
    },
    preHandler: [app.auth],
  }, imageUploadHandler);

  app.get<{ Params: JobParamsDto }>('/:id', {
    preHandler: [app.auth],
    schema: {
      params: JobParamsSchema,
      response: {
        200: JobResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    }
  }, getJobHandler);
}