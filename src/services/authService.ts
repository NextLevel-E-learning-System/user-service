import axios, { AxiosError } from 'axios';
import crypto from 'crypto';

// Normaliza a base do auth-service garantindo:
// 1. Protocolo explícito
// 2. Sem barra final duplicada
// 3. Sufixo /auth/v1 presente exatamente uma vez
// 4. Evitar (e avisar) uso do API Gateway para chamada interna
function resolveAuthBase(): string {
  let raw = (process.env.AUTH_SERVICE_BASE_URL || 'http://auth-service:3333/auth/v1').trim();
  if (!/^https?:\/\//i.test(raw)) raw = 'http://' + raw; // default http
  // Remove barras finais excedentes (mantém "http://host" e depois adiciona sufixo)
  raw = raw.replace(/\/$/, '');

  // Já tem /auth/v1?
  if (/\/auth\/v1$/i.test(raw)) return raw;
  // Tem /auth mas não /v1
  if (/\/auth$/i.test(raw)) return raw + '/v1';
  // Não tem nada -> acrescenta caminho completo
  return raw + '/auth/v1';
}

const AUTH_BASE = resolveAuthBase();
// URL interna opcional para fallback (ex: http://auth-service:3333)
const AUTH_INTERNAL_BASE_RAW = process.env.AUTH_SERVICE_INTERNAL_URL?.trim();
const AUTH_INTERNAL_BASE = AUTH_INTERNAL_BASE_RAW ? (() => {
  let v = AUTH_INTERNAL_BASE_RAW;
  if (!/^https?:\/\//i.test(v)) v = 'http://' + v;
  v = v.replace(/\/$/, '');
  if (/\/auth\/v1$/i.test(v)) return v;
  if (/\/auth$/i.test(v)) return v + '/v1';
  return v + '/auth/v1';
})() : undefined;

// Cliente Axios com timeout para evitar ficar preso e gerar 502 em cascata
const http = axios.create({
  baseURL: AUTH_BASE,
  timeout: Number(process.env.AUTH_HTTP_TIMEOUT_MS || 8000),
  headers: {
    'x-internal-call': 'user-service'
  }
});

function buildErrorContext(err: unknown, operation: string, extra?: Record<string, unknown>) {
  const base: Record<string, unknown> = {
    op: operation,
    authBase: AUTH_BASE,
    viaGateway: /api-gateway/i.test(AUTH_BASE),
    ...extra
  };
  if (err instanceof AxiosError) {
    base.kind = 'axios';
    base.code = err.code;
    base.status = err.response?.status;
    base.statusText = err.response?.statusText;
    base.responseBody = err.response?.data;
    base.url = err.config?.url;
    base.method = err.config?.method;
    base.timeout = err.config?.timeout;
  } else if (err instanceof Error) {
    base.kind = 'error';
    base.message = err.message;
  } else {
    base.kind = 'unknown';
  }
  return base;
}

function hasErrorField(obj: unknown): obj is { error: string } {
  if (typeof obj !== 'object' || obj === null) return false;
  if (!('error' in obj)) return false;
  const val = (obj as Record<string, unknown>).error;
  return typeof val === 'string';
}

function logWarn(msg: string, ctx: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.warn('[authService]', msg, JSON.stringify(ctx));
}
function logError(msg: string, ctx: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.error('[authService]', msg, JSON.stringify(ctx));
}

// Gera um correlation id simples caso o chamador não injete um
function correlationId() {
  return crypto.randomUUID();
}

// Agora o auth-service NÃO retorna mais a senha; ela segue somente via evento para notification-service
export async function createAuthUser(email: string): Promise<{ id: string; email: string }> {
  const cid = correlationId();
  if (/api-gateway/i.test(AUTH_BASE)) {
    logWarn('Chamando auth-service via API Gateway (recomendado usar URL interna para reduzir latência e evitar 502).', { authBase: AUTH_BASE, cid });
  }
  try {
    const resp = await http.post('/register', { email }, { headers: { 'x-correlation-id': cid } });
    if (!resp.data?.usuario?.id) {
      throw new Error('Resposta do auth-service sem campo usuario.id');
    }
    return { id: resp.data.usuario.id, email: resp.data.usuario.email };
  } catch (err) {
    const ctx = buildErrorContext(err, 'createAuthUser', { email, cid });
    logError('Falha ao registrar usuário no auth-service', ctx);

    // Fallback: se estamos usando gateway e há INTERNAL configurada, tentar uma segunda vez
    const transientCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
    const shouldFallback = AUTH_INTERNAL_BASE && /api-gateway/i.test(AUTH_BASE) && (
      transientCodes.includes(String(ctx.code)) || ctx.status === 502 || ctx.status === 504
    );
    if (shouldFallback) {
      logWarn('Tentando fallback para AUTH_SERVICE_INTERNAL_URL após falha via gateway', { cid, internalBase: AUTH_INTERNAL_BASE, firstError: { code: ctx.code, status: ctx.status } });
      try {
        const alt = await axios.post(`${AUTH_INTERNAL_BASE}/register`, { email }, { timeout: Number(process.env.AUTH_HTTP_TIMEOUT_MS || 8000), headers: { 'x-correlation-id': cid, 'x-internal-call': 'user-service' } });
        if (!alt.data?.usuario?.id) {
          throw new Error('Resposta (fallback) sem usuario.id');
        }
        return { id: alt.data.usuario.id, email: alt.data.usuario.email };
      } catch (err2) {
        const ctx2 = buildErrorContext(err2, 'createAuthUser_fallback', { email, cid, internalBaseTried: AUTH_INTERNAL_BASE });
        logError('Falha também no fallback interno para auth-service', ctx2);
      }
    }

    // Mapeia mensagens mais amigáveis
    if ((ctx.code === 'ECONNREFUSED') || (ctx.code === 'ENOTFOUND')) {
      throw new Error(`auth_service_indisponivel: não foi possível conectar em ${AUTH_BASE}`);
    }
    if (ctx.status === 502) {
      throw new Error(`bad_gateway_auth: gateway não recebeu resposta do auth-service (base=${AUTH_BASE})`);
    }
    if (ctx.status === 409 && hasErrorField(ctx.responseBody) && ctx.responseBody.error === 'email_ja_cadastrado') {
      throw new Error('email_ja_cadastrado');
    }
    if (ctx.status === 400 && ctx.responseBody && typeof ctx.responseBody === 'object' && 'dominio_nao_permitido' in (ctx.responseBody as object)) {
      throw new Error('dominio_nao_permitido');
    }
    throw new Error(`falha_registro_auth: ${(ctx.message || ctx.statusText || ctx.code || 'erro_desconhecido')}`);
  }
}

// Reset agora deve enviar novaSenha (senha gerada aqui ou fornecida) conforme contrato no auth-service
export async function resetPassword(email: string, novaSenha: string): Promise<void> {
  const cid = correlationId();
  try {
    await http.post('/reset-password', { email, novaSenha }, { headers: { 'x-correlation-id': cid } });
  } catch (err) {
    const ctx = buildErrorContext(err, 'resetPassword', { email, cid });
    logError('Falha ao resetar senha no auth-service', ctx);
    if ((ctx.code === 'ECONNREFUSED') || (ctx.code === 'ENOTFOUND')) {
      throw new Error(`auth_service_indisponivel: não foi possível conectar em ${AUTH_BASE}`);
    }
    throw new Error('falha_reset_senha_auth');
  }
}
