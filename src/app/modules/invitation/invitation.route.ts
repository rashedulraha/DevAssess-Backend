import { Role } from '@prisma/client';
import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { InvitationController } from './invitation.controller';

const router = Router();

router.get(
  '/my',
  auth(Role.CANDIDATE),
  InvitationController.getMyInvitations,
);

export const InvitationRoutes = router;
