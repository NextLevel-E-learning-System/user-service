import { Request, Response, NextFunction } from "express";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });
  (req as any).userId = userId;
  (req as any).roles = (req.headers["x-user-roles"] as string)?.split(",") || [];
  next();
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  const roles: string[] = (req as any).roles;
  if (!roles.includes("ADMIN")) return res.status(403).json({ error: "Somente admin" });
  next();
};

export const authorizeRoles = (rolesPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles: string[] = (req as any).roles;
    if (!roles.some(r => rolesPermitidos.includes(r))) return res.status(403).json({ error: "Acesso negado" });
    next();
  };
};
