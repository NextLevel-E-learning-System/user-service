import { publishEvent } from "../config/rabbitmq.js";

export async function emitUserRoleChanged(userId: string, role: string, changedBy?: string) {
  await publishEvent('user.role_changed', { 
    userId, 
    role, 
    changedBy,
    timestamp: new Date().toISOString() 
  });
}

export async function emitUserCreated(email: string, senha: string, userId: string, nome: string) {
  await publishEvent('user.created', { 
    userId,
    email, 
    senha, 
    nome,
    timestamp: new Date().toISOString() 
  });
}

export async function emitUserPasswordReset(email: string, userId: string, novaSenha: string, nome?: string) {
  await publishEvent('user.password_reset', { 
    userId,
    email, 
    senha: novaSenha,
    nome,
    timestamp: new Date().toISOString() 
  });
}

export async function emitUserUpdated(userId: string, changes: Record<string, unknown>, updatedBy?: string) {
  await publishEvent('user.updated', { 
    userId, 
    changes,
    updatedBy,
    timestamp: new Date().toISOString() 
  });
}

export async function emitUserDeactivated(userId: string, deactivatedBy?: string) {
  await publishEvent('user.deactivated', { 
    userId,
    deactivatedBy,
    timestamp: new Date().toISOString() 
  });
}