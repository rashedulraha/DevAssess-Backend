import { JwtPayload } from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface IAuthUser extends JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
