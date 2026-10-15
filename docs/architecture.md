# Developer Assessment & Coding Platform — Modular Architecture (`architecture.md`)

## 1. Architectural Pattern Overview

**DevAssess** follows the **Feature-Based Modular Pattern** (`Routes → Middlewares → Controllers → Services → Prisma ORM / Redis`). Instead of grouping files by technical layer (`controllers/`, `services/`, `routes/`), every domain feature lives inside its own self-contained module under `src/app/modules/<module-name>/`.

### Why This Pattern Works Best for B7A6 Evaluation
1. **Strict Separation of Concerns:** Controllers only handle HTTP `req`/`res` via `catchAsync` and `sendResponse`; Services contain 100% of business logic, Prisma queries, and `$transaction` blocks.
2. **Zero Circular Dependencies:** Shared utilities (`prisma`, `redis`, `AppError`, `paginationHelper`, `pick`) live in `src/app/shared/` and `src/app/errors/`, while modules only import from `shared/` or `middlewares/`.
3. **Clean, Human-Readable Codebase:** Follows the exact folder structure, naming conventions, and error-handling flow taught in Apollo Level-2 Web Development, making it effortless for you to explain during your 5–10 minute walkthrough video.

---

## 2. Complete Project Directory Structure

```text
devassess-backend/
├── prisma/
│   ├── schema.prisma                # PostgreSQL models, enums, relations & indexes
│   ├── migrations/                  # Versioned SQL migration history
│   └── seed.ts                      # Idempotent seed script (Admin, Recruiter, Candidate, Demo Problems)
├── src/
│   ├── server.ts                    # Server bootstrap, DB/Redis connection & graceful shutdown
│   ├── app.ts                       # Express app config, CORS, Helmet, parsers, global routes & error handlers
│   └── app/
│       ├── config/
│       │   └── index.ts             # Validated environment variables loader (dotenv + Zod env check)
│       ├── errors/
│       │   ├── AppError.ts          # Custom operational error class with statusCode
│       │   ├── handleZodError.ts    # Formats Zod issues into [{ field, message }]
│       │   ├── handlePrismaError.ts # Maps P2002 (Unique), P2025 (Not Found), P2003 (FK) to HTTP codes
│       │   └── index.ts
│       ├── interfaces/
│       │   ├── common.ts            # IGenericResponse, IGenericErrorMessage, IPaginationOptions
│       │   └── index.d.ts           # Express Request type extension (req.user)
│       ├── middlewares/
│       │   ├── auth.ts              # JWT Bearer verification & 3-role RBAC guard (auth(Role.RECRUITER))
│       │   ├── validateRequest.ts   # Zod schema validation wrapper for body, query, params
│       │   ├── rateLimiter.ts       # Redis/Memory express-rate-limit configs (Auth, API, Submissions)
│       │   ├── upload.ts            # Multer memory/disk storage + Cloudinary uploader helper
│       │   ├── globalErrorHandler.ts# Centralized error formatter returning { success: false, message, errors }
│       │   └── notFound.ts          # 404 handler for unregistered /api/v1/* routes
│       ├── routes/
│       │   └── index.ts             # Central router mounting all 10 module routers under /api/v1
│       ├── shared/
│       │   ├── prisma.ts            # Singleton PrismaClient instance
│       │   ├── redis.ts             # Singleton ioredis client with fallback & helper methods
│       │   ├── catchAsync.ts        # Higher-order async wrapper eliminating repetitive try/catch blocks
│       │   ├── sendResponse.ts      # Standardized { success, message, meta, data } JSON sender
│       │   ├── pick.ts              # Extracts allowed filter/pagination keys from req.query
│       │   ├── paginationHelper.ts  # Calculates page, limit, skip, sortBy, sortOrder
│       │   ├── emailSender.ts       # Nodemailer / Resend HTML template dispatcher
│       │   └── auditLogger.ts       # Reusable helper to write AuditLog entries inside or outside transactions
│       └── modules/
│           ├── auth/
│           │   ├── auth.interface.ts
│           │   ├── auth.validation.ts
│           │   ├── auth.route.ts
│           │   ├── auth.controller.ts
│           │   ├── auth.service.ts
│           │   └── auth.utils.ts
│           ├── user/
│           │   ├── user.constant.ts
│           │   ├── user.validation.ts
│           │   ├── user.route.ts
│           │   ├── user.controller.ts
│           │   └── user.service.ts
│           ├── company/
│           │   ├── company.validation.ts
│           │   ├── company.route.ts
│           │   ├── company.controller.ts
│           │   └── company.service.ts
│           ├── problem/
│           │   ├── problem.constant.ts
│           │   ├── problem.interface.ts
│           │   ├── problem.validation.ts
│           │   ├── problem.route.ts
│           │   ├── problem.controller.ts
│           │   └── problem.service.ts
│           ├── assessment/
│           │   ├── assessment.constant.ts
│           │   ├── assessment.validation.ts
│           │   ├── assessment.route.ts
│           │   ├── assessment.controller.ts
│           │   └── assessment.service.ts
│           ├── invitation/
│           │   ├── invitation.validation.ts
│           │   ├── invitation.route.ts
│           │   ├── invitation.controller.ts
│           │   └── invitation.service.ts
│           ├── attempt/
│           │   ├── attempt.validation.ts
│           │   ├── attempt.route.ts
│           │   ├── attempt.controller.ts
│           │   ├── attempt.service.ts
│           │   └── attempt.evaluator.ts
│           ├── payment/
│           │   ├── payment.constant.ts
│           │   ├── payment.validation.ts
│           │   ├── payment.route.ts
│           │   ├── payment.controller.ts
│           │   ├── payment.service.ts
│           │   └── payment.gateway.ts
│           └── admin/
│               ├── admin.constant.ts
│               ├── admin.validation.ts
│               ├── admin.route.ts
│               ├── admin.controller.ts
│               └── admin.service.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

---

## 3. Anatomy of a Feature Module (6-File Standard)

Every domain module inside `src/app/modules/<module>/` follows the exact same 6-file blueprint so you never get confused while writing code:

| File Name | Responsibility | What Must NEVER Be Inside |
| :--- | :--- | :--- |
| **`<module>.constant.ts`** | Filterable fields array (`problemFilterableFields`) and searchable fields array (`problemSearchableFields`). | Database queries or route definitions. |
| **`<module>.interface.ts`** | TypeScript interfaces for filter payloads, request bodies, and helper types. | Runtime logic. |
| **`<module>.validation.ts`** | Zod schemas wrapped in `z.object({ body: z.object({...}) })` for `validateRequest`. | Database calls. |
| **`<module>.route.ts`** | Express `Router()` definition chaining `rateLimiter`, `auth(Role...)`, `validateRequest(...)`, and Controller function. | Inline route callbacks or business logic. |
| **`<module>.controller.ts`** | Extracts `req.body`, `req.params`, `req.user`, `pick(req.query, ...)`, calls `Service`, and returns `sendResponse(res, ...)`. | Direct `prisma.*` calls or complex `if/else` business workflows. |
| **`<module>.service.ts`** | All business rules, ownership checks, `prisma.$transaction`, Redis caching, and `AuditLog` creation. | `req` or `res` objects (never pass Express objects into Services). |

---

## 4. End-to-End Request Lifecycle

Every API call flows through 7 deterministic stages:

1. **HTTP Entry & Security (`app.ts`):** `helmet()`, `cors()`, and `express.json()` parse and sanitize incoming headers and payloads.
2. **Route Matching & Rate Limiting (`<module>.route.ts`):** Matches `/api/v1/<module>/...` and checks IP/user rate limits via `rateLimiter.ts`.
3. **Authentication & RBAC Guard (`middlewares/auth.ts`):**
   - Extracts `Authorization: Bearer <token>`.
   - Verifies JWT signature and decodes `{ userId, email, role }`.
   - Verifies user still exists in PostgreSQL (`isActive: true`, `deletedAt: null`).
   - Checks if `req.user.role` is included in `requiredRoles` (e.g., `auth(Role.RECRUITER, Role.ADMIN)`). Throws `401` or `403` via `AppError` if unauthorized.
4. **Input Validation (`middlewares/validateRequest.ts`):**
   - Runs `await schema.parseAsync({ body: req.body, query: req.query, params: req.params })`.
   - If invalid, forwards `ZodError` to `globalErrorHandler` which responds with HTTP `400` and field-level error array.
5. **Controller Extraction (`<module>.controller.ts`):**
   - Wrapped in `catchAsync`. Uses `pick(req.query, filterableFields)` and `pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder'])` before calling the Service.
6. **Service Execution (`<module>.service.ts`):**
   - Executes domain logic, enforces resource ownership (e.g., verifying a Recruiter owns the Assessment they are editing), manages `prisma.$transaction`, reads/invalidates Redis keys, and returns plain data.
7. **Standardized Response (`shared/sendResponse.ts`) or Error Catching (`middlewares/globalErrorHandler.ts`):**
   - Success returns `{ success: true, message, meta, data }`.
   - Any thrown `AppError`, `ZodError`, or `PrismaClientKnownRequestError` is caught by `globalErrorHandler` and formatted into `{ success: false, message, errors: [...] }`.

---

## 5. Module-by-Module Responsibility Matrix

| Module Name | Base Route | Core Responsibilities | Key Dependencies |
| :--- | :--- | :--- | :--- |
| **`auth`** | `/api/v1/auth` | Register (`CANDIDATE` / `RECRUITER`), Login, Google OAuth token verification, Refresh Token rotation. | `bcrypt`, `jsonwebtoken`, `google-auth-library`, `prisma.user` |
| **`user`** | `/api/v1/users` | `GET /me`, `PATCH /me`, avatar and PDF resume upload to Cloudinary. | `multer`, `cloudinary`, `prisma.user` |
| **`company`** | `/api/v1/companies` | Create/update Recruiter's Company profile, view credit balance & plan status. | `prisma.company`, `auditLogger` |
| **`problem`** | `/api/v1/problems` | Create/Update/Soft-Delete `MCQ`, `WRITTEN`, and `CODING` problems; paginated filter & keyword search. | `prisma.problem`, `paginationHelper`, `pick` |
| **`assessment`** | `/api/v1/assessments` | Create assessment, attach weighted problems (`AssessmentProblem`), transition status (`DRAFT → PUBLISHED → CLOSED`), generate company report. | `prisma.assessment`, `redis` (cache report) |
| **`invitation`** | `/api/v1/assessments/:id/invite`, `/api/v1/invitations` | Transactional bulk candidate invitation (deducts `assessmentCredits`), sends invite email, lists candidate's invites. | `prisma.$transaction`, `emailSender` |
| **`attempt`** | `/api/v1/attempts`, `/api/v1/submissions` | Start timed attempt (sets Redis TTL & strips hidden answers), save/auto-grade submissions, log anti-cheat tab switches, manual Recruiter evaluation. | `prisma.$transaction`, `redis` (timer sync) |
| **`payment`** | `/api/v1/payments` | Initiate real Stripe / SSLCommerz / bKash checkout session, verify signed webhook/IPN callback, credit company account atomically. | `stripe` / `sslcommerz`, `prisma.$transaction`, `auditLogger` |
| **`admin`** | `/api/v1/admin` | List all users with pagination/filters, update user roles (`CANDIDATE` / `RECRUITER` / `ADMIN`), platform KPIs, and paginated Audit Logs. | `prisma.user`, `prisma.auditLog`, `redis` |

---

## 6. Standardized Shared Utilities Blueprint

### 6.1 `sendResponse.ts` (Enforces Mandatory JSON Format)
```typescript
import { Response } from 'express';

type IApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: T | null;
};

export const sendResponse = <T>(res: Response, payload: IApiResponse<T>): void => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    ...(payload.meta && { meta: payload.meta }),
    data: payload.data,
  });
};
```

### 6.2 `globalErrorHandler.ts` (Enforces Mandatory Error Format)
All errors across the application resolve to the exact structure required by `project_requirements.md`:
```json
{
  "success": false,
  "message": "Duplicate value entered for email field",
  "errors": [
    {
      "field": "email",
      "message": "An account with this email already exists"
    }
  ]
}
```
- **Zod Validation Error:** HTTP `400` — Maps `error.issues` to `{ field: issue.path[issue.path.length - 1], message: issue.message }`.
- **Prisma `P2002` (Unique Constraint):** HTTP `409` — Extracts target field from `error.meta?.target` and returns a clean conflict error.
- **Prisma `P2025` (Record Not Found):** HTTP `404` — Returns `"Requested resource was not found"`.
- **Custom `AppError`:** Uses `error.statusCode` and `error.message`.

---

## 7. Anti-AI / Human-Authentic Architecture Guidelines

Mentors immediately spot AI-generated repositories when they see single-commit dumps, inconsistent coding styles, over-engineered comments, or dummy endpoints. Follow these architectural practices so your repository reflects genuine engineering ownership:

1. **Consistent Apollo Level-2 Idioms:** Use the exact `pick.ts` + `paginationHelper.ts` + `catchAsync.ts` + `sendResponse.ts` pattern across every single module rather than mixing random coding styles from different tutorials.
2. **No Decorative Emoji Comments or AI Boilerplate:** Never leave comments like `// Here we will implement the logic for...` or `// 🚀 AI Generated Section`. Write brief, practical developer comments only where business logic is non-obvious (e.g., `// Allow 30s grace window for network latency before marking attempt TIMED_OUT`).
3. **Domain-Specific Variable Names:** Use concrete names (`invitationRecord`, `remainingCredits`, `sanitizedProblems`) instead of generic placeholders (`data1`, `tempResult`, `item`).
4. **Incremental Module-by-Module Git History:** Build and commit one module at a time following `task.md` so `git log` shows a realistic 5-day progression where `schema.prisma`, `shared` utilities, `auth`, `problem`, `assessment`, `attempt`, `payment`, and `admin` were built sequentially.
