import { Request, Response, NextFunction } from 'express';
import { updateUserSchema, updateXpSchema } from '../validation/userSchemas.js';
import { getMe, getById, patchXp, update, getDepartments } from '../services/userService.js';
import { HttpError } from '../utils/httpError.js';

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.header('x-user-id');
    const me = await getMe(userId || '');
    res.json(me);
  } catch (err) { next(err); }
}

export async function updateUserHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  
  try {
    // O userId vem do token JWT (x-user-id) - é o mesmo ID criado durante auto-cadastro
    const userId = req.header('x-user-id');
    const userRoles = req.header('x-user-roles')?.split(',') || [];
    
    if (!userId) {
      return next(new HttpError(401, 'missing_user_context'));
    }
    
    // Verificar se está tentando alterar email sem ser INSTRUTOR
    if (parsed.data.email && !userRoles.includes('INSTRUTOR')) {
      return next(new HttpError(403, 'email_change_not_allowed', 'Apenas instrutores podem alterar o email'));
    }
    
    const updatedUser = await update(userId, parsed.data);
    res.status(200).json(updatedUser);
  } catch (err) { next(err); }
} 

export async function getUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const u = await getById(req.params.id);
    res.json(u);
  } catch (err) { next(err); }
}

export async function patchXpHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = updateXpSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  try {
    const updated = await patchXp(req.params.id, parsed.data.delta);
    res.json(updated);
  } catch (err) { next(err); }
}

export async function getDepartmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await getDepartments();
    res.json(departments);
  } catch (err) { next(err); }
}