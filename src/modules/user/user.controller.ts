import type { FastifyReply, FastifyRequest } from "fastify";
import { createUser, findUserByEmail } from "./user.service";
import type { LoginUserDto, RegisterUserDto } from "./user.schema";
import { checkPassword } from "../hash";
import { app } from "../../api";

export async function registerUserHandler(
    request: FastifyRequest<{ Body: RegisterUserDto }>,
    reply: FastifyReply) {

    try {
        const user = await createUser(request.body);
        return reply.code(201).send(user);
    } catch (err) {
        console.log(err);
        return reply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "Could not create user",
        });
    }
}

export async function loginUserHandler(
    request: FastifyRequest<{ Body: LoginUserDto }>,
    reply: FastifyReply) 
{
    try {
        const user = await findUserByEmail(request.body.email);
        if (!user) {
            return reply.code(401).send({error: 'invalid email or password'});
        }
        const isCorrectPassword = checkPassword(request.body.password, user.password);
        if (!isCorrectPassword) {
            return reply.code(401).send({error: 'invalid email or password'});
        }
        const { password, ...rest } = user;
        return { accessToken: app.jwt.sign(rest)};
    } catch (err) {
        console.log(err);
        return reply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "Could not authenticate user",
        });
    }
}