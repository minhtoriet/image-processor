import { prisma } from "../../plugins/prisma";
import { hashPassword } from "../hash";
import { type RegisterUserDto } from "./user.schema";

export async function createUser(input: RegisterUserDto) {
    const {password, ...rest} = input;
    const hash = await hashPassword(password);

    const user = await prisma.user.create({
        data:{...rest, password:hash}
    });
    return user;
}
