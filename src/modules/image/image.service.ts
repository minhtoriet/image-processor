import { prisma } from '../../lib/prisma';
import type { Queue } from 'bullmq';
import type { MultipartFile } from '@fastify/multipart';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { uploadFile } from '../../services/storage.service';

export class ImageServiceError extends Error {
    constructor(message: string, public statusCode: 400 | 413 | 500) {
        super(message);
    }
}

export async function saveFileToStorage(file: MultipartFile) {
    const ext = path.extname(file.filename) || '';
    const storedKey = `uploads/${randomUUID()}${ext}`;

    try{
        const buffer = await file.toBuffer();
        await uploadFile(storedKey, buffer, file.mimetype);
    }
    catch (err: any){        
        if (err.code === 'FST_REQ_FILE_TOO_LARGE') {
            throw new ImageServiceError('File exceeds max allowed size', 413);
        }
        throw err; 
    }

    //const { size } = await stat(destPath);
    return { storedFileName: storedKey, destPath: storedKey };
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
    await queue.add('process-image', { jobId: jobId, originalImageDir: filePath });
}