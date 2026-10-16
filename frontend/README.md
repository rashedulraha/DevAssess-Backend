# DevAssess Frontend — Next.js 16 Apple-Inspired Dashboard

An enterprise-grade, Apple-inspired Developer Assessment and Remote Proctoring dashboard built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Lucide Icons**.

---

## 🎨 Design System & Aesthetics (Apple-Inspired)

- **Obsidian Dark Surface**: Primary background `#090a0f` paired with frosted obsidian cards (`rgba(23, 26, 38, 0.55)`).
- **Precision Micro-Borders**: Ultra-delicate 1px low-opacity borders (`border-white/[0.08]` and `rgba(255, 255, 255, 0.07)`) providing hardware-like contrast.
- **Glassmorphism**: Multi-layer backdrop filters (`backdrop-blur-2xl` and `saturate(180%)`) with subtle cyan/indigo ambient light cones.
- **Segmented Control Pill Navigation**: VisionOS/macOS style sliding segmented pills for effortless switching between Recruiter Studio, Candidate Arena, and Admin Telemetry.
- **SF Pro Typography**: Tailored font stack with `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, system-ui`.

---

## 🌟 Interactive Suites & Features

### 1. 🏢 Recruiter Studio
- **Organization Credit Top-Up**: Interactive bundle pricing cards (`Starter $15`, `Pro $49`, `Enterprise $129`) with direct Stripe Checkout session launch and instant demo checkout fallback.
- **Problem Bank Authoring**: Modal for authoring multi-format questions (`CODING`, `MCQ`, `WRITTEN`) with starter code templates, points, tags, and automated test cases.
- **Assessment Assembly**: Real-time selection and ordering of bank questions, duration timers, pass percentage thresholds, and max tab-switch tolerance.
- **Candidate Invitations**: Deducts 1 credit inside a transaction, generates timed secure tokens, and dispatches invites.
- **Redis-Cached Performance Report**: Live analytics dashboard displaying total invites, pass rates, average scores, and candidate leaderboard with proctoring violations.

### 2. ⚡ Candidate Coding Arena
- **Proctoring Telemetry Watchdog**: Automatic detection of `visibilitychange` (tab switching) and `window.blur` with sticky visual alerts and immediate backend telemetry logging.
- **Session Countdown Timer**: Synchronized timer matching backend expiration windows.
- **LeetCode-Style Split View**: Left pane problem description and sanitized public assertions; right pane JavaScript sandbox code runner.
- **Instant Node.js VM Evaluation**: Direct code evaluation against test cases with live pass/fail badges and score calculation.
- **Finalized Grade Summary**: Celebration modal presenting final points and pass/fail thresholds.

### 3. 🛡️ Admin Telemetry
- **Live Platform KPIs**: Total registered users, completed Stripe revenue (USD), active assessments, and completed attempts.
- **Immutable Audit Trail**: Real-time audit log stream showing action types, affected entities, actor IDs, and timestamps.

### 4. 🔑 Quick Demo Login & Custom Auth
- **One-Click Quick Login**: Instant authentication as Recruiter, Candidate, or Admin.
- **Full Auth Modal**: Standard email/password login and registration with company assignment.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or verify `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://devassess-alpha.vercel.app/api/v1
# Or for local development:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```
