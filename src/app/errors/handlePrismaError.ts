import { Prisma } from '@prisma/client';
import { IGenericErrorMessage, IGenericErrorResponse } from '../interfaces/common';

export const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
): IGenericErrorResponse => {
  let statusCode = 400;
  let message = 'Database Error';
  let errorMessages: IGenericErrorMessage[] = [];

  switch (error.code) {
    case 'P2002': {
      const target = error.meta?.target;
      let fieldName = 'record';
      if (Array.isArray(target)) {
        fieldName = target
          .map((t) => String(t).replace(/^[A-Za-z0-9]+_/, '').replace(/_key$/, ''))
          .join(', ');
      } else if (typeof target === 'string') {
        fieldName = target.replace(/^[A-Za-z0-9]+_/, '').replace(/_key$/, '');
      }

      message = `A record with this ${fieldName} already exists`;
      statusCode = 409;
      errorMessages = [
        {
          field: fieldName,
          path: fieldName,
          message,
        },
      ];
      break;
    }

    case 'P2025': {
      message = (error.meta?.cause as string) || 'The requested record was not found';
      statusCode = 404;
      errorMessages = [
        {
          field: 'id',
          path: 'id',
          message,
        },
      ];
      break;
    }

    case 'P2003': {
      const field =
        (error.meta?.field_name as string) ||
        (error.meta?.target as string) ||
        'relation';
      message = 'Referenced entity does not exist or relation constraint violated';
      statusCode = 400;
      errorMessages = [
        {
          field,
          path: field,
          message,
        },
      ];
      break;
    }

    case 'P2000': {
      const column = (error.meta?.column_name as string) || 'field';
      message = `The provided value is too long for ${column}`;
      statusCode = 400;
      errorMessages = [
        {
          field: column,
          path: column,
          message,
        },
      ];
      break;
    }

    case 'P2023': {
      message = 'Inconsistent data or invalid identifier format provided';
      statusCode = 400;
      errorMessages = [
        {
          field: 'id',
          path: 'id',
          message,
        },
      ];
      break;
    }

    default: {
      message = error.message || 'An unexpected database error occurred';
      statusCode = 400;
      errorMessages = [
        {
          field: 'database',
          path: 'database',
          message,
        },
      ];
      break;
    }
  }

  return {
    statusCode,
    message,
    errorMessages,
  };
};
