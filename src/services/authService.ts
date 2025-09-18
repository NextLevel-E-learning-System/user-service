import axios from 'axios';
const AUTH_URL = process.env.AUTH_SERVICE_BASE_URL || 'http://localhost:3333/auth/v1';

// Agora o auth-service NÃO retorna mais a senha; ela segue somente via evento para notification-service
export async function createAuthUser(email: string): Promise<{ id: string; email: string }> {
  const resp = await axios.post(`${AUTH_URL}/register`, { email });
  return { id: resp.data.usuario.id, email: resp.data.usuario.email };
}

// Reset agora deve enviar novaSenha (senha gerada aqui ou fornecida) conforme contrato no auth-service
export async function resetPassword(email: string, novaSenha: string): Promise<void> {
  await axios.post(`${AUTH_URL}/reset-password`, { email, novaSenha });
}
