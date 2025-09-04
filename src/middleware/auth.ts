import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

// Rotas públicas locais dentro do user-service (após prefixo /users/v1 montado em server)
const publicUserRoutes: { method: string; path: RegExp }[] = [
  { method: 'GET', path: /^\/departments$/ } // listar departamentos é público
];

function isPublic(req: Request): boolean {
  const p = req.path.replace(/\/+/g, '/');
  return publicUserRoutes.some(r => r.method === req.method && r.path.test(p));
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Bypass docs e assets (servidos em /docs no serviço)
  if (req.originalUrl.startsWith('/docs')) return next();

  // Durante testes locais pode ser útil desativar auth completamente
  if (process.env.DISABLE_AUTH === 'true') return next();

  if (isPublic(req)) return next();

  // Se já vem do API Gateway com x-user-id consideramos autenticado
  const forwardedUserId = req.header('x-user-id');
  if (forwardedUserId) {
    // Normalizar roles para controllers
    const roles = (req.header('x-user-roles') || '').split(',').filter(Boolean);
    (req as any).user = { sub: forwardedUserId, roles };
    return next();
  }

  // Caso contrário exigir Authorization Bearer
  const auth = req.header('authorization');
  if (!auth) {
    return res.status(401).json({ error: 'missing_authorization_header' });
  }
  const token = auth.replace(/^Bearer\s+/i, '');
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const key = createHash('sha256').update(secret).digest();
    const anyJwt: any = jwt as any;
    const verifyFn = anyJwt.verify || (anyJwt.default && anyJwt.default.verify);
    if (typeof verifyFn !== 'function') throw new TypeError('jsonwebtoken_verify_not_function');
    const payload = verifyFn(token, key) as any;
    (req as any).user = payload;
    // Disponibilizar headers para lógica existente que lê diretamente
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-roles'] = (payload.roles || []).join(',');
    return next();
  } catch (e: any) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
