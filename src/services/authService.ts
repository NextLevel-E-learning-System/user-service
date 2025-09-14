import axios from 'axios';
const AUTH_URL = process.env.AUTH_SERVICE_BASE_URL || 'http://localhost:3333/auth/v1';

export async function createAuthUser(email: string, senha: string) {
  const resp = await axios.post(`${AUTH_URL}/auth/v1/register`, { email, senha });
  return resp.data.usuario;
}

export async function resetPassword(email: string, senha?: string) {
  await axios.post(`${AUTH_URL}/auth/v1/reset-password`, { email, senha });
}
