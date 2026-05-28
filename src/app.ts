import express from 'express';

import { errorHandler } from './shared/middlewares/error-handler';
import { companiesRouter } from './modules/companies';
import { usersRouter } from './modules/users';

export const app = express();

app.use(express.json());
app.use('/users', usersRouter);
app.use('/company', companiesRouter);
app.use(errorHandler);
