# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Citizens Elementary School (CES) Web Platform

## Project Overview
- **Name**: Citizens Elementary School (CES) Discipleship Training Portal
- **Owner**: Citizens of Light Church / Citizens Elementary School, Ilorin, Nigeria
- **Target URL**: `ces.citizensoflightchurch.org`
- **Rigor Level**: **STRICT** (Full automated unit tests, Playwright E2E suites, 100-user concurrent load test, strict type checking)

## Tech Stack
- **Framework**: Next.js 14 (App Router, TypeScript; `@/*` → `src/*`)
- **Styling**: Tailwind CSS + custom tokens (distinct Sunday Cohort visual styling)
- **Database & Auth**: Supabase (Shared project, isolated namespace `ces_*`, `ces-assets` storage bucket, Row Level Security)
- **Email**: Nodemailer (Gmail App Password) or Brevo API
- **Reporting & Export**: SheetJS (`xlsx`) for Excel reports; HTML/Canvas/SVG for Certificate generation
- **Testing**: Vitest (Unit tests), Playwright (E2E smoke tests), a Node script `load-test/load-test.mjs` (100 concurrent virtual users; no k6 installed)

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

## Standard Commands
- `npm run dev`: Start local development server on port 3000
- `npm run build`: Production build with strict TypeScript and ESLint checks
- `npm run test`: Run Vitest unit tests (`vitest run`, files in `src/**/__tests__/`)
- `npx vitest run src/lib/__tests__/academic.test.ts`: Run a single test file (add `-t "name"` for one case); `npm run test:watch` for watch mode
- `npm run test:e2e`: Playwright journeys in `e2e/` (single worker, Chromium, expects the app on `http://localhost:3000` — start `npm run dev` first); single spec: `npx playwright test e2e/journey2-quiz.spec.ts`
- `npm run test:load`: 100-user load test; target via arg or `LOAD_TEST_TARGET`, tune with `CONCURRENCY` / `DURATION` env vars
- `npm run lint`: Run ESLint checks
- Env: copy `.env.example` to `.env.local` (Supabase URL/anon/service-role keys, SMTP settings, `NEXT_PUBLIC_APP_URL`)

## Architecture Notes
- **Route map** (`src/app/`): public `/register` (+`/success`), `/assess` (student quiz; `/assessment` just redirects to it), `/attendance`, `/certificate/[matricNo]`; staff-only `/admin/{attendance,broadsheet,gradebook,quizzes}` behind `/login`; `/api/health`.
- **Auth is two-layered**: `src/middleware.ts` → `lib/supabase/middleware.ts#updateSession` redirects unauthenticated `/admin/*` to `/login?redirect=...`; every admin Server Action must additionally call `requireStaffUser(roles?)` from `lib/auth/guard.ts` (checks `ces_staff_profiles`; roles `super_admin | ces_admin | ces_teacher`). Never rely on middleware alone.
- **Supabase clients** (`src/lib/supabase/`): `client.ts` (browser, anon), `server.ts` (cookie-bound SSR), `admin.ts` (service role, bypasses RLS — server-only; used for registration, scoring, staff lookup).
- **Data flow**: pages call Server Actions in `src/actions/` (`register`, `assessment`, `attendance`, `gradebook`, `broadsheet`); inputs validated by Zod schemas in `src/lib/validation/`; scoring/status/honours/matric logic lives only in `src/lib/academic.ts`; `src/lib/curriculum.ts` is the public 9-item catalogue (8 quizzes + final exam: code/title/max score only — no questions, answers or PINs); `excel.ts` (SheetJS), `certificate.ts`, `email.ts` are server helpers. DB row types are in `src/types/`.
- **Database**: tables `ces_staff_profiles, ces_semesters, ces_students, ces_quizzes, ces_quiz_questions, ces_student_assessments, ces_attendance_records, ces_certificates`. Schema is in `supabase/migrations/` (each destructive migration has a `rollback` counterpart; attendance has a composite unique index on `(student_id, course_name, semester_id)`). Migrations are applied manually to the shared Supabase project, so follow the Database Safety rule below.
- **Progress log**: `docs/PROGRESS.md` (update each task) and `docs/audits/` hold the history of audits P02–P08; design direction is in `docs/DESIGN.md`.

## Public Repo — Never Commit Private Material
The GitHub repo is intentionally PUBLIC. Never commit: question text/answer keys, session PINs, client files (xlsx/docx), real emails/phones, the course manual, or secrets. Keep them in gitignored `private/` (local only) or in the database/private storage. Questions + PINs live in `ces_quiz_questions`/`ces_quizzes`; new quizzes are created closed with a random server-generated PIN. The course manual is in the private bucket `ces-private` (`manuals/course-manual.pdf`) and is attached to the welcome email — never served from `public/`. Project lives at `D:devces`; an hourly task backs it up to Drive.

## Environments
- `.env.local` = development/staging Supabase project (the old project shared with the sermons app). Tests and load tests run against this one.
- `private/env/production.env` (gitignored) = the dedicated CES production project. Scripts take `--env private/env/production.env`; never put production keys in `.env.local`. Next.js reads only `.env.local` locally, so `npm run dev/start` always uses the dev project.
- New project set-up: `npm run db:fresh-install` writes `supabase/fresh-install/ces_fresh_install.sql` (all migrations, minus the old blanket grants); run it once in the new project's SQL editor, then `node scripts/setup-project.mjs --env private/env/production.env`, create the admin in the dashboard, then `node scripts/make-staff.mjs`.

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
