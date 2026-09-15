// The actual controller logic
import { type FastifyRequest, type FastifyReply } from "fastify";
import {
  saveFileToDisk,
  createImageJob,
  enqueueImageProcessing,
  ImageServiceError,
} from './image.service';
import type { ImageJobResponseDto } from "./image.schema";

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function imageUploadHandler(
    request: FastifyRequest,
    reply: FastifyReply) {

    const data = await request.file({limits: {fileSize : MAX_FILE_SIZE}});
    if (!data) {
        return reply.code(400).send({error: 'No file uploaded'});
    }
    if (!ALLOWED_MIME_TYPES.has(data.mimetype)) {
        return reply.code(400).send({error: `File extension: ${data.mimetype} not supported`});
    }
    try {
        const { storedFilename, destPath } = await saveFileToDisk(data);
        const job = await createImageJob({
            userId: '60062713-cec8-48aa-9c9e-52604ea54dc4', 
            presetId: 1,
            originalImageDir: destPath, 
        });
        await enqueueImageProcessing(request.server.imageQueue, job.id, destPath);

        const responseBody : ImageJobResponseDto = {
            id: job.id,
            filename: storedFilename,
            url : destPath,
            createdAt: job.createdAt.toISOString(),
        }
        return reply.code(201).send(responseBody);
    } catch (err){
        if (err instanceof ImageServiceError){
            return reply.code(err.statusCode).send({error: err.message});
        }
        request.log.error(err);
        return reply.code(500).send({error: 'Internal server error'});
    }
};