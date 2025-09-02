import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Default error
  let error = { message: 'Internal Server Error' };
  let statusCode = 500;

  // Validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    error.message = 'Validation Error';
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    error.message = 'Invalid token';
  }

  res.status(statusCode).json({ error: error.message });
};