// Maps URL paths to handlers
// routes/images.ts
import type { FastifyInstance } from "fastify";

export async function imageRoutes(fastify: FastifyInstance) {
  fastify.post('/upload', async (request, reply) => {
    // 1. Use decorated Prisma
    const imageRecord = await fastify.prisma.imageJob.create({
      data: {  },
    });

    // 2. Use decorated BullMQ Queue
    await fastify.imageQueue.add('process-image', {
      imageId: imageRecord.id,
    });

    return { success: true, id: imageRecord.id };
  });
}