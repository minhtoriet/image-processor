// App entry point (Stitches plugins and routes together)
import 'dotenv/config';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { prisma } from './lib/prisma';
import userRoutes from './modules/user/user.route';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { SetErrorFunction, DefaultErrorFunction } from '@sinclair/typebox/errors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { Queue } from 'bullmq';
import { rawRedisClient, imageQueue } from './lib/redis';
import { prismaPlugin } from './plugins/prisma';
import { redisPlugin } from './plugins/redis';
import multipart from 'fastify';
import { imageRoutes } from './modules/image/image.route';
import { fastifyJwt } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
    redis: typeof rawRedisClient;
    imageQueue: Queue;
  }
}

SetErrorFunction((param) => {
  return param.schema.errorMessage ?? DefaultErrorFunction(param)
})


export const app = Fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>();


//healthcheck
app.get("/healthcheck", async function (request, reply) {
  return reply.code(202).send({ status: "OK" });
});
//prisma test
app.get('/api/image-jobs/count', async (request, reply) => {
  const count = await app.prisma.imageJob.count();
  return reply.code(202).send({
    success: true,
    count
  });
});
app.decorate('auth',async(request: FastifyRequest, reply: FastifyReply)=>{
  try {
    await request.jwtVerify();
  } catch (err){
    return reply.send(err);
  }
});

const startServer = async () => {
  try {
    await app.register(prismaPlugin);
    await app.register(redisPlugin);
    await app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    });
    await app.register(fastifyJwt,{
      secret: process.env.SECRET_KEY!,
    });
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
    await app.register(imageRoutes, {prefix: '/api/images'})
    await app.listen({ port: 3000 });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();