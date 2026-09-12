// App entry point (Stitches plugins and routes together)

import 'dotenv/config';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from './plugins/prisma';
import userRoutes from './modules/user/user.route';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { SetErrorFunction, DefaultErrorFunction } from '@sinclair/typebox/errors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { rawRedisClient, imageQueue } from './plugins/redis';
import { Queue } from 'bullmq';


declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma,
    redis: typeof rawRedisClient,
    imageQueue: Queue,
  }
}

SetErrorFunction((param) => {
  return param.schema.errorMessage ?? DefaultErrorFunction(param)
})

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
const prismaPlugin = fp(async (fastify, options) => {
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
});
const redisPlugin = fp(async (fastify) => {
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

const app = Fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>();


//healthcheck
app.get("/healthcheck", async function (request, reply) {
  return reply.code(202).send({ status: "OK" });
});
//main page, whatevs
app.get('/', async (request, reply) => {
  return reply.code(202).send({ status: "Ok from the main page" });
});
//prisma test
app.get('/api/image-jobs/count', async (request, reply) => {
  const count = await app.prisma.imageJob.count();
  return reply.code(202).send({
    success: true,
    count
  });
});

// 3. Define your upload trigger route
// fastify.post('/api/upload', async (request, reply) => {
//   const jobId = Math.random().toString(36).substring(7); // Temporary random ID mock

//   // Push processing instructions into the message queue
//   await imageQueue.add('process-image-task', {
//     jobId,
//     storageKey: 'raw/sample-image.jpg'
//   });

//   // Fastify infers JSON automatically if you return a plain object
//   return reply.code(202).send({
//     success: true,
//     message: 'Image queued for processing',
//     jobId
//   });
// });

// 4. Boot the server

const startServer = async () => {
  try {
    await app.register(prismaPlugin);
    await app.register(redisPlugin);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'My API',
          description: 'Fastify TypeBox Swagger API Documentation',
          version: '1.0.0',
        },
      },
    })
    await app.register(fastifySwaggerUi, {
      routePrefix: '/documentation', // Access UI at http://localhost:3000/documentation
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    })
    await app.register(userRoutes, { prefix: '/api/users' });

    await app.listen({ port: 3000 });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();