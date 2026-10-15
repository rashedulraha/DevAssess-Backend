import bcrypt from 'bcrypt';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import config from '../../config';

export const createToken = (
  jwtPayload: Record<string, unknown>,
  secret: string,
  expiresIn: string,
): string => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  } as SignOptions);
};

export const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = Number(config.bcryptSaltRounds) || 12;
  return await bcrypt.hash(password, saltRounds);
};

export const isPasswordMatched = async (
  plainTextPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const generateSlug = (text: string): string => {
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseSlug}-${Date.now().toString().slice(-4)}`;
};
