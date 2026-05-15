import { Router } from 'express';
import { createUserController, getUserController } from './user-controller';

export const userRouter = Router();

userRouter.post('/', createUserController);
userRouter.get('/:id', getUserController);
