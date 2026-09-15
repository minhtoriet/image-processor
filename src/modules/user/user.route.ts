import type { FastifyInstance } from "fastify";
import { registerUserHandler, loginUserHandler } from './user.controller';
import { errorResponseSchema } from '../error.schema'
import { registerUserSchema, registerUserResponseSchema, loginUserSchema, loginUserResponseSchema } from './user.schema'
import { Type } from "@sinclair/typebox";

async function userRoutes(app: FastifyInstance) {
    app.post('/register', {
        schema: {
            body: registerUserSchema,
            response: {
                201: registerUserResponseSchema,
                500: errorResponseSchema
            },
        },
    }, registerUserHandler);
    app.post('/login', {
        schema: {
            body: loginUserSchema,
            response: {
                200: loginUserResponseSchema,
                401: Type.Object({ error: Type.String() }),
                500: errorResponseSchema,
            }
        }
    }, loginUserHandler);
}

export default userRoutes;