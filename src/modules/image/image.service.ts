import { prisma } from '../../lib/prisma';
import type { Queue } from 'bullmq';
import type { MultipartFile } from '@fastify/multipart';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export class ImageServiceError extends Error {
    constructor(message: string, public statusCode: 400 | 500) {
        super(message);
    }
}

export async function saveFileToDisk(file: MultipartFile) {
    const ext = path.extname(file.filename) || '';
    const storedFilename = `${randomUUID()}${ext}`;
    const destPath = path.join(UPLOAD_DIR, storedFilename);

    await pipeline(file.file, createWriteStream(destPath));

    // fastify/multipart flags this on the stream once the byte limit is hit
    if (file.file.truncated) {
        throw new ImageServiceError('File exceeds max allowed size', 400);
    }

    //const { size } = await stat(destPath);
    return { storedFilename, destPath };
}

export async function createImageJob(
    params: {
        userId: string;
        presetId: number;
        originalImageDir: string
    },
) {
    return prisma.imageJob.create({
        data: {
            originalImageDir: params.originalImageDir,
            userId: params.userId,
            presetId: params.presetId,
        },
    });
}

export async function enqueueImageProcessing(
    queue: Queue,
    jobId: number,
    filePath: string,
) {
    await queue.add('process-image', { jobId: jobId, filePath });
}