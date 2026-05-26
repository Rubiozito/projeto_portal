import { Router } from 'express';

import { MockUserRepository } from './user-repository';
import { UserService } from './user-service';
import { UserController } from './user-controller';

const repository = new MockUserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

export const usersRouter = Router();

usersRouter.post('/', controller.createUser);
usersRouter.get('/', controller.listUsers);
usersRouter.get('/:id', controller.getUserById);
usersRouter.patch('/:id', controller.updateUser);
usersRouter.delete('/:id', controller.deleteUser);
