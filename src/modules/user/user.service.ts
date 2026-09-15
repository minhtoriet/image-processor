import { prisma } from "../../lib/prisma";
import { hashPassword } from "../hash";
import { type LoginUserDto, type RegisterUserDto } from "./user.schema";

export class UserServiceError extends Error {
    constructor(message: string, public statusCode: 400 | 500) {
        super(message);
    }
}

export async function createUser(input: RegisterUserDto) {
    const { password, ...rest } = input;
    const hash = await hashPassword(password);

    const user = await prisma.user.create({
        data: { ...rest, password: hash }
    });
    return user;
}

export async function findUserByEmail(email: string){
    return prisma.user.findUnique({
        where: {
            email: email,
        }
    });
}