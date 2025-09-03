import { publishDomainEvent } from '../utils/events.js';
import { updateUser, findById, updateXp } from '../repositories/userRepository.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../config/logger.js';

export async function getMe(userId: string) {
  if (!userId) throw new HttpError(401, 'missing_user_context');
  const user = await findById(userId);
  if (!user) throw new HttpError(404, 'user_not_found');
  return user;
}

export async function update(data: {   cpf: string; nome: string;   departamento?: string; cargo?: string; }) {
  try {
    await updateUser(data);
    publishDomainEvent('users.v1.UserUpdated', {   email: data.email, name: data.nome })
      .catch(err => logger.error({ err }, 'failed_to_publish_UserUpdated'));
  } catch (err: any) {
    if (err.code === '23505') throw new HttpError(409, 'duplicate');
    throw err;
  }
  return { id: data.id };
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