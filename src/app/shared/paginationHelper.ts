type IOptions = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

type IOptionsResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export const calculatePagination = (options: IOptions): IOptionsResult => {
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};
