import { Router } from 'express';
import { meHandler, createUserHandler, getUserHandler, patchXpHandler } from '../controllers/userController.js';
export const userRouter = Router();
userRouter.get('/me', meHandler);
userRouter.post('/', createUserHandler);
userRouter.get('/:id', getUserHandler);
userRouter.patch('/:id/xp', patchXpHandler);