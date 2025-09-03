import { Router } from 'express';
import { meHandler, updateUserHandler, getUserHandler, patchXpHandler, getDepartmentsHandler } from '../controllers/userController.js';
export const userRouter = Router();
userRouter.get('/departments', getDepartmentsHandler); // Lista departamentos disponíveis (deve vir antes de /:id)
userRouter.get('/me', meHandler);
userRouter.post('/', updateUserHandler); // Rota para completar cadastro
userRouter.get('/:id', getUserHandler);
userRouter.patch('/:id/xp', patchXpHandler);