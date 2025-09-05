import { z } from 'zod';

// POST /users/v1 (completar cadastro inicial)
export const updateUserSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().regex(/^\d{11}$/),
  email: z.string().email().optional(),
  departamento_id: z.string().min(1),
  cargo: z.string().min(1)
});

// Filtros listagem
export const listUsersQuerySchema = z.object({
  departamento_id: z.string().optional(),
  tipo_usuario: z.enum(['FUNCIONARIO','INSTRUTOR','ADMIN']).optional(),
  status: z.enum(['ATIVO','INATIVO']).optional(),
  search: z.string().min(2).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

// PATCH /users/v1/:id (composite)
export const patchUserCompositeSchema = z.object({
  nome: z.string().min(1).optional(),
  departamento_id: z.string().min(1).optional(),
  cargo: z.string().min(1).optional(),
  email: z.string().email().optional(),
  status: z.enum(['ATIVO','INATIVO']).optional(),
  tipo_usuario: z.enum(['FUNCIONARIO','INSTRUTOR','ADMIN']).optional(),
  biografia: z.string().max(4000).nullable().optional(),
  cursos_id: z.array(z.string()).optional(),
}).refine(o => Object.keys(o).length>0, { message: 'Nenhum campo para atualizar' });

// Departamentos
export const departmentCreateSchema = z.object({
  codigo: z.string().min(1).regex(/^[A-Z0-9_]{2,10}$/),
  nome: z.string().min(2),
  descricao: z.string().nullable().optional(),
  gestor_id: z.string().uuid().nullable().optional()
});
export const departmentUpdateSchema = departmentCreateSchema.partial();