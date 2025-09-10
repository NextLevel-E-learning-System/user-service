import { Request, Response, NextFunction } from 'express';
import { updateUserSchema, departmentCreateSchema, departmentUpdateSchema, listUsersQuerySchema, cargoCreateSchema, cargoUpdateSchema, listCargosQuerySchema } from '../validation/userSchemas.js';
import { getById, getDepartments, createDept, updateDept, listAllUsers, getUserAchievements, listCargos, createNewCargo, updateExistingCargo } from '../services/userService.js';
import { updateInstructorBio, updateUserComposite } from '../repositories/userRepository.js';
import { HttpError } from '../utils/httpError.js';

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.header('x-user-id');
    const me = await getById(userId || '');
    res.json(me);
  } catch (err) { next(err); }
}

export async function updateUserHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));

  try {
    const userId = req.header('x-user-id');
    const userRoles = req.header('x-user-roles')?.split(',') || [];
    if (!userId) {
      return next(new HttpError(401, 'missing_user_context'));
    }

    // ADMIN: pode alterar qualquer campo permitido via updateUserComposite
    if (userRoles.includes('ADMIN')) {
      const allowedFields = ['nome', 'cpf', 'email', 'departamento_id', 'cargo', 'status', 'tipo_usuario'];
      const updateData: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in parsed.data) {
          updateData[key] = parsed.data[key as keyof typeof parsed.data];
        }
      }
      if (Object.keys(updateData).length === 0) {
        return next(new HttpError(400, 'no_fields', 'Nenhum campo permitido para atualizar'));
      }
      await updateUserComposite(userId, updateData);
      return res.status(200).json({ success: true });
    }

    // INSTRUTOR: pode alterar apenas biografia
    if (userRoles.includes('INSTRUTOR')) {
      if ('biografia' in parsed.data && typeof parsed.data.biografia === 'string') {
        await updateInstructorBio(userId, parsed.data.biografia);
        return res.status(200).json({ success: true });
      }
      return next(new HttpError(403, 'forbidden_fields', 'Instrutor só pode editar a biografia'));
    }

    // FUNCIONARIO: não pode editar nada
    return next(new HttpError(403, 'forbidden', 'Funcionário não pode editar nenhum campo'));
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

// ============== CARGOS HANDLERS ==============
export async function getCargosHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cargos = await listCargos();
    res.json(cargos);
  } catch (err) { next(err); }
}

export async function createCargoHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = cargoCreateSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  try {
    const roles = req.header('x-user-roles')?.split(',') || [];
    const cargo = await createNewCargo(parsed.data, roles);
    res.status(201).json(cargo);
  } catch (err) { next(err); }
}

export async function updateCargoHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = cargoUpdateSchema.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'validation_error', parsed.error.issues));
  try {
    const roles = req.header('x-user-roles')?.split(',') || [];
    const cargo = await updateExistingCargo(req.params.id, parsed.data, roles);
    if (!cargo) return next(new HttpError(404, 'cargo_not_found'));
    res.json(cargo);
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


export async function getUserAchievementsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id;
    const achievements = await getUserAchievements(userId);
    res.json(achievements);
  } catch (err) { next(err); }
}
