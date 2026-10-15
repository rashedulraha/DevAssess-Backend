# Developer Assessment & Coding Platform — Tech Stack & Setup Guide (`techstack.md`)

## 1. Purpose of This Guide

Many backend projects fail during development or deployment because of **incompatible package versions** or breaking configuration changes. This guide provides **the latest versions** and exact configuration files so your code compiles and deploys with zero errors.

---

## 2. Exact Version Matrix (Updated to Latest Versions)

| Package / Tool | Recommended Version | Why This Specific Version Is Locked |
| :--- | :--- | :--- |
| **Node.js Runtime** | `v22.x LTS` or `v24.x LTS` (or `v26.x`) | Native stability and high performance on both Vercel Serverless and Render containers. |
| **TypeScript** | `^5.8.3` | Stable TypeScript release with strict typing and full compatibility with ESLint tools. |
| **Express.js** | `^5.3.0` + `@types/express@^5.0.6` | Latest Express 5 release featuring native async error handling, modern routing, and updated type definitions. |
| **Prisma ORM** | `prisma@^7.10.1` + `@prisma/client@^7.10.1` | Latest stable Prisma release with improved query engine, adapter support, and connection management. |
| **Zod** | `^4.6.7` | Latest Zod release providing robust schema validation and type inference (`z.object`, `parseAsync`). |
| **Authentication** | `jsonwebtoken@^9.0.3`, `bcrypt@^6.0.0`, `google-auth-library@^11.3.1` | Latest JWT signing + bcrypt password hashing (`@types/bcrypt@^6.0.0`) + official Google OAuth ID token verification. |
| **Redis Client** | `ioredis@^6.0.0` | Latest ioredis with built-in TypeScript types, automatic reconnection, and seamless Upstash/Render Redis TLS support (`rediss://`). |
| **Payment Gateways** | `stripe@^23.0.0` / `axios@^1.20.0` (SSLCommerz / bKash REST API) | Official Stripe TypeScript SDK + Axios for SSLCommerz v4 / bKash Tokenized Checkout REST APIs. |
| **File Uploads** | `multer@^2.4.0`, `cloudinary@^2.11.0` | Latest multipart form uploads (`@types/multer@^2.3.0`) with direct stream upload to Cloudinary. |
| **Email Service** | `nodemailer@^10.1.1` (or `resend@^6.33.0`) | Latest reliable SMTP / transactional email delivery for candidate invitations. |
| **Security & Utils** | `helmet@^8.3.0`, `cors@^2.8.6`, `express-rate-limit@^8.7.1`, `http-status@^2.1.0` | HTTP security headers, CORS control (`@types/cors@^2.8.19`), brute-force rate limiting, and readable HTTP status constants. |
| **Dev Runner** | `tsx@^4.23.15` | Fast TypeScript execution (`tsx watch src/server.ts`) with modern ES module and TS support. |

---

## 3. Ready-to-Use `package.json`

Copy this exact `package.json` at the start of Day 1 and run `npm install` to guarantee zero dependency conflicts:

```json
{
  "name": "devassess-backend",
  "version": "1.0.0",
  "description": "Developer Assessment & Technical Hiring Platform REST API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "prisma generate && tsc",
    "start": "node dist/server.js",
    "postinstall": "prisma generate",
    "db:migrate": "npx prisma migrate dev",
    "db:push": "npx prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "npx prisma studio",
    "lint": "eslint src",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^7.10.1",
    "axios": "^1.20.0",
    "bcrypt": "^6.0.0",
    "cloudinary": "^2.11.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^18.0.8",
    "express": "^5.3.0",
    "express-rate-limit": "^8.7.1",
    "google-auth-library": "^11.3.1",
    "helmet": "^8.3.0",
    "http-status": "^2.1.0",
    "ioredis": "^6.0.0",
    "jsonwebtoken": "^9.0.3",
    "multer": "^2.4.0",
    "nodemailer": "^10.1.1",
    "stripe": "^23.0.0",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/multer": "^2.3.0",
    "@types/node": "^26.6.5",
    "@types/nodemailer": "^8.0.2",
    "@typescript-eslint/eslint-plugin": "^8.71.2",
    "@typescript-eslint/parser": "^8.71.2",
    "eslint": "^10.12.0",
    "prettier": "^3.9.10",
    "prisma": "^7.10.1",
    "tsx": "^4.23.15",
    "typescript": "^5.8.3"
  }
}
```

---

## 4. Error-Free `tsconfig.json` Configuration

Using `"module": "CommonJS"` and `"moduleResolution": "node"` ensures 100% compatibility with Express, Prisma, Vercel Serverless Functions, and Render without `.js` import extension errors:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "typeRoots": ["./node_modules/@types", "./src/app/interfaces"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "prisma"]
}
```

---

## 5. Step-by-Step Tool Configuration & Common Bug Prevention

### 5.1 Preventing Express `req.user` TypeScript Errors
Many students get `Property 'user' does not exist on type 'Request'` errors. Create `src/app/interfaces/index.d.ts` on Day 1:
```typescript
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
```

### 5.2 Preventing Prisma Connection Exhaustion in Development & Serverless
Never write `new PrismaClient()` inside individual services. Always use a global singleton in `src/app/shared/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 5.3 Safe Redis Setup (Works Even If Redis Temporarily Disconnects)
Use Upstash Redis (free tier) or local Redis. Wrap `get` and `set` in `src/app/shared/redis.ts` with safe error handling so a temporary Redis hiccup never crashes your entire API:
```typescript
import Redis from 'ioredis';
import config from '../config';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
});

redis.on('error', (err) => {
  console.warn('[Redis Warning]: Connection issue, falling back to DB:', err.message);
});
```

### 5.4 Real Payment Integration Without SDK Crashes (SSLCommerz / Stripe)
- **Option A — SSLCommerz (Recommended for Bangladesh / BDT):** Instead of the old `sslcommerz-lts` npm package (which uses deprecated `node-fetch` and often fails on Vercel), make a clean `axios.post('https://sandbox.sslcommerz.com/gwprocess/v4/api.php', new URLSearchParams(payload))` request in `payment.gateway.ts` and validate via `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php`.
- **Option B — Stripe:** Use official `stripe.checkout.sessions.create(...)` and verify webhooks or session status via `stripe.checkout.sessions.retrieve(sessionId)`.
- **Tip:** Support both or pick SSLCommerz/Stripe as your primary gateway so you can easily record the full payment redirect → callback → database status update flow in your 5–10 minute walkthrough video.

### 5.5 Environment Variables Template (`.env.example`)
```env
NODE_ENV=development
PORT=5000

# PostgreSQL (Neon / Supabase / Railway — use pooled + direct URL)
DATABASE_URL="postgresql://user:password@ep-xyz.ap-southeast-1.aws.neon.tech/devassess?sslmode=require"

# JWT Secrets
JWT_ACCESS_SECRET="replace_with_32_char_random_hex_access_secret"
JWT_REFRESH_SECRET="replace_with_32_char_random_hex_refresh_secret"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="30d"
BCRYPT_SALT_ROUNDS="12"

# Google OAuth (GCP Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# Redis (Upstash or Local)
REDIS_URL="rediss://default:password@upstash-endpoint:6379"

# Cloudinary File Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Payment Gateway (SSLCommerz Sandbox & Stripe Test Mode)
SSL_STORE_ID="testbox"
SSL_STORE_PASS="qwerty"
SSL_IS_LIVE="false"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
BACKEND_PUBLIC_URL="http://localhost:5000"
FRONTEND_PUBLIC_URL="http://localhost:3000"

# SMTP Email (Gmail App Password or Resend)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-digit-app-password"
```
