# Developer Assessment & Coding Platform — Start-to-Finish Master Execution Plan (`task.md`)

## 1. How to Use This Master Task List

This `task.md` orders every task **strictly by dependency** (`Step 1 → Step 2 → ... → Step 25`) from creating an empty folder to recording your final submission video.

- **Rule 1 (Never Skip Ahead):** Do not start a higher-numbered phase until the current phase compiles (`npm run build`) and passes a quick Postman check.
- **Rule 2 (Commit After Every Task):** Each task includes its exact **Git Commit Command** so you naturally build **25 meaningful, human-written commits** across 5 days instead of dumping all code at the end.

---

## 2. Phase 1 (Day 1): Project Initialization, Core Utilities & Database Schema

### Task 1.1 — Initialize Repository, TypeScript & Express Boilerplate
- [ ] Create project directory `mkdir devassess-backend && cd devassess-backend && git init`.
- [ ] Create `package.json`, `tsconfig.json`, `.gitignore`, and `.env.example` using the exact specifications in `techstack.md`.
- [ ] Run `npm install` and verify all packages install cleanly.
- [ ] Create `src/app/config/index.ts`, `src/app.ts` (with `GET /api/v1/health` health-check endpoint), and `src/server.ts`.
- [ ] Test with `npm run dev` and hit `http://localhost:5000/api/v1/health`.
- **Commit #1:** `git commit -m "chore: initialize express typescript project with env config"`

### Task 1.2 — Build Shared Helpers & Centralized Error Handling
- [ ] Create `src/app/interfaces/common.ts` and `src/app/interfaces/index.d.ts` (`req.user` typing).
- [ ] Create `src/app/shared/catchAsync.ts`, `src/app/shared/sendResponse.ts`, `src/app/shared/pick.ts`, and `src/app/shared/paginationHelper.ts`.
- [ ] Create `src/app/errors/AppError.ts`, `src/app/errors/handleZodError.ts`, and `src/app/errors/handlePrismaError.ts`.
- [ ] Create `src/app/middlewares/globalErrorHandler.ts`, `src/app/middlewares/notFound.ts`, and `src/app/middlewares/validateRequest.ts`.
- **Commit #2:** `git commit -m "feat(core): add global error handler sendResponse and pagination helpers"`

### Task 1.3 — Design & Migrate PostgreSQL Schema with Prisma ORM
- [ ] Initialize Prisma (`npx prisma init`) and paste the complete 10-model schema from `backend_prd.md` into `prisma/schema.prisma` (`User`, `Company`, `Problem`, `Assessment`, `AssessmentProblem`, `CandidateInvitation`, `AssessmentAttempt`, `Submission`, `AntiCheatLog`, `Payment`, `AuditLog`).
- [ ] Create `src/app/shared/prisma.ts` singleton client and `src/app/shared/redis.ts` client.
- [ ] Run `npx prisma migrate dev --name init_devassess_schema` and verify tables in Neon/local PostgreSQL.
- **Commit #3:** `git commit -m "feat(db): create prisma schema with assessment models indexes and soft deletes"`

### Task 1.4 — Write Idempotent Database Seed Script (`prisma/seed.ts`)
- [ ] Create `prisma/seed.ts` that upserts:
  1. Demo **Admin**: `admin@devassess.com` / `Admin@1234`
  2. Demo **Recruiter**: `recruiter@techcorp.com` / `Recruiter@1234` + a seeded `Company` (`TechCorp BD`) with `25` initial assessment credits.
  3. Demo **Candidate**: `candidate@devassess.com` / `Candidate@1234`
  4. 3 sample problems (`1 MCQ`, `1 CODING`, `1 WRITTEN`).
- [ ] Run `npm run db:seed` and inspect records using `npm run db:studio`.
- **Commit #4:** `git commit -m "feat(seed): add seed script for demo admin recruiter candidate and sample problems"`

### Task 1.5 — Early Deployment Setup (Vercel / Render)
- [ ] Create `vercel.json` (or connect Render service) and push the `main` branch to GitHub.
- [ ] Verify `/api/v1/health` works on the live URL from Day 1.
- **Commit #5:** `git commit -m "ci(deploy): add vercel configuration for serverless api deployment"`

---

## 3. Phase 2 (Day 2): Authentication, 3-Role RBAC, Users, Companies & Problem Bank

### Task 2.1 — Build Auth Module (Register, Login, Refresh Token)
- [ ] Create `src/app/modules/auth/` (`auth.validation.ts`, `auth.utils.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.route.ts`).
- [ ] Implement `POST /api/v1/auth/register` (allows registering as `CANDIDATE` or `RECRUITER`; hashes password with `bcrypt`).
- [ ] Implement `POST /api/v1/auth/login` and `POST /api/v1/auth/refresh-token` returning JWT `accessToken` and `refreshToken`.
- **Commit #6:** `git commit -m "feat(auth): implement user registration login and jwt token refresh"`

### Task 2.2 — Add Google OAuth (GCP Social Login) & Auth/RBAC Middleware
- [ ] Implement `POST /api/v1/auth/google` using `google-auth-library` (`OAuth2Client.verifyIdToken` or token info check) to find-or-create users.
- [ ] Create `src/app/middlewares/auth.ts` verifying the Bearer token, checking `isActive && !deletedAt`, and enforcing role guards (`auth(Role.CANDIDATE)`, `auth(Role.RECRUITER)`, `auth(Role.ADMIN)`).
- [ ] Create `src/app/middlewares/rateLimiter.ts` and attach `authRateLimiter` to `/api/v1/auth/*`.
- **Commit #7:** `git commit -m "feat(auth): add google oauth login and role-based auth middleware"`

### Task 2.3 — Build User Profile & Cloudinary Upload Module
- [ ] Create `src/app/middlewares/upload.ts` configuring Multer + Cloudinary upload helper.
- [ ] Create `src/app/modules/user/` implementing `GET /api/v1/users/me` and `PATCH /api/v1/users/me` (profile update + avatar/resume upload).
- **Commit #8:** `git commit -m "feat(users): implement profile management and cloudinary file upload"`

### Task 2.4 — Build Company Profile Module (Recruiter Only)
- [ ] Create `src/app/modules/company/` implementing `POST /api/v1/companies` (create/upsert Recruiter's company profile, auto-generating unique `slug`) and `GET /api/v1/companies/my`.
- [ ] Test in Postman using the Recruiter token and verify that a Candidate token receives `403 Forbidden`.
- **Commit #9:** `git commit -m "feat(companies): add recruiter company profile creation and retrieval"`

### Task 2.5 — Build Problem Bank CRUD + Soft Delete
- [ ] Create `src/app/modules/problem/` (`problem.constant.ts`, `problem.validation.ts`, `problem.service.ts`, `problem.controller.ts`, `problem.route.ts`).
- [ ] Implement `POST /api/v1/problems` (validating `options` for `MCQ` and `testCases` for `CODING` via Zod `.superRefine`).
- [ ] Implement `PATCH /api/v1/problems/:id` and `DELETE /api/v1/problems/:id` (soft delete setting `deletedAt: new Date()`).
- **Commit #10:** `git commit -m "feat(problems): implement problem bank creation update and soft delete"`

### Task 2.6 — Add Pagination, Filtering, Sorting & Search to Problem Bank
- [ ] Implement `GET /api/v1/problems` supporting `?page=1&limit=10&type=CODING&difficulty=MEDIUM&sortBy=createdAt&sortOrder=desc` (excluding `deletedAt != null`).
- [ ] Implement `GET /api/v1/problems/search?q=keyword&tag=arrays` using Prisma `contains` (`mode: 'insensitive'`) and `has` for array tags.
- **Commit #11:** `git commit -m "feat(problems): add pagination filtering sorting and keyword search endpoints"`

---

## 4. Phase 3 (Day 3): Assessments, Invitations, Timed Attempts, Submissions & Anti-Cheat

### Task 3.1 — Build Assessment Module & Status Workflow
- [ ] Create `src/app/modules/assessment/` implementing:
  - `POST /api/v1/assessments` (creates assessment + `AssessmentProblem` join records inside `prisma.$transaction`, calculating `totalPoints`).
  - `GET /api/v1/assessments` (paginated & filterable by `status`).
  - `GET /api/v1/assessments/:id` and `DELETE /api/v1/assessments/:id` (soft delete).
  - `PATCH /api/v1/assessments/:id/status` (validates state transitions `DRAFT → PUBLISHED → CLOSED` and ensures at least 1 problem is attached before publishing).
- **Commit #12:** `git commit -m "feat(assessments): implement assessment crud problem linking and status transitions"`

### Task 3.2 — Build Transactional Candidate Invitation Module
- [ ] Create `src/app/modules/invitation/` and `src/app/shared/emailSender.ts`.
- [ ] Implement `POST /api/v1/assessments/:id/invite`:
  - Uses `prisma.$transaction` to verify `company.assessmentCredits >= emails.length`.
  - Deducts credits from `Company`, creates `CandidateInvitation` rows with cryptographic `inviteToken` (`crypto.randomBytes(24).toString('hex')`), and writes an `AuditLog`.
  - Sends invitation email via Nodemailer/Resend.
- [ ] Implement `GET /api/v1/invitations/my` for logged-in `CANDIDATE` users (matching `candidateEmail == req.user.email`).
- **Commit #13:** `git commit -m "feat(invitations): implement transactional candidate invites with credit deduction"`

### Task 3.3 — Build Timed Assessment Attempt Initiation & Redis Timer Sync
- [ ] Create `src/app/modules/attempt/`.
- [ ] Implement `POST /api/v1/attempts/start`:
  - Validates `inviteToken`, verifies invitation is not expired, and uses `prisma.$transaction` to create `AssessmentAttempt` (`expiresAt = now + durationMinutes`) and mark invitation `ACCEPTED`.
  - Stores timer metadata in Redis (`attempt:timer:${attempt.id}`) with TTL.
  - Strips `isCorrect` from MCQ options and filters out `isHidden: true` coding test cases before returning the problem payload to the candidate.
- **Commit #14:** `git commit -m "feat(attempts): add timed attempt initiation answer sanitization and redis timer"`

### Task 3.4 — Build Problem Submission, Auto-Evaluation & Attempt Finalization
- [ ] Create `src/app/modules/attempt/attempt.evaluator.ts` to auto-grade `MCQ` choices and evaluate `CODING` submissions against test cases.
- [ ] Implement `POST /api/v1/attempts/:id/submissions`:
  - Checks that `now <= attempt.expiresAt + 30s grace period`.
  - Upserts `Submission` (`@@unique([attemptId, problemId])`) and records `awardedScore` for auto-gradable problems.
- [ ] Implement `POST /api/v1/attempts/:id/finalize`:
  - Aggregates all `Submission.awardedScore` values inside a transaction, calculates `percentageScore` and `isPassed`, and sets `status = SUBMITTED` (or `EVALUATED` if no written questions remain).
- **Commit #15:** `git commit -m "feat(submissions): implement problem submission auto-grading and attempt finalize"`

### Task 3.5 — Build Anti-Cheat Telemetry & Auto-Flagging Workflow
- [ ] Implement `POST /api/v1/attempts/:id/anti-cheat`:
  - Logs `TAB_SWITCH`, `WINDOW_BLUR`, or `FULLSCREEN_EXIT` in `AntiCheatLog`.
  - Increments `AssessmentAttempt.tabSwitchCount` atomically; if `tabSwitchCount > assessment.maxTabSwitches`, transitions attempt status to `FLAGGED` and records an `AuditLog`.
- **Commit #16:** `git commit -m "feat(anti-cheat): add proctoring event logging and threshold auto-flagging"`

### Task 3.6 — Build Recruiter Manual Evaluation & Company Assessment Report
- [ ] Implement `PATCH /api/v1/submissions/:id/evaluate` (`RECRUITER` only):
  - Updates `awardedScore` and `evaluatorNotes` on `WRITTEN` or `CODING` submissions.
  - Recalculates parent `AssessmentAttempt.totalScore`, `percentageScore`, `isPassed`, and sets status to `EVALUATED` inside `prisma.$transaction`.
  - Invalidates Redis cache key `report:assessment:${assessmentId}`.
- [ ] Implement `GET /api/v1/assessments/:id/report` (`RECRUITER`, `ADMIN`):
  - Returns candidate leaderboard, average score, pass rate, and anti-cheat summary (cached in Redis for 5 minutes).
- **Commit #17:** `git commit -m "feat(evaluation): add recruiter manual grading and cached assessment report"`

---

## 5. Phase 4 (Day 4): Real Payment Integration, Admin Operations & Postman Docs

### Task 4.1 — Build Payment Initiation (`POST /api/v1/payments/initiate`)
- [ ] Create `src/app/modules/payment/` (`payment.constant.ts`, `payment.gateway.ts`, `payment.service.ts`, `payment.controller.ts`, `payment.route.ts`).
- [ ] Define credit bundles (`STARTER_25`, `PRO_100`, `ENTERPRISE_300`).
- [ ] Implement `POST /api/v1/payments/initiate` (`RECRUITER` only):
  - Creates a `PENDING` `Payment` record with a unique `transactionId` (`TXN-${Date.now()}-${random}`).
  - Calls Stripe Checkout Session API or SSLCommerz v4 Session API and returns `{ paymentId, transactionId, checkoutUrl }`.
- **Commit #18:** `git commit -m "feat(payments): implement payment session initiation for credit bundles"`

### Task 4.2 — Build Payment Webhook / IPN Verification & Status Tracking
- [ ] Implement `POST /api/v1/payments/webhook` (and `POST /api/v1/payments/ssl-success` / `ssl-cancel` callbacks):
  - Verifies gateway signature / validation API.
  - Runs an idempotent `prisma.$transaction`: marks `Payment.status = COMPLETED`, increments `Company.assessmentCredits` by `creditsPurchased`, updates `Company.planTier`, and inserts an `AuditLog`.
- [ ] Implement `GET /api/v1/payments/:id` (`RECRUITER`, `ADMIN`) to retrieve live payment status and receipt details.
- **Commit #19:** `git commit -m "feat(payments): add webhook signature verification and transactional credit topup"`

### Task 4.3 — Build Admin Module (Users, Role Management, Dashboard Stats & Audit Logs)
- [ ] Create `src/app/modules/admin/` (`ADMIN` role only):
  - `GET /api/v1/admin/users`: Paginated, filterable (`?role=RECRUITER&isActive=true`), and searchable user list.
  - `PATCH /api/v1/admin/users/:id/role`: Updates user role or `isActive` status inside a transaction and writes an `AuditLog` (`oldValue` vs `newValue`).
  - `GET /api/v1/admin/dashboard-stats`: Aggregates total users by role, total completed revenue, active assessments, and total attempts (cached in Redis).
  - `GET /api/v1/admin/audit-logs`: Paginated system audit trail filterable by `action` and `entityType`.
- **Commit #20:** `git commit -m "feat(admin): implement user role management dashboard stats and audit logs"`

### Task 4.4 — Comprehensive End-to-End Testing & Edge Case Fixes
- [ ] Test all 3 roles (`CANDIDATE`, `RECRUITER`, `ADMIN`) in Postman to confirm cross-role access returns `403 Forbidden`.
- [ ] Trigger invalid Zod inputs, duplicate emails (`409`), expired tokens (`401`), and non-existent UUIDs (`404`) to confirm every error matches `{ success: false, message, errors: [] }`.
- **Commit #21:** `git commit -m "fix(validation): refine zod error messages and prisma unique constraint handling"`

### Task 4.5 — Export & Publish Complete Postman Documentation
- [ ] Organize Postman requests into 8 clean folders (`1. Auth`, `2. Users & Company`, `3. Problem Bank`, `4. Assessments & Invitations`, `5. Candidate Attempts & Submissions`, `6. Evaluation & Reports`, `7. Payments`, `8. Admin & Audit Logs`).
- [ ] Save example responses (`200 OK`, `201 Created`, `400 Bad Request`, `403 Forbidden`) on key requests and publish the Postman documentation URL.
- **Commit #22:** `git commit -m "docs(postman): add complete postman collection and environment specification"`

---

## 6. Phase 5 (Day 5): Production Deployment, Human-Polish Audit & Video Walkthrough

### Task 5.1 — Production Database Migration, Seeding & Live API Verification
- [ ] Push final code to Vercel/Render, run `npx prisma migrate deploy` and `npm run db:seed` against the production PostgreSQL database.
- [ ] Test the live production URL across all 8 Postman folders.
- **Commit #23:** `git commit -m "chore(release): configure production cors rate limits and seed verification"`

### Task 5.2 — Finalize Professional `README.md`
- [ ] Write a clear `README.md` containing: Project Overview, Architecture Diagram, Tech Stack, Complete API Endpoint Table, Local Setup Guide, Live Links, Postman Docs Link, and Demo Admin/Recruiter/Candidate Credentials.
- **Commit #24:** `git commit -m "docs(readme): complete project documentation api reference and demo credentials"`

---

## 7. Mentor Review & Human-Craftsmanship Checklist (How to Ensure Your Project Looks 100% Authentically Built by You)

Mentors evaluate hundreds of submissions and can easily tell when someone blindly pasted AI output vs. engineered the project themselves. Follow these 6 habits while building:

1. **Never Commit Everything at Once:** Follow the 24 commits above over several days. If you write a small bug and fix it 15 minutes later, commit the fix naturally (`fix(attempt): handle null customPoints when calculating max score`). Real developers have `fix:` and `refactor:` commits alongside `feat:` commits.
2. **Strip Generic AI Comments & Unused Code:** Before every commit, review `git diff`. Delete robotic comments like `// Step 1: Check if user exists` or `// Call prisma to get data`. Keep only meaningful comments that explain *why* a business rule exists.
3. **Personalize Seed Data & Postman Examples:** In `prisma/seed.ts` and Postman requests, use realistic Bangladeshi company and developer names (e.g., `Pathao Engineering`, `Chaldal Tech`, `Tanvir Ahmed`, `Nusrat Jahan`) and realistic coding problems instead of generic `"John Doe"` or `"Test Company 123"`.
4. **Understand Every Line in These 4 Files Before Recording Your Video:**
   - `prisma/schema.prisma` (why `AssessmentProblem` is a join table and why `invitationId` is `@unique` on `AssessmentAttempt`).
   - `src/app/middlewares/auth.ts` (how JWT verification + 3-role RBAC works).
   - `src/app/modules/attempt/attempt.service.ts` (how `prisma.$transaction` and Redis timer TTL prevent cheating and double attempts).
   - `src/app/modules/payment/payment.service.ts` (how payment initiation → webhook verification → credit increment works).
5. **Follow the Exact 6-Point Video Script (5–10 Minutes):**
   - **0:00–1:30:** Show `schema.prisma` and the modular folder structure (`Routes → Controllers → Services → Prisma`).
   - **1:30–3:00:** Log in as `ADMIN`, `RECRUITER`, and `CANDIDATE` in Postman; show a `CANDIDATE` trying to hit `POST /api/v1/assessments` and getting `403 Forbidden`.
   - **3:00–4:30:** Show Problem & Assessment CRUD, pagination/filtering (`GET /api/v1/problems?type=CODING&page=1&limit=5`), and soft delete.
   - **4:30–6:00:** Trigger a Zod validation error (`400`) and a `404` route error to show the standardized error JSON.
   - **6:00–7:30:** Walk through the live Payment flow (`POST /api/v1/payments/initiate` → open `checkoutUrl` in browser → complete test payment → show `assessmentCredits` increased in DB and logged in `GET /api/v1/admin/audit-logs`).
   - **7:30–9:00:** Explain one technical challenge in your own words: *"How I prevented candidates from bypassing the assessment timer or seeing hidden test cases by sanitizing the problem payload on attempt start and validating `expiresAt` in Redis + Prisma transactions."*
