import fp from 'fastify-plugin';
import { rawRedisClient, imageQueue } from '../lib/redis';

 // 2. Create the Fastify Plugin
// fp (fastify-plugin) ensures this decoration is available globally across all your routes
// ex: 
// export async function imageRoutes(fastify: FastifyInstance) {
//   fastify.post('/upload', async (request, reply) => {
//     // 1. Use decorated Prisma
//     const imageRecord = await fastify.prisma.image.create({
//       data: { status: 'PENDING' },
//     });
//     // 2. Use decorated BullMQ Queue
//     await fastify.imageQueue.add('process-image', {
//       imageId: imageRecord.id,
//     });
//     return { success: true, id: imageRecord.id };
//   });
// }

export const redisPlugin = fp(async (fastify) => {
  if (!rawRedisClient.isOpen) {
    await rawRedisClient.connect();
  }
  fastify.decorate('redis', rawRedisClient);
  fastify.decorate('imageQueue', imageQueue);
  fastify.addHook('onClose', async (server) => {
    await server.imageQueue.close();
    await server.redis.quit();
  });
});
