import { Request, Response, NextFunction } from "express";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"] as string; // Simplificado; normalmente JWT
  if (!userId) return res.status(401).json({ error: "Não autenticado" });
  (req as any).userId = userId;
  next();
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  const roles = (req.headers["x-user-roles"] as string)?.split(",") || [];
  if (!roles.includes("ADMIN")) return res.status(403).json({ error: "Somente admin" });
  next();
};
