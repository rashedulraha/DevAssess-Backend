# Antigravity & Agent Instructions — DevAssess Project Context

## 1. Mandatory Context: Read `/docs` Automatically
Whenever assisting with or developing in this repository, you **MUST ALWAYS** consult and strictly adhere to the project documentation located in the [`docs/`](file:///Users/rashedulraha/Developer/B7A6/docs) folder without requiring the user to prompt you:

1. **[`docs/backend_prd.md`](file:///Users/rashedulraha/Developer/B7A6/docs/backend_prd.md)**:
   - Complete Product Requirement Document.
   - 3 Fixed Primary Roles: `CANDIDATE`, `RECRUITER`, `ADMIN` with RBAC Matrix.
   - Complete 10-Model Prisma PostgreSQL Schema (`User`, `Company`, `Problem`, `Assessment`, `AssessmentProblem`, `CandidateInvitation`, `AssessmentAttempt`, `Submission`, `AntiCheatLog`, `Payment`, `AuditLog`).
   - 28+ standardized REST API endpoints (`/api/v1/...`).
   - Transaction boundaries (`prisma.$transaction`), Redis caching strategy, and anti-cheat telemetry.

2. **[`docs/architecture.md`](file:///Users/rashedulraha/Developer/B7A6/docs/architecture.md)**:
   - Modular Feature-Based Pattern (`src/app/modules/<module-name>/`).
   - Each module contains: `interface`, `validation`, `route`, `controller`, `service`, `constant`/`utils`.
   - Shared utilities: `catchAsync`, `sendResponse`, `pick`, `paginationHelper`, `emailSender`, `auditLogger`.
   - Centralized error handling: `AppError`, `handleZodError`, `handlePrismaError`, `globalErrorHandler`, `notFound`.

3. **[`docs/task.md`](file:///Users/rashedulraha/Developer/B7A6/docs/task.md)**:
   - Master 5-Day Execution Plan (25 sequential tasks, Days 1–5).
   - Strict dependency order: Never skip ahead until the current task compiles and passes checks.
   - Exact git commit conventions and video walkthrough checklist.

4. **[`docs/techstack.md`](file:///Users/rashedulraha/Developer/B7A6/docs/techstack.md)**:
   - Exact latest package versions for Node.js, Express 5, Prisma 7, Zod 4, TypeScript 7, etc.
   - Standard `package.json`, `tsconfig.json`, and `.env.example`.

---

## 2. Architectural & Implementation Standards

- **Folder Structure**: Always write code in `src/app/modules/<module>/` following the controller-service pattern.
- **Request / Response Envelope**:
  - Success: `{ "success": true, "message": "...", "data": { ... } }`
  - Error: `{ "success": false, "message": "...", "errors": [ ... ] }`
- **Error Handling**: Throw `AppError` inside services with appropriate HTTP status codes. Never write ad-hoc try-catch inside controllers; wrap with `catchAsync`.
- **Database Safety**:
  - Use `prisma.$transaction` for multi-step mutations (e.g., candidate invite credit deduction, attempt start, payment webhook completion).
  - Use soft deletes (`deletedAt`) for entities where historical integrity matters (`Problem`, `Assessment`, `User`).
- **Sanitization**: Never leak answers or hidden test cases in `GET /attempts/start` or candidate problem payloads.
