import { Response } from 'express';

interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
  data?: T | null;
}

export const sendResponse = <T>(res: Response, data: IApiResponse<T>): void => {
  const responseData: Record<string, unknown> = {
    success: data.success,
    message: data.message || null,
  };

  if (data.meta) {
    responseData.meta = data.meta;
  }

  if (data.data !== undefined) {
    responseData.data = data.data;
  }

  res.status(data.statusCode).json(responseData);
};
