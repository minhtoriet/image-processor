// App entry point (Stitches plugins and routes together)

import Fastify from 'fastify';
import fp from 'fastify-plugin';
import {Queue} from 'bullmq';
import 'dotenv/config';
import {prisma} from './plugins/prisma';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

// 2. Create the Fastify Plugin
// fp (fastify-plugin) ensures this decoration is available globally across all your routes
const prismaPlugin = fp(async (fastify, options) => {
  // Attach the Prisma instance to Fastify
  fastify.decorate('prisma', prisma);
  // Gracefully disconnect from the database when the server shuts down
  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
});
// 1. Instantiate Fastify with built-in Pino logger enabled
const app = Fastify({
  logger: true
});

// 2. Setup your message queue connection
// const imageQueue = new Queue('image-processing-queue', {
//   connection: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' }
// });

//healthcheck
app.get("/healthcheck",async function(){
  return {status: "OK"};
});
//main page, whatevs
app.get('/',async () => {
  return {status:"Ok from the main page"}; 
});
//prisma test
app.get('/api/image-jobs/count',async(request, reply)=>{
  const count = await app.prisma.imageJob.count();
  return {
    success:true,
    count
  };
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
    await app.listen({ port: 3000 });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();