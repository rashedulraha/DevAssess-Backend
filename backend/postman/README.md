# DevAssess Postman Collection & Testing Guide

This directory contains the official, comprehensive Postman Collection and Environment specifications for **DevAssess REST API**.

## Files Included

1. **`devassess_collection.json`**: Complete Postman v2.1.0 collection organized into 8 modular folders covering all 32 endpoints with realistic payloads and pre-configured test scripts for automatic token and variable chaining.
2. **`devassess_environment.json`**: Pre-configured environment variables for local (`http://localhost:5000/api/v1`) and production deployments, including demo credentials and role tokens.

---

## 8 Modular API Folders

1. **`1. Auth`**: User registration, login for all 3 roles (`ADMIN`, `RECRUITER`, `CANDIDATE`), Google OAuth2 login, and session refresh token rotation.
2. **`2. Users & Company`**: Profile retrieval (`/users/me`), bio/avatar updates, company profile creation, and recruiter company details.
3. **`3. Problem Bank`**: Coding, MCQ, and Written problem creation, test cases, pagination, filtering by difficulty/type, full-text search, and soft deletion.
4. **`4. Assessments & Invitations`**: Assessment assembly with problem point weights, status transitions (`DRAFT` → `PUBLISHED` → `CLOSED`), transactional candidate invitations with credit deduction, and candidate invitation listing.
5. **`5. Candidate Attempts & Submissions`**: Timed attempt start (with sanitized questions), isolated Node.js VM auto-evaluation of coding solutions, anti-cheat telemetry recording (`TAB_SWITCH`), and attempt finalization.
6. **`6. Evaluation & Reports`**: Recruiter manual evaluation and grading for written/coding answers, and comprehensive Redis-cached assessment analytics report.
7. **`7. Payments`**: Stripe and SSLCommerz credit bundle checkout initiation (`STARTER_25`, `PRO_100`, `ENTERPRISE_300`), test checkout, idempotent payment webhook handling, and payment receipt retrieval.
8. **`8. Admin & Audit Logs`**: Admin user directory management, role updates/account deactivation, real-time Redis-cached platform KPI stats, and immutable audit logs.

---

## Quick Setup Instructions

1. **Import Files into Postman**:
   - Open Postman, click **Import** (top left).
   - Select and import `postman/devassess_collection.json`.
   - Select and import `postman/devassess_environment.json`.
2. **Select Active Environment**:
   - In the top-right environment dropdown, select **"DevAssess - Local & Production Environment"**.
3. **Authenticate**:
   - Run **`1. Auth -> Login Recruiter`**: Automatically saves `recruiterToken` and `accessToken` to the environment.
   - Run **`1. Auth -> Login Candidate`**: Automatically saves `candidateToken`.
   - Run **`1. Auth -> Login Admin`**: Automatically saves `adminToken`.
4. **Automatic ID Chaining**:
   - When creating a problem, assessment, invitation, attempt, or payment, Postman test scripts automatically set `problemId`, `assessmentId`, `invitationToken`, `attemptId`, and `paymentId` for seamless sequential testing.
