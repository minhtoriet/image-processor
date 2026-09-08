import { Type } from 'typebox'
import type {Static} from 'typebox';

export const registerUserSchema = Type.Object({
    email: Type.String({ maxLength: 200,
                        format: 'email',
                       }),
    password: Type.String({ maxLength: 200,
                            minLength: 8,
                        }),
})

export const registerUserResponseSchema = Type.Object({
    email: Type.String()
});
// Extract the inferred TypeScript interface automatically
export type RegisterUserDto = Static<typeof registerUserSchema>

