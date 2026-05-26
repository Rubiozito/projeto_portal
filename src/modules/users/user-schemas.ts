import { z } from 'zod';

import { UserRole } from './user-entity';

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().toLowerCase(),
  role: z.nativeEnum(UserRole),
  companyId: z.string().min(1).optional(),
});

const UpdateUserBaseSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().toLowerCase(),
  companyId: z.string().min(1).nullable(),
});

export const UpdateUserSchema = UpdateUserBaseSchema.partial().refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'At least one field must be provided' },
);

export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

const UpdateUserPartialSchema = UpdateUserBaseSchema.partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserPartialSchema>;
