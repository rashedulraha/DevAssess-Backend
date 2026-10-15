import { JwtPayload } from 'jsonwebtoken';

export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface IAuthUser extends JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
