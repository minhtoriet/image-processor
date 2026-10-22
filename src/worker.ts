// Independent Background Worker script
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { connection } from './lib/redis.ts';
import { prisma } from './lib/prisma.ts';
import { processImageToAscii } from './services/ascii.service.ts';
import { getFile, uploadFile } from './services/storage.service.ts';
import { randomUUID } from 'node:crypto';

const worker = new Worker(
  'image-queue',
  async (job) => {

    const { jobId, originalImageDir } = job.data;
    // 1. Update DB status to PROCESSING
    await prisma.imageJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    const original = await getFile(originalImageDir);
    const uuidKey = randomUUID();
    const outputImageKey = `output/image/${uuidKey}.png`;
    const outputAsciiKey = `output/ascii/${uuidKey}.txt`;
    // 2. Perform CPU math
    try {
      const { imageResult, asciiResult } = await processImageToAscii(original);
      await uploadFile(outputAsciiKey, asciiResult, 'text/plain');
      await uploadFile(outputImageKey, imageResult, 'image/png');
    }
    catch (err) {
      console.log(err);
      await prisma.imageJob.update({ where: { id: jobId }, data: { status: 'FAILED' } });
      throw err;
    }

    // 3. Update DB status to COMPLETED & save output keys
    await prisma.imageJob.update({
      where: { id: job.data.jobId },
      data: {
        status: 'COMPLETED',
        resultTextUrl: outputAsciiKey,
        resultImageUrl: outputImageKey,
      }
    });
  },
  { connection: connection,
    autorun: false,
   }
);

worker.run();
worker.on('completed', (job: Job, returnvalue: any) => {
  // Do something with the return value.
  console.log(`Job ${job.id} completed successfully`);
});
worker.on('error', err => {
  console.error(err);
});