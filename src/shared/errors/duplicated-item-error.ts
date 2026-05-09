import { AppError } from './app-error';

export class DuplicatedItemError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
