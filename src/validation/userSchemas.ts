import { z } from 'zod';

// Schema para completar o cadastro do usuário
export const updateUserSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter exatamente 11 dígitos'),
  email: z.string().email('Email deve ser válido').optional(), // Apenas INSTRUTOR pode alterar
  departamento_id: z.string().min(1, 'Departamento é obrigatório'),
  cargo: z.string().min(1, 'Cargo é obrigatório')
});

export const updateXpSchema = z.object({ delta: z.number().int() });