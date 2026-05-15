import { z } from 'zod';
import { BadRequestError } from '../../shared/errors/bad-request-error';
import { DuplicatedItemError } from '../../shared/errors/duplicated-item-error';
import { NotFoundError } from '../../shared/errors/not-found-error';
import { IUser, UserRole, UserStatus } from './user-entity';
import { create, findByEmail, findById } from './user-repository';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole),
  startDate: z.string().datetime(),
  status: z.nativeEnum(UserStatus),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

export function createUser(body: unknown): IUser {
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues
      .map((e: { message: string }) => e.message)
      .join(', ');
    throw new BadRequestError(message);
  }

  const data = result.data;

  const existing = findByEmail(data.email);
  if (existing) {
    throw new DuplicatedItemError('Email already in use');
  }

  const user: IUser = {
    id: crypto.randomUUID(),
    email: data.email,
    name: data.name,
    role: data.role,
    startDate: new Date(data.startDate),
    status: data.status,
  };

  return create(user);
}

const uuidSchema = z.string().uuid();

export function getUserById(id: unknown): IUser {
  const result = uuidSchema.safeParse(id);

  if (!result.success) {
    throw new BadRequestError('Invalid user ID: must be a valid UUID');
  }

  const user = findById(result.data);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
