import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

// Rotas públicas locais dentro do user-service (após prefixo /users/v1 montado em server)
const publicUserRoutes: { method: string; path: RegExp }[] = [
  { method: 'GET', path: /^\/departments$/ }, // listar departamentos é público
  { method: 'GET', path: /^\/cargos$/ }, // listar cargos é público
];

function isPublic(req: Request): boolean {
  const p = req.path.replace(/\/+/g, '/');
  return publicUserRoutes.some(r => r.method === req.method && r.path.test(p));
}

export interface JwtPayloadCustom { sub: string; email?: string; roles?: string[]; type?: string; }

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // Bypass docs e assets (servidos em /docs no serviço)
  if (req.originalUrl.startsWith('/docs')) return next();

  if (isPublic(req)) return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'token_missing' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JwtPayloadCustom;
    (req as any).user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'token_invalid' });
  }
}