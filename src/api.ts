// App entry point (Stitches plugins and routes together)
import 'dotenv/config';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import userRoutes from './modules/user/user.route';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { SetErrorFunction, DefaultErrorFunction } from '@sinclair/typebox/errors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { prismaPlugin } from './plugins/prisma';
import { redisPlugin } from './plugins/redis';
import multipart from '@fastify/multipart';
import { imageRoutes } from './modules/image/image.route';
import { fastifyJwt } from '@fastify/jwt';
import cookie from '@fastify/cookie';

SetErrorFunction((param) => {
  return param.schema.errorMessage ?? DefaultErrorFunction(param)
})

export const app = Fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>();

app.decorate('auth', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err: any) {
    const expired = (err as {code?:string}).code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED';
    return reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: expired ? 'Token expired' : 'Invalid token',
    });
  }
});

//healthcheck
app.get("/healthcheck", async function (request, reply) {
  return reply.code(202).send({ status: "OK" });
});
//prisma test
app.post('/api/image-jobs/count',
  { schema: { security: [{ bearerAuth: [] }] }, preHandler: [app.auth] },
  async (request, reply) => {
    const count = await app.prisma.imageJob.count();
    return reply.code(202).send({
      success: true,
      count
    });
  });

const startServer = async () => {
  try {
    await app.register(prismaPlugin);
    await app.register(redisPlugin);
    await app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1,
      },
    });
    console.log('has multipart parser:', app.hasContentTypeParser('multipart/form-data'));
    await app.register(fastifyJwt, {
      secret: process.env.SECRET_KEY!,
      sign: { expiresIn: '1h' },
      cookie: { cookieName: 'token', signed: false },
    });
    await app.register(cookie);
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'My API',
          description: 'Fastify TypeBox Swagger API Documentation',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
    });
    await app.register(fastifySwaggerUi, {
      routePrefix: '/documentation', // Access UI at http://localhost:3000/documentation
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });
    await app.register(userRoutes, { prefix: '/api/users' });
    await app.register(imageRoutes, { prefix: '/api/images' });

    console.log(app.printRoutes());
    await app.listen({ port: 3000 });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();