import { z } from 'zod';
export const createUserSchema = z.object({ id: z.string().uuid(), cpf: z.string().min(11).max(14), nome: z.string(), email: z.string().email(), departamento: z.string().optional(), cargo: z.string().optional() });
export const updateXpSchema = z.object({ delta: z.number().int() });