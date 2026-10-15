import { ZodError } from 'zod';
import { IGenericErrorMessage, IGenericErrorResponse } from '../interfaces/common';

export const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errors: IGenericErrorMessage[] = error.issues.map((issue) => {
    return {
      field: issue.path[issue.path.length - 1]?.toString() || 'unknown',
      path: issue.path.join('.'),
      message: issue.message,
    };
  });

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorMessages: errors,
  };
};
