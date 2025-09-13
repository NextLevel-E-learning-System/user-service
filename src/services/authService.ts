import axios from 'axios';
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3333/auth/v1';

export async function createAuthUser(email: string, senha: string) {
  const resp = await axios.post(`${AUTH_URL}/register`, { email, senha });
  return resp.data.usuario;
}
