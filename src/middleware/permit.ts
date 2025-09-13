import { Request, Response, NextFunction } from 'express';

export function permit(allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user?.roles) return res.status(403).json({ error: 'forbidden' });
    const has = user.roles.some((r: string) => allowed.includes(r));
    if (!has) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
