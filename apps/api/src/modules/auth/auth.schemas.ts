import { z } from 'zod';
import type { UserRow } from '../../db/schema.js';

export const registerBodySchema = z.object({
  email: z.email().max(254),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
});

export const loginBodySchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const userSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});

export const authResponseSchema = z.object({
  token: z.string().describe('JWT bearer token'),
  user: userSchema,
});

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type UserDto = z.infer<typeof userSchema>;

export function toUserDto(user: UserRow): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}
