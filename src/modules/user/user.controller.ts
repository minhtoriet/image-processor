import type { FastifyReply, FastifyRequest } from "fastify";
import { createUser } from "./user.service";
import type { RegisterUserDto } from "./user.schema";

export async function registerUserHandler(
    request:FastifyRequest<{ Body:RegisterUserDto }>, 
    reply:FastifyReply){
    
    try{
        const user = await createUser(request.body);
        return reply.code(201).send(user);
    }catch(err){
        console.log(err);
        return reply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "Could not create user",
        });
    }
}
