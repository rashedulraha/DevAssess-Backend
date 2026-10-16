import { Role } from '@prisma/client';
import { NextFunction, Request, Response, Router } from 'express';
import { auth } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import { validateRequest } from '../../middlewares/validateRequest';
import { CompanyController } from './company.controller';
import { CompanyValidation } from './company.validation';

const router = Router();

const parseMultipartJson = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body?.data && typeof req.body.data === 'string') {
    try {
      req.body = JSON.parse(req.body.data);
    } catch {
      // Continue if parsing fails
    }
  }
  next();
};

router.post(
  '/',
  auth(Role.RECRUITER),
  upload.single('logo'),
  parseMultipartJson,
  validateRequest(CompanyValidation.createCompanyValidationSchema),
  CompanyController.upsertCompany,
);

router.get(
  '/my',
  auth(Role.RECRUITER),
  CompanyController.getMyCompany,
);

router.patch(
  '/my',
  auth(Role.RECRUITER),
  upload.single('logo'),
  parseMultipartJson,
  validateRequest(CompanyValidation.updateCompanyValidationSchema),
  CompanyController.upsertCompany,
);

export const CompanyRoutes = router;
