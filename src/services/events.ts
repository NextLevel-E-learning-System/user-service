import { publishEvent } from "../config/rabbitmq.js";

interface FuncionarioPayload { id: string; email: string; nome: string; [k: string]: unknown }

export async function emitUserRoleChanged(userId: string, role: string) {
  await publishEvent('user.role_changed', { userId, role });
}

export async function emitUserCreated(user: FuncionarioPayload, senha: string) {
  await publishEvent('user.created', { ...user, senha });
}

export async function emitUserPasswordReset(email: string, senha: string) {
  await publishEvent('user.password_reset', { email, senha });
}