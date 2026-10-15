import { Role } from '@prisma/client';

export interface IRegisterUser {
  email: string;
  password: string;
  fullName: string;
  role: 'CANDIDATE' | 'RECRUITER';
  companyName?: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IAuthResponseUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
  companyId?: string | null;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IAuthResponseUser;
}

export interface IRefreshTokenResponse {
  accessToken: string;
}
