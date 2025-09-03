import { publishDomainEvent } from '../utils/events.js';
import { updateUser, findById, updateXp, findDepartments, checkDepartmentExists } from '../repositories/userRepository.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../config/logger.js';

export async function getMe(userId: string) {
  if (!userId) throw new HttpError(401, 'missing_user_context');
  const user = await findById(userId);
  if (!user) throw new HttpError(404, 'user_not_found');
  return user;
}

export async function update(userId: string, data: { 
  nome: string; 
  cpf: string; 
  email?: string; 
  departamento_id: string; 
  cargo: string; 
}) {
  // Verificar se o departamento existe
  const departmentExists = await checkDepartmentExists(data.departamento_id);
  if (!departmentExists) {
    throw new HttpError(400, 'invalid_department', 'Departamento não encontrado');
  }

  // Buscar dados atuais do usuário
  const currentUser = await findById(userId);
  if (!currentUser) {
    throw new HttpError(404, 'user_not_found');
  }

  try {
    // Se CPF já está preenchido, não permitir alteração
    if (currentUser.cpf && currentUser.cpf !== data.cpf) {
      throw new HttpError(400, 'cpf_cannot_be_changed', 'CPF não pode ser alterado após ser definido');
    }

    await updateUser(userId, data);
    
    // Publicar evento de usuário atualizado
    publishDomainEvent('users.v1.UserUpdated', { 
      userId, 
      email: data.email || currentUser.email, 
      name: data.nome 
    }).catch(err => logger.error({ err }, 'failed_to_publish_UserUpdated'));
    
    // Retornar dados atualizados
    const updatedUser = await findById(userId);
    return updatedUser;
    
  } catch (err: any) {
    if (err.code === '23505') {
      if (err.constraint?.includes('cpf')) {
        throw new HttpError(409, 'cpf_already_exists', 'CPF já está em uso por outro usuário');
      }
      if (err.constraint?.includes('email')) {
        throw new HttpError(409, 'email_already_exists', 'Email já está em uso por outro usuário');
      }
      throw new HttpError(409, 'duplicate', 'Dados duplicados');
    }
    throw err;
  }
}

export async function getById(id: string) {
  const user = await findById(id);
  if (!user) throw new HttpError(404, 'not_found');
  return user;
}

export async function patchXp(id: string, delta: number) {
  const updated = await updateXp(id, delta);
  if (!updated) throw new HttpError(404, 'not_found');
  return updated;
}

export async function getDepartments() {
  return await findDepartments();
}