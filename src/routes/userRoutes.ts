import { Router } from 'express';
import { meHandler, updateUserHandler, getUserHandler, getDepartmentsHandler, createDepartmentHandler, updateDepartmentHandler, listUsersHandler, getUserAchievementsHandler, getCargosHandler, createCargoHandler, updateCargoHandler } from '../controllers/userController.js';
import { getDashboardHandler } from '../controllers/dashboardController.js';

export const userRouter = Router();

// Dashboard route
userRouter.get('/dashboard', getDashboardHandler); // Dashboard inteligente baseado no role

// Resource routes
userRouter.get('/departments', getDepartmentsHandler); // Lista departamentos
userRouter.post('/departments', createDepartmentHandler); // Criar departamento (admin)
userRouter.patch('/departments/:codigo', updateDepartmentHandler); // Atualizar departamento (admin)

userRouter.get('/cargos', getCargosHandler); // Lista cargos
userRouter.post('/cargos', createCargoHandler); // Criar cargo (admin)
userRouter.patch('/cargos/:id', updateCargoHandler); // Atualizar cargo (admin)

// User routes
userRouter.get('/me', meHandler); // Perfil próprio
userRouter.get('/', listUsersHandler); // Listar usuários (admin)

userRouter.get('/:id/achievements', getUserAchievementsHandler); // Conquistas do usuário
userRouter.get('/:id', getUserHandler); // Buscar usuário por ID
userRouter.patch('/:id', updateUserHandler); // Update completo (admin, instrutor ou próprio)