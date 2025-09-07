import { Router } from 'express';
import { meHandler, updateUserHandler, getUserHandler, getDepartmentsHandler, createDepartmentHandler, updateDepartmentHandler, listUsersHandler, compositeUpdateHandler, listInstructorsHandler, getUserAchievementsHandler } from '../controllers/userController.js';
import { getDashboardHandler, getEmployeeDashboardHandler, getInstructorDashboardHandler, getAdminDashboardHandler } from '../controllers/dashboardController.js';

export const userRouter = Router();

// Dashboard routes (específicas primeiro)
userRouter.get('/dashboard', getDashboardHandler); // Dashboard inteligente baseado no role
userRouter.get('/dashboard/funcionario', getEmployeeDashboardHandler); // Dashboard funcionário
userRouter.get('/dashboard/instrutor', getInstructorDashboardHandler); // Dashboard instrutor  
userRouter.get('/admin/dashboard', getAdminDashboardHandler); // Dashboard administrativo

// Resource routes
userRouter.get('/instructors', listInstructorsHandler); // Lista instrutores
userRouter.get('/departments', getDepartmentsHandler); // Lista departamentos
userRouter.post('/departments', createDepartmentHandler); // Criar departamento (admin)
userRouter.patch('/departments/:codigo', updateDepartmentHandler); // Atualizar departamento (admin)

// User routes
userRouter.get('/me', meHandler); // Perfil próprio
userRouter.get('/', listUsersHandler); // Listar usuários (admin)
userRouter.post('/', updateUserHandler); // Completar cadastro / update básico

// User specific routes (parametrizadas por último)
userRouter.get('/:id/achievements', getUserAchievementsHandler); // Conquistas do usuário
userRouter.get('/:id', getUserHandler); // Buscar usuário por ID
userRouter.patch('/:id', compositeUpdateHandler); // Update completo (admin ou próprio)