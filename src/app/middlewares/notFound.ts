import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'API Not Found',
    errors: [
      {
        field: 'url',
        message: `Cannot ${req.method} ${req.originalUrl}`,
      },
    ],
  });
};
