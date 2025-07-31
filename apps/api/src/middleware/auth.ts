import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw createError('Access token required', 401);
    }

    // TODO: Implement JWT verification
    // For now, mock user
    req.user = {
      id: '1',
      email: 'user@example.com'
    };

    next();
  } catch (error) {
    next(error);
  }
};