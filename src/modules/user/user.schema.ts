import { Type, type Static } from '@sinclair/typebox'

export const registerUserSchema = Type.Object({
    email: Type.String({
        maxLength: 200,
        format: 'email',
    }),
    password: Type.String({
        maxLength: 200,
        minLength: 8,
    }),
})
export const loginUserSchema = Type.Object({
    email: Type.String({
        maxLength: 200,
        format: 'email',
    }),
    password: Type.String({
        maxLength: 200,
        minLength: 8,
    })
});
export const registerUserResponseSchema = Type.Object({
    email: Type.String()
});
export const loginUserResponseSchema = Type.Object({
    accessToken: Type.String()
});
// Extract the inferred TypeScript interface automatically
export type RegisterUserDto = Static<typeof registerUserSchema>
export type LoginUserDto = Static<typeof loginUserSchema>

