import { publishDomainEvent } from '../utils/events.js';
import { updateUser, findById, findDepartments, checkDepartmentExists, createInstructor, updateInstructorBio, createDepartment, updateDepartment, findDepartment, listUsers, updateUserComposite, findInstructors, findUserAchievements, getAdminDashboardData } from '../repositories/userRepository.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../config/logger.js';

export async function getMe(userId: string) {
  if (!userId) throw new HttpError(401, 'missing_user_context');
  const user = await findById(userId);
  if (!user) throw new HttpError(404, 'user_not_found');
  return user;
}

export async function getById(id: string) {
  const user = await findById(id);
  if (!user) throw new HttpError(404, 'not_found');
  return user;
}

export async function getDepartments() {
  return await findDepartments();
}

export async function registerInstructor(data: { funcionario_id: string; cursos_id: string[]; biografia: string | null; }, actorRoles: string[]) {
// Função mantida apenas para compatibilidade, agora delega para compositeUpdate
return compositeUpdate(data.funcionario_id, { tipo_usuario: 'INSTRUTOR', cursos_id: data.cursos_id, biografia: data.biografia }, ['ADMIN'], data.funcionario_id);
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
  return await findDepartment(data.codigo);
}

export async function updateDept(codigo: string, data: { nome?: string; descricao?: string | null; gestor_id?: string | null; }, roles: string[]) {
  if (!roles.includes('ADMIN')) throw new HttpError(403, 'forbidden');
  const existing = await findDepartment(codigo);
  if (!existing) throw new HttpError(404, 'department_not_found');
  await updateDepartment(codigo, data);
  publishDomainEvent('users.v1.DepartmentUpdated', { codigo, ...data }).catch(err => logger.error({ err }, 'publish_department_updated_failed'));
  return await findDepartment(codigo);
}

export async function listAllUsers(params: { departamento_id?: string; tipo_usuario?: string; status?: string; search?: string; limit: number; offset: number; }, roles: string[]) {
  if (!roles.includes('ADMIN')) throw new HttpError(403, 'forbidden');
  // Repassar apenas campos suportados por listUsers (ajustaremos repo se necessário)
  const { items, total } = await listUsers({
    departamento: params.departamento_id,
    status: params.status,
    search: params.search,
    limit: params.limit,
    offset: params.offset
  });
  return { items, total };
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
  const current = await findById(userId);
  if (!current) throw new HttpError(404, 'user_not_found');

  if (payload.departamento_id) {
    const ok = await checkDepartmentExists(payload.departamento_id);
    if (!ok) throw new HttpError(400, 'invalid_department');
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

  const updated = await findById(userId);
  publishDomainEvent('users.v1.UserCompositeUpdated', { userId, changes: Object.keys(payload) }).catch(err => logger.error({ err }, 'publish_user_composite_updated_failed'));
  return updated;
}

// ========== NOVAS FUNÇÕES ==========

export async function listInstructors() {
  return await findInstructors();
}

export async function getUserAchievements(userId: string) {
  return await findUserAchievements(userId);
}
