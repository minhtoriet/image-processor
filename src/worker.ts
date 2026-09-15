// Independent Background Worker script
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { connection } from './lib/redis';
import { prisma } from './lib/prisma';
import { processImageToAscii } from './services/ascii.service';

const worker = new Worker(
  'image-queue',
  async (job) => {
    // 1. Update DB status to PROCESSING
    await prisma.imageJob.update({
      where: { id: job.data.jobId },
      data: { status: 'PROCESSING' }
    });

    // 2. Perform CPU math
    const asciiResult = await processImageToAscii(job.data.imagePath);

    // 3. Update DB status to COMPLETED
    await prisma.imageJob.update({
      where: { id: job.data.jobId },
      data: { status: 'COMPLETED', resultDir: asciiResult }
    });
  },
  { connection: connection }
);

worker.run();
worker.on('completed', (job: Job, returnvalue: any) => {
    // Do something with the return value.
    console.log(`Job ${job.id} completed successfully`);
});
worker.on('error', err => {
    console.error(err);
});