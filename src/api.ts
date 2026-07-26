// App entry point (Stitches plugins and routes together)

import Fastify from 'fastify';
import {Queue} from 'bullmq';
import 'dotenv/config';

// 1. Instantiate Fastify with built-in Pino logger enabled
const fastify = Fastify({
  logger: true
});

// 2. Setup your message queue connection
const imageQueue = new Queue('image-processing-queue', {
  connection: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' }
});

//healthcheck
fastify.get("/healthcheck",async function(){
  return {status: "OK"};
});

// 3. Define your upload trigger route
fastify.post('/api/upload', async (request, reply) => {
  const jobId = Math.random().toString(36).substring(7); // Temporary random ID mock
  
  // Push processing instructions into the message queue
  await imageQueue.add('process-image-task', {
    jobId,
    storageKey: 'raw/sample-image.jpg'
  });

  // Fastify infers JSON automatically if you return a plain object
  return reply.code(202).send({
    success: true,
    message: 'Image queued for processing',
    jobId
  });
});

// 4. Boot the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Fastify API Gateway running on port 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();