import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  redisUrl: process.env.REDIS_URL,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  payment: {
    ssl: {
      storeId: process.env.SSL_STORE_ID,
      storePass: process.env.SSL_STORE_PASS,
      isLive: process.env.SSL_IS_LIVE,
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL,
  frontendPublicUrl: process.env.FRONTEND_PUBLIC_URL,
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};
