import { z } from 'zod';
export const updateUserSchema = z.object({   cpf: z.string().min(11).max(14), nome: z.string(),  departamento: z.string().optional(), cargo: z.string().optional() });
export const updateXpSchema = z.object({ delta: z.number().int() });