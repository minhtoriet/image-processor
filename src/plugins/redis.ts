import { createClient } from 'redis';
import { Queue, createNodeRedisClient } from 'bullmq';

const redisClientSingleton = () => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error("REDIS_URL env var not defined");
    }
    const client = createClient({ url: redisUrl });
    client.on('error', (err) => console.error('Redis Client Error:', err));
    return client;
}
declare global {
    var redisGlobal: undefined | ReturnType<typeof redisClientSingleton>;
    var imageQueueGlobal: undefined | Queue;
}
export const rawRedisClient = globalThis.redisGlobal ?? redisClientSingleton();

// 2. Setup your message queue connection
const connection = createNodeRedisClient(rawRedisClient);

export const imageQueue = globalThis.imageQueueGlobal ?? new Queue('image-processing-queue', { connection });

if (process.env.NODE_ENV !== 'production'){
    globalThis.imageQueueGlobal = imageQueue;
}