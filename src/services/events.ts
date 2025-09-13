import { publishEvent } from "../config/rabbitmq";

export async function emitUserRoleChanged(userId: string, role: string) {
  await publishEvent('user.events', { type: 'user.role_changed', payload: { userId, role } });
}