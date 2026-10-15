import { Prisma } from '@prisma/client';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import config from '../config';
import { AppError } from '../errors/AppError';
import { handlePrismaError } from '../errors/handlePrismaError';
import { handleZodError } from '../errors/handleZodError';
import { IGenericErrorMessage } from '../interfaces/common';

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errors: IGenericErrorMessage[] = [];

  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errors = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errors = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database validation error';
    errors = [
      {
        field: 'prisma',
        message: error.message,
      },
    ];
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = [
      {
        field: '',
        message: error.message,
      },
    ];
  } else if (error instanceof Error) {
    message = error.message;
    errors = [
      {
        field: '',
        message: error.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(config.env === 'development' && { stack: error?.stack }),
  });
};
