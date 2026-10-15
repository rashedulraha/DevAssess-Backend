import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  payment: {
    ssl: {
      storeId: process.env.SSL_STORE_ID,
      storePass: process.env.SSL_STORE_PASS,
      isLive: process.env.SSL_IS_LIVE === 'true',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000',
  frontendPublicUrl: process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};
