import type { FastifyInstance } from "fastify";
import {registerUserHandler} from './user.controller';
import {errorResponseSchema, validateData} from '../error.schema'
import {registerUserSchema, registerUserResponseSchema} from './user.schema'

async function userRoutes(app: FastifyInstance){
    app.post('/',{
        schema:{
            body:registerUserSchema,
            response:{
                201:registerUserResponseSchema,
                500:errorResponseSchema},
        },
    },registerUserHandler);
}

export default userRoutes;