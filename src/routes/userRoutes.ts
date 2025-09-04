import { Router } from 'express';
import { meHandler, updateUserHandler, getUserHandler, getDepartmentsHandler, createDepartmentHandler, updateDepartmentHandler, listUsersHandler, compositeUpdateHandler } from '../controllers/userController.js';
export const userRouter = Router();
// Users
userRouter.get('/', listUsersHandler); // admin list users
userRouter.get('/departments', getDepartmentsHandler); // Lista departamentos disponíveis (deve vir antes de /:id)
userRouter.get('/me', meHandler);
userRouter.post('/', updateUserHandler); // completar cadastro / update básico
userRouter.get('/:id', getUserHandler);
userRouter.patch('/:id', compositeUpdateHandler); // composite update (admin ou próprio dependendo dos campos)
// Departments
userRouter.post('/departments', createDepartmentHandler); // admin
userRouter.patch('/departments/:codigo', updateDepartmentHandler); // admin