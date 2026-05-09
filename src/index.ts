import express from 'express';
import { userRouter } from './modules/users';
import { errorHandler } from './shared/middlewares/error-handler';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/users', userRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
