import { Request, Response } from 'express';

import {
  CreateUserSchema,
  UpdateUserSchema,
  UuidParamSchema,
} from './user-schemas';
import { UserService } from './user-service';

export class UserController {
  constructor(private readonly service: UserService) {}

  createUser = async (req: Request, res: Response): Promise<void> => {
    const input = CreateUserSchema.parse(req.body);
    const user = this.service.createUser(input);
    res.status(201).json({ data: user });
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = UuidParamSchema.parse(req.params);
    const user = this.service.getUserById(id);
    res.status(200).json({ data: user });
  };

  listUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = this.service.getAllUsers();
    res.status(200).json({ data: users });
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = UuidParamSchema.parse(req.params);
    const input = UpdateUserSchema.parse(req.body);
    const user = this.service.updateUser(id, input);
    res.status(200).json({ data: user });
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = UuidParamSchema.parse(req.params);
    this.service.deleteUser(id);
    res.status(204).send();
  };
}
