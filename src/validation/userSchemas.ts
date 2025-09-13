import { z } from 'zod';

export const updateUserSchema = z.object({
  nome: z.string().min(1).optional(),
  cpf: z.string().regex(/^\d{11}$/).optional(),
  email: z.string().email().optional(),
  departamento_id: z.string().min(1).optional(),
  cargo: z.string().min(1).optional(),
  status: z.enum(['ATIVO','INATIVO']).optional(),
  tipo_usuario: z.enum(['FUNCIONARIO','INSTRUTOR','ADMIN']).optional(),
  biografia: z.string().max(4000).nullable().optional()
}).refine(o => Object.keys(o).length>0, { message: 'Nenhum campo para atualizar' });

// Filtros listagem
export const listUsersQuerySchema = z.object({
  departamento_id: z.string().optional(),
  tipo_usuario: z.enum(['FUNCIONARIO','INSTRUTOR','ADMIN']).optional(),
  status: z.enum(['ATIVO','INATIVO']).optional(),
  search: z.string().min(2).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});



// Departamentos
export const departmentCreateSchema = z.object({
  codigo: z.string().min(1).regex(/^[A-Z0-9_]{2,20}$/),
  nome: z.string().min(2),
  descricao: z.string().nullable().optional(),
  gestor_funcionario_id: z.string().uuid().nullable().optional(),
  ativo: z.boolean().optional()
});
export const departmentUpdateSchema = departmentCreateSchema.partial();

// Cargos
export const cargoCreateSchema = z.object({
  codigo: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/).optional(),
  nome: z.string().min(2).max(100)
});
export const cargoUpdateSchema = cargoCreateSchema.partial();

export const listCargosQuerySchema = z.object({
  search: z.string().min(2).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});