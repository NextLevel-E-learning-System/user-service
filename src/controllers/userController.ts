import { Request, Response, NextFunction } from 'express';
import { updateUserSchema, departmentCreateSchema, departmentUpdateSchema, listUsersQuerySchema, patchUserCompositeSchema } from '../validation/userSchemas.js';
import { getMe, getById, update, getDepartments, createDept, updateDept, listAllUsers, compositeUpdate, listInstructors, getUserAchievements, getAdminDashboard } from '../services/userService.js';
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
    
    // Verificar se está tentando alterar email sem ser ADMIN
    if (parsed.data.email && !userRoles.includes('ADMIN')) {
      return next(new HttpError(403, 'email_change_not_allowed', 'Apenas admin podem alterar o email'));
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

export async function getDepartmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await getDepartments();
    res.json(departments);
  } catch (err) { next(err); }
}

export async function createDepartmentHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = departmentCreateSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  try {
    const roles = req.header('x-user-roles')?.split(',') || [];
    const dept = await createDept(parsed.data, roles);
    res.status(201).json(dept);
  } catch (err) { next(err); }
}

export async function updateDepartmentHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = departmentUpdateSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  try {
    const roles = req.header('x-user-roles')?.split(',') || [];
    const dept = await updateDept(req.params.codigo, parsed.data, roles);
    res.json(dept);
  } catch (err) { next(err); }
}

export async function listUsersHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  try {
    const roles = req.header('x-user-roles')?.split(',') || [];
    const users = await listAllUsers(parsed.data, roles);
    res.json(users);
  } catch (err) { next(err); }
}


export async function compositeUpdateHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = patchUserCompositeSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  try {
    const roles = req.header('x-user-roles')?.split(',') || [];
    const actorId = req.header('x-user-id') || '';
    const data = await compositeUpdate(req.params.id, parsed.data, roles, actorId);
    res.json(data);
  } catch (err) { next(err); }
}

// ========== NOVOS CONTROLADORES ==========

export async function listInstructorsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const instructors = await listInstructors();
    res.json(instructors);
  } catch (err) { next(err); }
}

export async function getUserAchievementsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    const achievements = await getUserAchievements(userId);
    res.json(achievements);
  } catch (err) { next(err); }
}

export async function getAdminDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = req.header('x-user-roles')?.split(',') || [];
    if (!roles.includes('ADMIN')) {
      return next(new HttpError(403, 'admin_required'));
    }
    const dashboard = await getAdminDashboard();
    res.json(dashboard);
  } catch (err) { next(err); }
}
