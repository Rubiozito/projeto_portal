import { NextFunction, Request, Response } from 'express';
import { createUser, getUserById } from './user-service';

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

export function getUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const user = getUserById(req.params['id']);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}
