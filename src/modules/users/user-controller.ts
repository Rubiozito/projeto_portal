import { NextFunction, Request, Response } from 'express';
import { createUser } from './user-service';

export function createUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    createUser(req.body);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    next(err);
  }
}
