import { Type, type Static, type TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export const errorResponseSchema = Type.Object({
    statusCode:Type.Number(),
    error:Type.String(),
    message:Type.String()
})
export type ErrorResponse = Static<typeof errorResponseSchema>

export function validateData<T extends TSchema>(schema :T, data:unknown){
    const errors = [...Value.Errors(schema,data)];
    if (errors.length > 0) {
        return {
            success: false,
            errors: errors.map((err) => ({
                field: err.path.replace('/', ''),
                message: err.message,
            })),
        }
    }
    return { success: true, errors: [] }
}