import { Request, Response, NextFunction } from 'express';
import { createUserSchema, updateXpSchema } from '../validation/userSchemas.js';
import { getMe, create, getById, patchXp } from '../services/userService.js';
import { HttpError } from '../utils/httpError.js';

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.header('x-user-id');
    const me = await getMe(userId || '');
    res.json(me);
  } catch (err) { next(err); }
}

export async function createUserHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  try {
    const created = await create(parsed.data);
    res.status(201).json(created);
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