import type { FastifyInstance } from "fastify";
import { registerUserHandler, loginUserHandler, logoutUserHandler, getCurrentUserHandler } from './user.controller.ts';
import { errorResponseSchema } from '../error.schema.ts'
import { registerUserSchema, registerUserResponseSchema, loginUserSchema, currentUserResponseSchema } from './user.schema.ts'

async function userRoutes(app: FastifyInstance) {
    app.post('/register', {
        schema: {
            body: registerUserSchema,
            response: {
                201: registerUserResponseSchema,
                409: errorResponseSchema,
                500: errorResponseSchema
            },
        },
    }, registerUserHandler);
    app.post('/login', {
        schema: {
            body: loginUserSchema,
            response: {
                204: { type: 'null' },
                401: errorResponseSchema,
                500: errorResponseSchema,
            }
        }
    }, loginUserHandler);
    app.post('/logout', {
        schema: {
            response: {
                204: { type: 'null' },
                401: errorResponseSchema,
                500: errorResponseSchema,
            }
        }
    }, logoutUserHandler);
    app.get('/me', {
        onRequest: [app.auth],
        schema: {
            response: {
                200: currentUserResponseSchema,
                401: errorResponseSchema,
            },
            security: [{ bearerAuth: [] }],
        },
    }, getCurrentUserHandler);
}


export default userRoutes;