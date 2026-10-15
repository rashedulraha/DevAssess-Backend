import { ZodError } from 'zod';
import { IGenericErrorMessage, IGenericErrorResponse } from '../interfaces/common';

export const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errors: IGenericErrorMessage[] = error.issues.map((issue) => {
    const pathSegments = issue.path.map((p) => p.toString());
    const pathWithoutPrefix =
      pathSegments.length > 1 && ['body', 'query', 'params', 'cookies'].includes(pathSegments[0])
        ? pathSegments.slice(1).join('.')
        : pathSegments.join('.');

    const field =
      pathSegments.length > 0
        ? pathSegments[pathSegments.length - 1]
        : 'unknown';

    return {
      field,
      path: pathWithoutPrefix || field,
      message: issue.message,
    };
  });

  const firstMessage = errors[0]?.message;

  return {
    statusCode: 400,
    message: firstMessage ? `Validation error: ${firstMessage}` : 'Validation error occurred',
    errorMessages: errors,
  };
};
