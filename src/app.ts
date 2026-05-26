import express from 'express';

import { errorHandler } from './shared/middlewares/error-handler';
import { usersRouter } from './modules/users';

export const app = express();

app.use(express.json());
app.use('/users', usersRouter);
app.use(errorHandler);
