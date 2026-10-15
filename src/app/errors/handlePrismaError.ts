import { Prisma } from '@prisma/client';
import { IGenericErrorMessage, IGenericErrorResponse } from '../interfaces/common';

export const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
): IGenericErrorResponse => {
  let statusCode = 400;
  let message = 'Database Error';
  let errorMessages: IGenericErrorMessage[] = [];

  if (error.code === 'P2002') {
    const target = (error.meta?.target as string[]) || [];
    const fields = target.join(', ');
    message = fields
      ? `A record with this ${fields} already exists`
      : 'Unique constraint violation';
    statusCode = 409;
    errorMessages = [
      {
        field: fields,
        path: fields,
        message,
      },
    ];
  } else if (error.code === 'P2025') {
    message = (error.meta?.cause as string) || 'Record not found';
    statusCode = 404;
    errorMessages = [
      {
        field: '',
        path: '',
        message,
      },
    ];
  } else if (error.code === 'P2003') {
    message = 'Foreign key constraint violation';
    statusCode = 400;
    errorMessages = [
      {
        field: (error.meta?.field_name as string) || '',
        path: (error.meta?.field_name as string) || '',
        message,
      },
    ];
  } else {
    message = error.message;
    errorMessages = [
      {
        field: '',
        path: '',
        message: error.message,
      },
    ];
  }

  return {
    statusCode,
    message,
    errorMessages,
  };
};
