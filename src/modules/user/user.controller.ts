import type { FastifyReply, FastifyRequest } from "fastify";
import { createUser, findUserByEmail, findUserById } from "./user.service";
import type { LoginUserDto, RegisterUserDto } from "./user.schema";
import { checkPassword } from "../hash";
import { app } from "../../api";

//plz use request.log.error(err) 
export async function registerUserHandler(
    request: FastifyRequest<{ Body: RegisterUserDto }>,
    reply: FastifyReply) {

    try {
        const user = await findUserByEmail(request.body.email);
        if (user) {
            return reply.code(409).send({ error: 'User already exists' });
        }
        const newUser = await createUser(request.body);
        return reply.code(201).send(newUser);
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
    reply: FastifyReply) {
    try {
        const user = await findUserByEmail(request.body.email);
        if (!user) {
            return reply.code(401).send({ error: 'invalid email or password' });
        }
        const isCorrectPassword = await checkPassword(request.body.password, user.password);
        if (!isCorrectPassword) {
            return reply.code(401).send({ error: 'invalid email or password' });
        }
        const { id, email } = user;
        const token = app.jwt.sign({ id: id, email: email });
        return reply
            .setCookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 2 * 60, // 2 minutes
            })
            .code(204)
            .send();
    } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "Could not authenticate user",
        });
    }
}

export async function logoutUserHandler(
    request: FastifyRequest,
    reply: FastifyReply) {
    try {
        return reply.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        }).code(204).send();
    } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "Could not logout user",
        });
    }
}

export async function getCurrentUserHandler(
    request: FastifyRequest,
    reply: FastifyReply) {
    const user = await findUserById(request.user.id);
    if (!user) {
        return reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'User no longer exists',
        });
    }
    return reply.code(200).send(user);

}