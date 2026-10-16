export interface IGenericResponse<T> {
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
  data: T;
}

export interface IGenericErrorMessage {
  field?: string | number;
  path?: string | number;
  message: string;
}

export interface IGenericErrorResponse {
  statusCode: number;
  message: string;
  errorMessages: IGenericErrorMessage[];
}

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
