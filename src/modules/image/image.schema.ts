// JSON Input Validation rules (instead of Data Annotations)
import {Type, type Static } from '@sinclair/typebox';

export const ImageJobResponseSchema = Type.Object({
  id: Type.Number(),
  filename: Type.String(),
  url: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
});

export const JobParamsSchema = Type.Object({
  id: Type.Integer({minimum: 1}),
}); 

export const JobResponseSchema = Type.Object({
  id: Type.Integer(),
  status: Type.String(),
  imageUrl: Type.Union([Type.String(),Type.Null()]),
  textUrl: Type.Union([Type.String(),Type.Null()]),
})

export type JobParamsDto = Static<typeof JobParamsSchema>;
export type JobResponseDto = Static<typeof JobResponseSchema>;
export type ImageJobResponseDto = Static<typeof ImageJobResponseSchema>;

