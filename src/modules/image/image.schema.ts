// JSON Input Validation rules (instead of Data Annotations)
import {Type, type Static } from '@sinclair/typebox';

export const ImageJobResponseSchema = Type.Object({
  id: Type.Number(),
  filename: Type.String(),
  url: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
});

export type ImageJobResponseDto = Static<typeof ImageJobResponseSchema>;