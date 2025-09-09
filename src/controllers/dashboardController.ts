import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpError.js';
import { getDashboardByRole } from '../services/dashboardService.js';

export async function getDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.header('x-user-id');
    const userRoles = req.header('x-user-roles')?.split(',') || [];
    
    if (!userId) {
      return next(new HttpError(401, 'missing_user_context'));
    }

    // Determina qual dashboard retornar baseado no role
    let role = 'FUNCIONARIO'; // default
    if (userRoles.includes('ADMIN')) {
      role = 'ADMIN';
    } else if (userRoles.includes('INSTRUTOR')) {
      role = 'INSTRUTOR';
    }

    const dashboard = await getDashboardByRole(userId, role);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}
