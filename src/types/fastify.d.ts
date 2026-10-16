import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './lib/prisma';
import { rawRedisClient } from './lib/redis';
import { Queue } from 'bullmq';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: typeof prisma;
        redis: typeof rawRedisClient;
        imageQueue: Queue;
        auth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}