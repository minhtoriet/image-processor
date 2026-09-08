// The actual controller logic
import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";

interface UploadBody {
    imageName:string;
}

export async function handleImageUpload(
    request: FastifyRequest<{Body: UploadBody}>,
    reply: FastifyReply
){
    const {imageName} = request.body;
    const jobId = randomUUID();
    //business logic in services
    
    //just send a 202 back
    return reply.code(202).send({success:true});
}