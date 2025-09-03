import { Router } from 'express';
import { meHandler, updateUserHandler, getUserHandler, patchXpHandler } from '../controllers/userController.js';
export const userRouter = Router();
userRouter.get('/me', meHandler);
userRouter.post('/:id', updateUserHandler);
userRouter.get('/:id', getUserHandler);
userRouter.patch('/:id/xp', patchXpHandler);