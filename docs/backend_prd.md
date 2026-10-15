# Developer Assessment & Coding Platform — Backend PRD

## 1. Executive Summary & Project Overview

**Project Name:** DevAssess — Developer Assessment & Technical Hiring Platform (Backend API)  
**Assignment Track:** Idea #4 — Developer Assessment & Coding Platform (`idea-hub.md`)  
**Architecture Style:** Modular RESTful API (`Routes → Controllers → Services → Prisma ORM → PostgreSQL + Redis`)

### 1.1 Core Problem Statement
Technical hiring teams struggle to evaluate developer candidates objectively at scale. Coordinating coding challenges, multiple-choice questions (MCQs), and architecture written prompts across spreadsheets, emails, and disconnected forms leads to leaked questions, inconsistent grading, timer manipulation, and slow hiring decisions.

### 1.2 Proposed Solution
**DevAssess** provides a secure, transaction-safe RESTful backend that powers the complete technical assessment lifecycle:
1. **Recruiters (Companies)** subscribe to an assessment plan or purchase invitation credits via real payment gateways (**Stripe, SSLCommerz, or bKash**), curate a reusable **Problem Bank** (Coding, MCQ, Written), assemble timed **Assessments**, and invite candidates.
2. **Candidates** accept invitations, enter a server-timed **Assessment Attempt**, submit answers with real-time anti-cheating telemetry (tab-switch/fullscreen logs), and receive automated grading for MCQs/test-cases alongside structured evaluator feedback.
3. **Admins** oversee platform integrity, manage user roles, monitor payment ledgers, and audit critical state transitions via immutable **Audit Logs**.

---

## 2. Tech Stack & Infrastructure

| Category | Technology | Purpose in DevAssess |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js, TypeScript, Express.js | Strictly typed, modular REST API (`v1`) |
| **Database & ORM** | PostgreSQL + Prisma ORM | Relational modeling, ACID transactions, indexing, and soft deletes |
| **Validation** | Zod | Strict request body, query, and parameter validation middleware |
| **Authentication** | JWT Bearer Auth + Better Auth / GCP OAuth | Email/Password + Google Social Login with Access & Refresh tokens |
| **Caching & State** | Redis (`ioredis`) | Server-authoritative attempt timers, rate limiting, and analytics caching |
| **Payment Gateway** | Stripe / SSLCommerz / bKash | Real payment processing for Recruiter Assessment Credits / Pro Plans |
| **File Storage** | Multer + Cloudinary | Company logos, candidate resumes, and problem statement diagrams |
| **Email Service** | Nodemailer / Resend | Candidate invitation links, payment receipts, and score notifications |
| **Security & Quality** | Helmet, CORS, `express-rate-limit`, Biome/ESLint | HTTP hardening, brute-force protection, and clean code formatting |
| **Documentation & Deploy** | Postman / OpenAPI (Swagger) + Vercel / Render | Interactive API documentation and production serverless/container hosting |

---

## 3. Users, 3 Fixed Primary Roles & RBAC Matrix

To satisfy the mandatory **3 fixed primary roles** rule (`project_requirements.md`), the platform enforces strict Role-Based Access Control (RBAC) across three distinct roles:

1. **`CANDIDATE`**: Developers invited to take technical assessments, submit code/answers, and track their assessment history.
2. **`RECRUITER`**: Company hiring managers, assessment creators, and evaluators who purchase assessment credits, manage the problem bank, invite candidates, and evaluate submissions.
3. **`ADMIN`**: Platform administrators who manage users, enforce role permissions, monitor payments, and inspect system-wide audit logs.

### Role Permission Matrix

| Capability / Domain | `CANDIDATE` | `RECRUITER` | `ADMIN` |
| :--- | :---: | :---: | :---: |
| Register, Login, Google OAuth, Refresh Token | Yes | Yes | Yes |
| View & Update Own Profile / Resume / Avatar | Yes | Yes | Yes |
| Initiate Payment for Assessment Credits / Plan | No | Yes | No |
| Create, Update, Soft-Delete Problems & Assessments | No | Yes (Own Company) | Yes (Moderation) |
| Invite Candidates to an Assessment | No | Yes (Requires Credits) | No |
| Start Timed Attempt & Submit Answers | Yes (Invited Only) | No | No |
| Record Anti-Cheating Telemetry Events | Yes (Active Attempt) | No | No |
| Evaluate Written/Coding Submissions & Publish Scores | No | Yes (Own Company) | Yes |
| View Company Assessment Reports & Leaderboard | No | Yes (Own Company) | Yes |
| Manage All Users, Change Roles, View Audit Logs | No | No | Yes |

---

## 4. Core Workflows & State Machines

### 4.1 End-to-End Assessment Workflow
1. **Company Onboarding & Payment:** A `RECRUITER` creates a company profile and initiates a payment (`POST /api/v1/payments/initiate`) via Stripe/SSLCommerz/bKash to unlock assessment credits.
2. **Webhook Verification:** The payment gateway triggers `POST /api/v1/payments/webhook`. Inside a Prisma transaction, the backend marks the payment as `COMPLETED`, increments the company's `assessmentCredits`, and writes an `AuditLog`.
3. **Problem & Assessment Creation:** The `RECRUITER` creates problems (`MCQ`, `WRITTEN`, `CODING`) in the Problem Bank and links them to a timed Assessment with weighted points and passing criteria.
4. **Candidate Invitation:** The `RECRUITER` invites candidates by email (`POST /api/v1/assessments/:id/invite`). A unique invitation token is generated and emailed, deducting 1 credit per candidate inside a database transaction.
5. **Timed Attempt Initiation:** The `CANDIDATE` starts the assessment (`POST /api/v1/attempts/start`). The server computes `expiresAt = startedAt + durationMinutes`, caches the active session in Redis, and returns the sanitized problem set (hiding secret test cases and correct MCQ answers).
6. **Submission & Auto/Manual Evaluation:** The `CANDIDATE` submits individual problem responses and finalizes the attempt (`POST /api/v1/attempts/:id/submit`). The backend validates that `now <= expiresAt + gracePeriod`, auto-grades `MCQ` and `CODING` test cases immediately, and queues `WRITTEN` answers for `RECRUITER` review.
7. **Final Score & Company Report:** Once evaluated, the total score, percentile, and anti-cheat integrity summary are compiled into the Company Report.

### 4.2 State Transition Rules

| Entity | Valid States | Allowed Transitions |
| :--- | :--- | :--- |
| **Assessment** | `DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED` | `DRAFT → PUBLISHED → CLOSED → ARCHIVED` |
| **Invitation** | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` | `PENDING → ACCEPTED`, `PENDING → EXPIRED`, `PENDING → REVOKED` |
| **AssessmentAttempt** | `IN_PROGRESS`, `SUBMITTED`, `TIMED_OUT`, `EVALUATED`, `FLAGGED` | `IN_PROGRESS → SUBMITTED / TIMED_OUT → EVALUATED`, any state `→ FLAGGED` |
| **Payment** | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` | `PENDING → COMPLETED`, `PENDING → FAILED`, `COMPLETED → REFUNDED` |

---

## 5. Database Design & Prisma Schema

### 5.1 Entity Relationship Overview
- **`User` (1) ── (0..1) `Company`**: A Recruiter manages a Company profile.
- **`Company` (1) ── (N) `Payment`**: Tracks real payment transactions and credit top-ups.
- **`Company` (1) ── (N) `Problem`**: Reusable questions (`MCQ`, `CODING`, `WRITTEN`) with soft delete support.
- **`Company` (1) ── (N) `Assessment`**: Timed test containers linked to `Problem` via `AssessmentProblem` join table.
- **`Assessment` (1) ── (N) `CandidateInvitation`**: Tracks invited candidates and prevents duplicate invites.
- **`CandidateInvitation` (1) ── (0..1) `AssessmentAttempt`**: Enforces single-attempt concurrency control.
- **`AssessmentAttempt` (1) ── (N) `Submission`**: Stores candidate code/answers and evaluator grades per problem.
- **`AssessmentAttempt` (1) ── (N) `AntiCheatLog`**: Tracks tab switches, window blurs, and clipboard events.
- **`User` (1) ── (N) `AuditLog`**: Immutable record of critical role, status, and payment changes.

### 5.2 Complete `schema.prisma` Specification

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CANDIDATE
  RECRUITER
  ADMIN
}

enum ProblemType {
  MCQ
  WRITTEN
  CODING
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum AssessmentStatus {
  DRAFT
  PUBLISHED
  CLOSED
  ARCHIVED
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  TIMED_OUT
  EVALUATED
  FLAGGED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?
  googleId      String?   @unique
  fullName      String
  role          Role      @default(CANDIDATE)
  avatarUrl     String?
  resumeUrl     String?
  bio           String?
  isActive      Boolean   @default(true)
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company?
  invitations   CandidateInvitation[]
  attempts      AssessmentAttempt[]
  evaluations   Submission[]          @relation("EvaluatedBy")
  auditLogs     AuditLog[]

  @@index([email])
  @@index([role, isActive])
}

model Company {
  id                String    @id @default(uuid())
  ownerId           String    @unique
  name              String
  slug              String    @unique
  logoUrl           String?
  website           String?
  industry          String?
  assessmentCredits Int       @default(0)
  planTier          String    @default("FREE")
  deletedAt         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  owner             User         @relation(fields: [ownerId], references: [id])
  problems          Problem[]
  assessments       Assessment[]
  payments          Payment[]

  @@index([slug])
}

model Problem {
  id              String      @id @default(uuid())
  companyId       String
  title           String
  description     String
  type            ProblemType
  difficulty      Difficulty
  tags            String[]
  options         Json?       // For MCQ: [{ id: "A", text: "...", isCorrect: true }]
  starterCode     Json?       // For CODING: { javascript: "...", python: "..." }
  testCases       Json?       // For CODING: [{ input: "...", expectedOutput: "...", isHidden: true }]
  maxScore        Int         @default(10)
  deletedAt       DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  company         Company             @relation(fields: [companyId], references: [id])
  assessments     AssessmentProblem[]
  submissions     Submission[]

  @@index([companyId, type, difficulty])
  @@index([deletedAt])
}

model Assessment {
  id                String           @id @default(uuid())
  companyId         String
  title             String
  description       String?
  durationMinutes   Int              @default(60)
  passingScore      Int              @default(70)
  totalPoints       Int              @default(100)
  status            AssessmentStatus @default(DRAFT)
  maxTabSwitches    Int              @default(3)
  startAt           DateTime?
  endAt             DateTime?
  deletedAt         DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  company           Company               @relation(fields: [companyId], references: [id])
  problems          AssessmentProblem[]
  invitations       CandidateInvitation[]
  attempts          AssessmentAttempt[]

  @@index([companyId, status])
  @@index([deletedAt])
}

model AssessmentProblem {
  id           String     @id @default(uuid())
  assessmentId String
  problemId    String
  orderIndex   Int        @default(1)
  customPoints Int?

  assessment   Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  problem      Problem    @relation(fields: [problemId], references: [id])

  @@unique([assessmentId, problemId])
}

model CandidateInvitation {
  id             String           @id @default(uuid())
  assessmentId   String
  candidateEmail String
  candidateId    String?
  inviteToken    String           @unique
  status         InvitationStatus @default(PENDING)
  expiresAt      DateTime
  sentAt         DateTime         @default(now())
  acceptedAt     DateTime?

  assessment     Assessment         @relation(fields: [assessmentId], references: [id])
  candidate      User?              @relation(fields: [candidateId], references: [id])
  attempt        AssessmentAttempt?

  @@unique([assessmentId, candidateEmail])
  @@index([inviteToken])
  @@index([candidateEmail, status])
}

model AssessmentAttempt {
  id              String        @id @default(uuid())
  invitationId    String        @unique
  assessmentId    String
  candidateId     String
  status          AttemptStatus @default(IN_PROGRESS)
  startedAt       DateTime      @default(now())
  expiresAt       DateTime
  submittedAt     DateTime?
  evaluatedAt     DateTime?
  totalScore      Float         @default(0)
  percentageScore Float         @default(0)
  isPassed        Boolean       @default(false)
  tabSwitchCount  Int           @default(0)
  ipAddress       String?

  invitation      CandidateInvitation @relation(fields: [invitationId], references: [id])
  assessment      Assessment          @relation(fields: [assessmentId], references: [id])
  candidate       User                @relation(fields: [candidateId], references: [id])
  submissions     Submission[]
  antiCheatLogs   AntiCheatLog[]

  @@index([assessmentId, status])
  @@index([candidateId])
}

model Submission {
  id              String    @id @default(uuid())
  attemptId       String
  problemId       String
  selectedOption  String?   // For MCQ
  writtenAnswer   String?   // For WRITTEN
  sourceCode      String?   // For CODING
  language        String?   // e.g., "typescript", "python"
  passedTestCases Int       @default(0)
  totalTestCases  Int       @default(0)
  awardedScore    Float     @default(0)
  isAutoEvaluated Boolean   @default(false)
  evaluatorId     String?
  evaluatorNotes  String?
  submittedAt     DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  attempt         AssessmentAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  problem         Problem           @relation(fields: [problemId], references: [id])
  evaluator       User?             @relation("EvaluatedBy", fields: [evaluatorId], references: [id])

  @@unique([attemptId, problemId])
}

model AntiCheatLog {
  id        String   @id @default(uuid())
  attemptId String
  eventType String   // "TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT", "COPY_PASTE"
  metadata  Json?
  createdAt DateTime @default(now())

  attempt   AssessmentAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)

  @@index([attemptId, eventType])
}

model Payment {
  id                String        @id @default(uuid())
  companyId         String
  provider          String        // "STRIPE" | "SSLCOMMERZ" | "BKASH"
  transactionId     String        @unique
  gatewaySessionId  String?
  amount            Float
  currency          String        @default("BDT")
  creditsPurchased  Int
  status            PaymentStatus @default(PENDING)
  rawWebhookPayload Json?
  paidAt            DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  company           Company       @relation(fields: [companyId], references: [id])

  @@index([companyId, status])
  @@index([transactionId])
}

model AuditLog {
  id         String   @id @default(uuid())
  actorId    String
  action     String   // e.g., "USER_ROLE_UPDATED", "PAYMENT_VERIFIED", "ATTEMPT_FLAGGED"
  entityType String
  entityId   String
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  actor      User     @relation(fields: [actorId], references: [id])

  @@index([actorId, createdAt])
  @@index([entityType, entityId])
}
```

---

## 6. Standardized API Specification (28 Meaningful Endpoints)

All API endpoints follow `/api/v1/...` versioning and return the mandatory response envelope:

- **Success Envelope:**
```json
{
  "success": true,
  "message": "Assessments fetched successfully",
  "data": {
    "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 },
    "items": []
  }
}
```

- **Error Envelope:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "durationMinutes", "message": "Duration must be at least 15 minutes" }
  ]
}
```

### Complete Endpoint Inventory (28 Endpoints)

| # | Method | Endpoint | Allowed Roles | Description & Technical Features |
| :-: | :--- | :--- | :--- | :--- |
| **1** | `POST` | `/api/v1/auth/register` | Public | Register as `CANDIDATE` or `RECRUITER` with Zod validation & bcrypt password hashing |
| **2** | `POST` | `/api/v1/auth/login` | Public | Email/password login returning JWT Access & Refresh tokens |
| **3** | `POST` | `/api/v1/auth/google` | Public | GCP Social OAuth login / account linking |
| **4** | `POST` | `/api/v1/auth/refresh-token` | Public | Rotate refresh token and issue new access token |
| **5** | `GET` | `/api/v1/users/me` | All Auth | Retrieve current user profile, company details (if Recruiter), and stats |
| **6** | `PATCH` | `/api/v1/users/me` | All Auth | Update profile, bio, avatar/resume upload via Multer + Cloudinary |
| **7** | `POST` | `/api/v1/companies` | `RECRUITER` | Create or update company profile and branding |
| **8** | `POST` | `/api/v1/problems` | `RECRUITER` | Create a new `MCQ`, `WRITTEN`, or `CODING` problem with test cases |
| **9** | `GET` | `/api/v1/problems` | `RECRUITER`, `ADMIN` | List problem bank with **pagination**, **filtering** (`?type=CODING&difficulty=HARD`), & **sorting** |
| **10** | `GET` | `/api/v1/problems/search` | `RECRUITER`, `ADMIN` | Full-text keyword & tag **search** (`?q=binary+tree&tag=dp`) |
| **11** | `PATCH` | `/api/v1/problems/:id` | `RECRUITER`, `ADMIN` | Update problem statement, options, or test cases |
| **12** | `DELETE` | `/api/v1/problems/:id` | `RECRUITER`, `ADMIN` | **Soft delete** a problem (`deletedAt = now()`) while preserving historical submissions |
| **13** | `POST` | `/api/v1/assessments` | `RECRUITER` | Create an assessment and attach ordered problems with point weights |
| **14** | `GET` | `/api/v1/assessments` | `RECRUITER`, `ADMIN` | Paginated & filtered list of assessments (`?status=PUBLISHED&sortBy=createdAt`) |
| **15** | `GET` | `/api/v1/assessments/:id` | `RECRUITER`, `ADMIN` | Detailed assessment view including problem breakdown and invitation metrics |
| **16** | `PATCH` | `/api/v1/assessments/:id/status` | `RECRUITER`, `ADMIN` | State transition (`DRAFT → PUBLISHED → CLOSED`) with validation checks |
| **17** | `DELETE` | `/api/v1/assessments/:id` | `RECRUITER`, `ADMIN` | **Soft delete** an assessment (`deletedAt = now()`) |
| **18** | `POST` | `/api/v1/assessments/:id/invite` | `RECRUITER` | Invite one or bulk candidates (Prisma transaction deducts credits & sends email) |
| **19** | `GET` | `/api/v1/invitations/my` | `CANDIDATE` | List candidate's pending, accepted, and expired assessment invitations |
| **20** | `POST` | `/api/v1/attempts/start` | `CANDIDATE` | Start timed attempt using `inviteToken`, lock attempt in DB + Redis TTL, return sanitized questions |
| **21** | `POST` | `/api/v1/attempts/:id/submissions` | `CANDIDATE` | Submit or auto-save an answer for a problem; runs auto-evaluation for MCQ/Coding test cases |
| **22** | `POST` | `/api/v1/attempts/:id/anti-cheat` | `CANDIDATE` | Log tab-switch/fullscreen violation; auto-flags attempt if `tabSwitchCount > maxTabSwitches` |
| **23** | `POST` | `/api/v1/attempts/:id/finalize` | `CANDIDATE` | Finalize attempt before timer expiry, compute auto-scores inside a Prisma transaction |
| **24** | `PATCH` | `/api/v1/submissions/:id/evaluate` | `RECRUITER` | Manual evaluation of `WRITTEN`/`CODING` submission, recalculating total attempt score & pass/fail |
| **25** | `GET` | `/api/v1/assessments/:id/report` | `RECRUITER`, `ADMIN` | Comprehensive company report: candidate leaderboard, pass rate, score distribution (Redis cached) |
| **26** | `POST` | `/api/v1/payments/initiate` | `RECRUITER` | Create real Stripe / SSLCommerz / bKash checkout session for credit bundles |
| **27** | `POST` | `/api/v1/payments/webhook` | Public (Signed) | Verify payment signature/IPN callback, credit company account, and record audit log |
| **28** | `GET` | `/api/v1/payments/:id` | `RECRUITER`, `ADMIN` | Retrieve payment status and receipt metadata |
| **29** | `GET` | `/api/v1/admin/users` | `ADMIN` | Paginated & filtered user directory (`?role=RECRUITER&isActive=true`) |
| **30** | `PATCH` | `/api/v1/admin/users/:id/role` | `ADMIN` | Update user role or suspend account, automatically recording an `AuditLog` |
| **31** | `GET` | `/api/v1/admin/dashboard-stats` | `ADMIN` | Platform-wide KPIs: revenue, active assessments, total attempts, role distribution |
| **32** | `GET` | `/api/v1/admin/audit-logs` | `ADMIN` | Paginated audit trail filterable by actor, action, and date range |

---

## 7. Business Rules, Transactions, Caching & Edge Cases

### 7.1 Database Transaction Boundaries (`prisma.$transaction`)
1. **Candidate Invitation & Credit Deduction (`POST /api/v1/assessments/:id/invite`)**:
   - Uses an interactive Prisma transaction with row-level check on `Company.assessmentCredits`.
   - If `assessmentCredits < candidateEmails.length`, throws `402 Payment Required` and rolls back.
   - Deducts credits, inserts `CandidateInvitation` records, and logs the action atomically.
2. **Starting an Assessment Attempt (`POST /api/v1/attempts/start`)**:
   - Checks that `CandidateInvitation.status == PENDING` and `expiresAt > now()`.
   - Atomically updates `CandidateInvitation.status = ACCEPTED` and creates `AssessmentAttempt` with a unique constraint on `invitationId` to prevent race-condition double attempts.
3. **Payment Webhook Processing (`POST /api/v1/payments/webhook`)**:
   - Checks idempotency (`Payment.status != COMPLETED`).
   - Atomically updates `Payment.status = COMPLETED`, increments `Company.assessmentCredits`, updates `Company.planTier`, and inserts an `AuditLog` entry.

### 7.2 Redis Caching & Rate Limiting Strategy
- **Active Attempt Timer Key (`attempt:timer:{attemptId}`)**: Stores `{ candidateId, expiresAt, maxTabSwitches }` with a TTL matching the assessment duration + 60-second network grace window for sub-millisecond validation on every submission request.
- **Sanitized Assessment Problem Payload (`assessment:questions:{assessmentId}`)**: Cached for 30 minutes (with `isCorrect` and hidden test cases stripped) so 500 concurrent candidates starting an assessment do not overload PostgreSQL.
- **Company Report & Admin Stats (`report:assessment:{id}`, `admin:stats`)**: Cached for 5 minutes; invalidated automatically when a new submission is finalized or evaluated.
- **Endpoint Rate Limiting**:
  - Auth routes (`/auth/login`, `/auth/register`): 10 requests / 15 minutes per IP.
  - Submission route (`/attempts/:id/submissions`): 30 requests / minute per candidate to prevent code-runner spamming.

### 7.3 Important Edge Cases Handled
- **Late Submission vs. Network Latency:** Server enforces `expiresAt + 30 seconds grace period`. Any submission after the grace window is rejected with `403 Attempt Expired` and transitions the attempt to `TIMED_OUT`.
- **Sanitizing Secret Answers:** `GET` and `POST /attempts/start` use strict Prisma `select` projections and a service sanitizer so `MCQ` `isCorrect` flags and `CODING` `isHidden: true` test cases are never leaked to the client network tab.
- **Soft-Deleted Problems in Active Assessments:** Soft deleting a problem removes it from future assessment creation lists (`where: { deletedAt: null }`), but existing historical `Submission` records remain intact for audit and report accuracy.

---

## 8. 5-Day Execution Timeline & 20+ Git Commit Breakdown

Aligned with `timeline-breakdown.md` to ensure steady daily progress, daily deployment checks, and at least 20 meaningful commits.

| Day | Focus Area | Key Deliverables | Planned Meaningful Git Commits (22 Total) |
| :-: | :--- | :--- | :--- |
| **Day 1** | **Planning, Architecture & Database** | Express + TS setup, Prisma schema, migrations, seed script, Vercel/Render pipeline | `chore: initialize express typescript project with eslint and prettier`<br>`feat(db): configure prisma schema for users companies assessments and payments`<br>`feat(db): add database indexes and soft delete timestamps`<br>`feat(seed): create seed script with demo admin recruiter and candidate accounts`<br>`ci(deploy): configure vercel serverless entry and healthcheck endpoint` |
| **Day 2** | **Authentication, RBAC & Core CRUD** | JWT Auth, Google OAuth, 3-Role Middleware, User Profile, Problem Bank CRUD | `feat(auth): implement user registration and login with bcrypt and jwt`<br>`feat(auth): add google oauth login and refresh token rotation`<br>`feat(rbac): implement role authorization middleware for candidate recruiter admin`<br>`feat(users): add profile retrieval and cloudinary file upload endpoints`<br>`feat(problems): implement problem bank crud with soft delete support` |
| **Day 3** | **Business Logic, Validation & Advanced Queries** | Assessments, Invitations, Timed Attempts, Submissions, Pagination/Search, Redis | `feat(validation): add zod validation schemas and global error handler`<br>`feat(problems): add pagination filtering sorting and keyword search to problems`<br>`feat(assessments): implement assessment creation status workflow and candidate invites`<br>`feat(attempts): build transaction-safe timed attempt start and redis timer sync`<br>`feat(submissions): implement mcq and coding auto-evaluation and finalize workflow`<br>`feat(anti-cheat): add tab-switch telemetry logging and automatic attempt flagging` |
| **Day 4** | **Payment Integration, Admin & Testing** | Stripe/SSLCommerz/bKash integration, Evaluator & Admin APIs, Audit Logs, Postman Docs | `feat(payments): integrate payment gateway session initiation for assessment credits`<br>`feat(payments): implement webhook verification and transactional credit allocation`<br>`feat(evaluation): add recruiter manual grading endpoint and company assessment report`<br>`feat(admin): implement admin user role management dashboard stats and audit logs`<br>`docs(postman): export complete postman collection with environment variables` |
| **Day 5** | **Deployment, QA & Video Walkthrough** | Production DB migration, live endpoint testing, README submission block, 5–10m video | `docs(readme): add live api url postman docs demo admin credentials and architecture` |
