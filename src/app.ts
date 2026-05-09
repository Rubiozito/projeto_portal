import express from 'express';
import { userRouter } from './modules/users';
import { errorHandler } from './shared/middlewares/error-handler';

export const app = express();

app.use(express.json());

app.use('/users', userRouter);

app.use(errorHandler);
