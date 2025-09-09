import { publishDomainEvent } from '../utils/events.js';
import { findUsers, findDepartments, createInstructor, updateInstructorBio, createDepartment, updateDepartment, updateUserComposite, findUserAchievements } from '../repositories/userRepository.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../config/logger.js';

export async function getById(userId: string) {
  if (!userId) throw new HttpError(401, 'missing_user_context');
  const user = await findUsers({ id: userId });
  if (!user) throw new HttpError(404, 'user_not_found');
  return user;
}

export async function getDepartments() {
  return await findDepartments();
}

export async function changeInstructorBio(funcionario_id: string, biografia: string | null, actorUserId: string) {
  if (funcionario_id !== actorUserId) throw new HttpError(403, 'cannot_edit_other_instructor_bio');
  await updateInstructorBio(funcionario_id, biografia);
  return { success: true };
}

export async function createDept(data: { codigo: string; nome: string; descricao?: string | null; gestor_id?: string | null; }, roles: string[]) {
  if (!roles.includes('ADMIN')) throw new HttpError(403, 'forbidden');
  await createDepartment(data);
  publishDomainEvent('users.v1.DepartmentCreated', data).catch(err => logger.error({ err }, 'publish_department_created_failed'));
  return await findDepartments({ codigo: data.codigo });
}

export async function updateDept(codigo: string, data: { nome?: string; descricao?: string | null; gestor_id?: string | null; }, roles: string[]) {
  if (!roles.includes('ADMIN')) throw new HttpError(403, 'forbidden');
  const existing = await findDepartments({ codigo });
  if (!existing) throw new HttpError(404, 'department_not_found');
  await updateDepartment(codigo, data);
  publishDomainEvent('users.v1.DepartmentUpdated', { codigo, ...data }).catch(err => logger.error({ err }, 'publish_department_updated_failed'));
  return await findDepartments({ codigo });
}

export async function listAllUsers(params: { departamento_id?: string; tipo_usuario?: string; status?: string; search?: string; limit: number; offset: number; }, roles: string[]) {
  if (!roles.includes('ADMIN')) throw new HttpError(403, 'forbidden');
  
  const result = await findUsers({
    departamento: params.departamento_id,
    tipo_usuario: params.tipo_usuario,
    status: params.status,
    search: params.search,
    limit: params.limit,
    offset: params.offset
  });
  
  return result;
}

export async function compositeUpdate(userId: string, payload: {
  nome?: string; departamento_id?: string; cargo?: string; email?: string; status?: 'ATIVO'|'INATIVO'; tipo_usuario?: string; biografia?: string | null; cursos_id?: string[];
}, roles: string[], actorUserId: string) {
  // Regras:
  // - ADMIN pode tudo
  // - INSTRUTOR pode alterar própria biografia e email (já tratado anteriormente) mas aqui simplificamos: se não ADMIN e tá alterando tipo/status => bloqueia
  const isAdmin = roles.includes('ADMIN');
  if (!isAdmin) {
    if (payload.status !== undefined || payload.tipo_usuario !== undefined) throw new HttpError(403, 'forbidden_admin_fields');
    if (payload.email && !roles.includes('INSTRUTOR')) throw new HttpError(403, 'email_change_not_allowed');
    if (userId !== actorUserId && (payload.biografia || payload.cursos_id || payload.nome || payload.departamento_id || payload.cargo || payload.email)) {
      throw new HttpError(403, 'cannot_edit_other_user');
    }
  }
  const current = await findUsers({ id: userId });
  if (!current) throw new HttpError(404, 'user_not_found');

  if (payload.departamento_id) {
    const dept = await findDepartments({ codigo: payload.departamento_id });
    if (!dept) throw new HttpError(400, 'invalid_department');
  }

  // Aplicar atualização principal
  await updateUserComposite(userId, {
    nome: payload.nome,
    departamento_id: payload.departamento_id,
    cargo: payload.cargo,
    email: payload.email,
    status: payload.status
  });

if (payload.tipo_usuario && isAdmin) {
  await updateUserComposite(userId, { tipo_usuario: payload.tipo_usuario });
  publishDomainEvent('users.v1.UserTypeChanged', { userId, tipo_usuario: payload.tipo_usuario }).catch(err => logger.error({ err }, 'publish_user_type_changed_failed'));
  // Se mudou para INSTRUTOR, cria registro na tabela instrutores
  if (payload.tipo_usuario === 'INSTRUTOR') {
    await createInstructor(userId, payload.cursos_id || [], payload.biografia ?? null);
    publishDomainEvent('users.v1.InstructorRegistered', { funcionario_id: userId, cursos_id: payload.cursos_id || [] }).catch(err => logger.error({ err }, 'publish_instructor_registered_failed'));
  }
}

  const updated = await findUsers({ id: userId });
  publishDomainEvent('users.v1.UserCompositeUpdated', { userId, changes: Object.keys(payload) }).catch(err => logger.error({ err }, 'publish_user_composite_updated_failed'));
  return updated;
}

export async function getUserAchievements(userId: string) {
  return await findUserAchievements(userId);
}
