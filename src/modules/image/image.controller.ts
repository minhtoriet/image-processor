// The actual controller logic
import { type FastifyRequest, type FastifyReply } from "fastify";
import {
    saveFileToStorage,
    createImageJob,
    enqueueImageProcessing,
    ImageServiceError,
    findJobForUser,
} from './image.service.ts';
import type { ImageJobResponseDto, JobParamsDto } from "./image.schema.ts";
import { getSignedDownloadUrl } from "../../services/storage.service.ts";

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function imageUploadHandler(
    request: FastifyRequest,
    reply: FastifyReply) {

    const data = await request.file({ limits: { fileSize: MAX_FILE_SIZE } });
    if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
    }
    if (!ALLOWED_MIME_TYPES.has(data.mimetype)) {
        return reply.code(400).send({ error: `File extension: ${data.mimetype} not supported` });
    }
    try {
        const { storedFileName, destPath } = await saveFileToStorage(data);
        const job = await createImageJob({
            userId: request.user.id,
            presetId: 1, // assume this is the only preset, for ascii gen
            originalImageDir: destPath,
        });
        await enqueueImageProcessing(request.server.imageQueue, job.id, destPath);

        const responseBody: ImageJobResponseDto = {
            id: job.id,
            filename: storedFileName,
            url: destPath,
            createdAt: job.createdAt.toISOString(),
        }
        return reply.code(201).send(responseBody);
    } catch (err) {
        if (err instanceof ImageServiceError) {
            return reply.code(err.statusCode).send({ error: err.message });
        }
        request.log.error(err);
        return reply.code(500).send({ error: 'Internal server error' });
    }
};

export async function getJobHandler(
    request: FastifyRequest<{Params: JobParamsDto}>,
    reply: FastifyReply
) {
    const {id} = request.params;
    const job = await findJobForUser(id);
    if (!job) return reply.code(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Job not found'
    });
    return {
        id: job.id,
        status: job.status,
        imageUrl: job.resultImageUrl ? await getSignedDownloadUrl(job.resultImageUrl): null,
        textUrl: job.resultTextUrl ? await getSignedDownloadUrl(job.resultTextUrl): null,
    }
}