# DevAssess — Developer Assessment & Technical Hiring Platform REST API

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.3-black.svg)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-informational.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Cloud-336791.svg)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D.svg)](https://redis.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF.svg)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

DevAssess is an enterprise-grade REST API backend built for technical recruitment, automated developer assessments, and remote proctoring. Engineered using a feature-based modular architecture with **Express 5**, **TypeScript**, **Prisma 7**, **Neon Cloud PostgreSQL**, and **Redis Cloud**.

---

## 🌟 Core Features

- **Strict 3-Role RBAC**: Granular authorization for `CANDIDATE`, `RECRUITER`, and `ADMIN` roles enforced through centralized JWT authentication middleware.
- **Dynamic Problem Bank**: Multi-format question authoring (`CODING`, `MCQ`, `WRITTEN`) with customizable difficulty levels, tags, points, starter code, and test cases (public vs. secret).
- **Isolated Node.js VM Evaluation**: Secure, sandboxed execution of candidate JavaScript/TypeScript code using Node's `vm` module with execution timeouts and memory limits.
- **Proctoring & Anti-Cheat Telemetry**: Real-time event recording (`TAB_SWITCH`, `WINDOW_BLUR`, `FULLSCREEN_EXIT`). Auto-flags candidate attempts if infractions exceed the recruiter's threshold.
- **Redis Timer Synchronization**: Attempt start generates an immutable TTL key in Redis Cloud. Submissions validate `now <= expiresAt + gracePeriod` to prevent local client-side clock tampering.
- **Payload Sanitization**: Automatic stripping of correct MCQ answers and hidden test cases on attempt start to prevent inspecting network responses.
- **Transactional Candidate Invitations**: Deducts 1 credit per invite within a `prisma.$transaction`. Fails cleanly if the recruiter's company balance is insufficient.
- **Dual Payment Gateway Support**: Real checkout session initiation and idempotent webhook callbacks for **Stripe** and **SSLCommerz v4** credit top-up bundles (`STARTER_25`, `PRO_100`, `ENTERPRISE_300`).
- **Recruiter Evaluation & Leaderboard**: Manual grading interface for written/coding solutions, real-time score recalculation, and Redis-cached assessment analytics.
- **System Administration & Audit Trail**: Platform KPIs, user role assignments, account suspensions, and immutable audit logging.

---

## 📐 System Architecture

DevAssess follows the **Controller-Service-Repository** pattern organized inside modular feature folders (`src/app/modules/<module-name>/`):

```
Client (Web / Postman)
       │
       ▼
 ┌────────────────────────────────────────────────────────┐
 │ Express 5 Application Layer                            │
 │ ├── Helmet Security Headers                            │
 │ ├── Dynamic Production CORS                            │
 │ ├── Global & Auth Rate Limiters (express-rate-limit)   │
 │ └── Cookie & JSON Body Parsers (10MB limits)           │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ Middleware Stack                                       │
 │ ├── auth(Role.RECRUITER, Role.ADMIN, Role.CANDIDATE)   │
 │ ├── validateRequest(ZodSchema)                         │
 │ └── Multer File Upload (Cloudinary Cloud Storage)      │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ Modular Feature Controllers (src/app/modules/*)        │
 │ ├── auth, user, company, problem, assessment           │
 │ ├── invitation, attempt, submission, payment, admin    │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │ Service Layer (Business Logic & Transactions)          │
 │ ├── prisma.$transaction (Atomic Credit Topups & Invites)│
 │ ├── Node.js vm Sandbox (Isolated Code Runner)          │
 │ └── redisClient (Timer Sync & KPI Caching)             │
 └───────────────────────┬────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
 ┌───────────────────┐       ┌───────────────────┐
 │ Neon PostgreSQL   │       │ External Services │
 │ (10 Relational    │       │ ├── Stripe SDK    │
 │  Prisma Models)   │       │ ├── SSLCommerz v4 │
 └───────────────────┘       │ ├── Cloudinary    │
                             │ └── Nodemailer    │
                             └───────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime & Language** | Node.js v20+ / TypeScript 5.8 | Modern ECMAScript with strict type safety |
| **Framework** | Express 5.3 | High-performance HTTP server routing |
| **ORM & Database** | Prisma 7.10 / PostgreSQL (Neon) | Relational database schema and type-safe client |
| **Cache & Timer** | Redis Cloud (ioredis 6.0) | Assessment countdown TTL and analytics caching |
| **Code Sandboxing** | Node.js `vm` module | Sandboxed execution of candidate coding submissions |
| **Payments** | Stripe SDK v23 / SSLCommerz v4 | Credit bundle checkout and webhook validation |
| **Media Storage** | Multer 2.4 / Cloudinary 2.11 | Resume and profile avatar image storage |
| **Validation** | Zod 4.6 | Schema-first request payload validation |
| **Security** | Helmet, bcrypt, jsonwebtoken | Password hashing, JWT token rotation, rate limits |

---

## 🔑 Demo Credentials

Seed data is pre-populated with realistic Bangladeshi companies, engineering leads, and candidates:

| Role | Email | Password | Details |
|---|---|---|---|
| **`ADMIN`** | `admin@devassess.com` | `Admin@1234` | System Administrator with full access to audit logs and user management |
| **`RECRUITER`** | `recruiter@techcorp.com` | `Recruiter@1234` | Head of Engineering at TechCorp BD (25 Pre-seeded assessment credits) |
| **`CANDIDATE`** | `candidate@devassess.com` | `Candidate@1234` | Nusrat Jahan (Full Stack Developer candidate) |

---

## 📡 API Endpoint Reference (32 Endpoints)

All endpoints are prefixed with `/api/v1` and strictly adhere to the standardized response envelope:

- **Success**: `{ "success": true, "message": "...", "data": { ... } }`
- **Error**: `{ "success": false, "message": "...", "errors": [ { "field": "...", "message": "..." } ] }`

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register as `CANDIDATE` or `RECRUITER` (auto-creates company) |
| `POST` | `/auth/login` | Public | Authenticate with email/password; returns access & refresh tokens |
| `POST` | `/auth/google` | Public | Social login via Google OAuth2 ID token verification |
| `POST` | `/auth/refresh-token` | Public | Rotate refresh token and issue a new access token |

### 2. Users & Companies (`/api/v1/users`, `/api/v1/companies`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users/me` | Authenticated | Retrieve current user profile, company info, and role stats |
| `PATCH` | `/users/me` | Authenticated | Update user bio, avatar, and resume upload |
| `POST` | `/companies` | `RECRUITER` | Create or update company profile and branding |
| `GET` | `/companies/my-company` | `RECRUITER` | View company credit balance, subscription tier, and metadata |

### 3. Problem Bank (`/api/v1/problems`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/problems` | `RECRUITER` | Create coding/MCQ/written problem with test cases |
| `GET` | `/problems` | `RECRUITER`, `ADMIN` | Paginated, filtered (`?type=CODING&difficulty=MEDIUM`), and sorted list |
| `GET` | `/problems/search` | `RECRUITER`, `ADMIN` | Full-text keyword and tag search (`?q=sum&tag=array`) |
| `GET` | `/problems/:id` | `RECRUITER`, `ADMIN` | Retrieve single problem details |
| `PATCH` | `/problems/:id` | `RECRUITER`, `ADMIN` | Update problem statement, options, or test cases |
| `DELETE` | `/problems/:id` | `RECRUITER`, `ADMIN` | Soft delete problem (`deletedAt = now()`) preserving submissions |

### 4. Assessments & Invitations (`/api/v1/assessments`, `/api/v1/invitations`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/assessments` | `RECRUITER` | Create assessment and attach problems with custom point weights |
| `GET` | `/assessments` | `RECRUITER`, `ADMIN` | List assessments with status and candidate count metrics |
| `GET` | `/assessments/:id` | `RECRUITER`, `ADMIN` | Detailed assessment view with problem breakdown |
| `PATCH` | `/assessments/:id` | `RECRUITER`, `ADMIN` | Update assessment parameters (duration, passing score) |
| `PATCH` | `/assessments/:id/status`| `RECRUITER`, `ADMIN` | State transition (`DRAFT` → `PUBLISHED` → `CLOSED`) |
| `DELETE` | `/assessments/:id` | `RECRUITER`, `ADMIN` | Soft delete assessment |
| `POST` | `/assessments/:id/invite` | `RECRUITER` | Transactional candidate invitation (deducts 1 credit per invite) |
| `GET` | `/invitations/my` | `CANDIDATE` | List candidate's received invitations and attempt statuses |

### 5. Attempts & Submissions (`/api/v1/attempts`, `/api/v1/submissions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/attempts/start` | `CANDIDATE` | Start timed attempt; sets Redis TTL, returns sanitized problem set |
| `POST` | `/attempts/:id/submissions` | `CANDIDATE` | Submit code/MCQ answer; runs Node VM sandbox auto-grading |
| `POST` | `/attempts/:id/anti-cheat` | `CANDIDATE` | Record proctoring telemetry; auto-flags attempt if threshold exceeded |
| `POST` | `/attempts/:id/finalize` | `CANDIDATE` | Finalize attempt before timer expiry and compute total score |

### 6. Evaluation & Reports (`/api/v1/submissions`, `/api/v1/assessments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `PATCH` | `/submissions/:id/evaluate` | `RECRUITER` | Recruiter manual grading with feedback and pass/fail recalculation |
| `GET` | `/assessments/:id/report` | `RECRUITER`, `ADMIN` | Assessment analytics: pass rate, leaderboard, accuracy distribution (Redis cached) |

### 7. Payments (`/api/v1/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/payments/initiate` | `RECRUITER` | Create checkout session for credit bundles (`STARTER_25`, `PRO_100`, `ENTERPRISE_300`) |
| `POST` | `/payments/test-checkout` | `RECRUITER` | Instant development checkout completion |
| `POST` | `/payments/webhook` | Public (Signed) | Idempotent gateway webhook; increments credits and upgrades tier |
| `GET` | `/payments/:id` | `RECRUITER`, `ADMIN` | View payment receipt and status |

### 8. Admin Module (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/users` | `ADMIN` | Paginated user directory with role and status filtering |
| `PATCH` | `/admin/users/:id/role` | `ADMIN` | Update user role or account status with audit log recording |
| `GET` | `/admin/dashboard-stats` | `ADMIN` | Platform KPIs: user counts, revenue, active tests (Redis cached) |
| `GET` | `/admin/audit-logs` | `ADMIN` | Paginated, filterable system audit trail |

---

## 🚀 Local Installation & Setup

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **PostgreSQL**: Neon Cloud or local instance
- **Redis**: Redis Cloud or local Redis server

### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd B7A6
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Key environment variables:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@ep-sample.neon.tech/devassess?sslmode=require"
REDIS_URL="redis://default:password@sample.redis.com:12345"
JWT_ACCESS_SECRET="your-super-secret-access-key-32-chars-min"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-32-chars-min"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="30d"
BCRYPT_SALT_ROUNDS=12
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Database Migration & Seeding
```bash
# Push schema and generate Prisma client
npx prisma generate
npx prisma db push

# Seed demo users, recruiter company, and sample problems
npm run db:seed
```

### 5. Run the Server
```bash
# Development mode with hot reload
npm run dev

# Build and start production bundle
npm run build
npm start
```
The server will start at `http://localhost:5000` with health check available at `http://localhost:5000/api/v1/health`.

---

## 🧪 Postman Documentation & Automated Testing

A complete Postman Collection and Environment are provided in the [`postman/`](postman/) folder:

- **Collection**: `postman/devassess_collection.json` (32 requests with tests)
- **Environment**: `postman/devassess_environment.json` (Local & Production configurations)

### How to Import & Run:
1. Open Postman, click **Import**, and select both JSON files from `postman/`.
2. Select the **"DevAssess - Local & Production Environment"** in the environment dropdown.
3. Run `1. Auth -> Login Recruiter`: Token is automatically captured and injected into subsequent requests.
4. Seamlessly test creating problems, assembling assessments, inviting candidates, submitting code, and viewing analytics.

---

## 🛡️ Anti-Cheat & Security Implementation Highlights

1. **Sandboxed Code Execution**:
   - Candidate submissions run inside `node:vm` contexts isolated from `process`, `fs`, `require`, and network sockets.
   - Strict 2000ms execution timeout protects against infinite loops and resource starvation.
2. **Double-Attempt Prevention**:
   - `AssessmentAttempt` enforces an `@unique` constraint on `invitationId`.
   - Redis locks verify attempt start concurrency.
3. **Credit Integrity**:
   - Candidate invitations verify `company.assessmentCredits >= candidates.length` inside `prisma.$transaction`.
   - Credits are deducted atomically, preventing race conditions.
4. **Idempotent Webhooks**:
   - Webhook processing checks `payment.status === COMPLETED` prior to crediting the company account.

---

## 📹 Video Walkthrough Outline (Mentor Evaluation)

1. **0:00–1:30 | Architecture & Schema**: Review of `prisma/schema.prisma` join tables and the modular Express structure (`Routes → Controllers → Services → Prisma`).
2. **1:30–3:00 | Authentication & RBAC**: Postman demo logging in as `ADMIN`, `RECRUITER`, and `CANDIDATE`, showing candidate attempting recruiter endpoints returning `403 Forbidden`.
3. **3:00–4:30 | Problem Bank & Assessment Assembly**: Paginated problem bank filtering, search, and assembling an assessment with point weights.
4. **4:30–6:00 | Error Handling**: Triggering Zod validation errors (`400`) and duplicate email registration (`409`) to show standardized error JSON.
5. **6:00–7:30 | Live Payment Flow**: `POST /payments/initiate` credit checkout → instant webhook verification → showing credit balance increase and audit log entry.
6. **7:30–9:00 | Core Challenge Explanation**: How Redis TTL timer synchronization and question sanitization prevent client tampering during assessments.

---

## 📄 License

This project is licensed under the MIT License.
