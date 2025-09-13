import { z } from 'zod';

export const registerSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().regex(/^\d{11}$/, 'CPF must be 11 digits'),
  email: z.string().email(),
  departamento_id: z.string().min(1),
  cargo_nome: z.string().min(1)
});

export const updateUserSchema = z.object({
  nome: z.string().optional(),
  departamento_id: z.string().optional(),
  cargo_nome: z.string().optional(),
  email: z.string().email().optional()
});
