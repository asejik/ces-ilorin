# CLAUDE.md — Citizens Elementary School (CES) Web Platform

## Project Overview
- **Name**: Citizens Elementary School (CES) Discipleship Training Portal
- **Owner**: Citizens of Light Church / Citizens Elementary School, Ilorin, Nigeria
- **Target URL**: `ces.citizensoflightchurch.org`
- **Rigor Level**: **STRICT** (Full automated unit tests, Playwright E2E suites, 100-user concurrent load test, strict type checking)

## Tech Stack
- **Framework**: Next.js 14/15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + custom tokens (distinct Sunday Cohort visual styling)
- **Database & Auth**: Supabase (Shared project, isolated namespace `ces_*`, `ces-assets` storage bucket, Row Level Security)
- **Email**: Nodemailer (Gmail App Password) or Brevo API
- **Reporting & Export**: SheetJS (`xlsx`) for Excel reports; HTML/Canvas/SVG for Certificate generation
- **Testing**: Vitest (Unit tests), Playwright (E2E smoke tests), k6 (Concurrent load testing)

## Core Architectural Rules
1. **Never Leak Secrets**:
   - `SUPABASE_SERVICE_ROLE_KEY`, email SMTP passwords, and assessment answer keys (`correct_option_index`) must NEVER reach the browser bundle.
   - All assessment scoring, matriculation generation, and email dispatching must execute strictly in Server Actions or Route Handlers.
2. **Deterministic Academic Engine**:
   - Total score = Quiz Total (8 courses $\times$ max 5 = 40) + Final Exam (max 60) = 100 max.
   - Quizzes strictly validate scores $0 \le \text{score} \le 5$.
   - Final Exam strictly validates scores $0 \le \text{score} \le 60$.
   - Graduation Status:
     - `✅ GRADUATE` $\iff$ Total $\ge 50$ AND Elementary Principles = `Attended` AND Membership & Vision = `Attended`.
     - `❌ NOT YET` $\iff$ Data complete but criteria not met.
     - `⏳ PENDING` $\iff$ Any quiz score, exam score, or attendance field is missing.
   - Honour Classification:
     - Distinction: Total $\ge 85$
     - Merit: Total $\ge 75$ and $< 85$
     - Pass: Total $\ge 50$ and $< 75$
     - Below Pass: Total $< 50$
3. **Matriculation Generation Rule**:
   - Format: `CES/ILR/YY[MonthAlphabet][MonthDigit][Sequence]` (e.g. `CES/ILR/26H801` for August 2026, 1st student).
   - Generated atomically at the moment of registration.
4. **Assessment Access Security**:
   - Students take quizzes via **Matric Number + Teacher Session PIN**.
   - Questions delivered to student clients must have answer keys stripped.
   - Duplicate submissions are blocked by database unique constraints.
5. **Sunday Cohort Visual Distinction**:
   - Sunday Cohort semesters and students must have distinct visual badges/color schemes across all tables, lists, and dashboards.

## Standard Commands (Once Scaffolded)
- `npm run dev`: Start local development server on port 3000
- `npm run build`: Production build with strict TypeScript and ESLint checks
- `npm run test`: Run Vitest unit tests (scoring, matric generation, graduation clearance)
- `npm run test:e2e`: Run Playwright end-to-end user journey tests
- `npm run lint`: Run ESLint checks

## Code Conventions
- Use TypeScript strictly; `any` is forbidden.
- Use Zod schemas for all form validations and API payloads.
- Wrap database operations in try/catch and return standardized `{ success: boolean, data?: T, error?: string }` responses.
- Server Actions should reside in `src/actions/`.
- Business logic calculations (scores, honours, status) must be isolated in pure functions in `src/lib/academic.ts` for unit testing.

## P07-A: Safe Change Protocol Permanent Rules
1. **Strict Compiler Options**: In `tsconfig.json` under `compilerOptions`: `"noUnusedLocals": true` and `"noUnusedParameters": true` so unused code fails type checking automatically.
2. **Commit Checkpoints**: Always verify a clean working tree or commit a checkpoint before executing build tasks.
3. **Database Safety**: Never execute destructive migrations or direct write commands against production databases without approval and rollback scripts.
4. **Follow Phases in Order**: Every task follows Phase 1 (Plan & Stop for approval), Phase 2 (Implement), Phase 3 (Verify with real tool outputs), and Phase 4 (Report & update `docs/PROGRESS.md`).
