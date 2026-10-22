# Project Progress: Citizens Elementary School (CES) Web Platform

## Status Summary
- **Current Phase**: P07 (Build Milestones)
- **Active Task**: Post-build remediation (2026-10-22): privacy cleanup done; independent audits P02-P05/P08 re-run (verdict NOT READY, P05 grade F); awaiting owner approval of finding IDs before any fix
- **Rigor Level**: STRICT
- **Working Tree**: Clean. Typecheck 0 errors, Vitest 64/64, `next build` OK, lint warnings only (2026-10-22). Project now lives at `D:devces`.

---

## Completed Milestones (P07)

| Milestone | Date | Status | Summary |
| :--- | :--- | :---: | :--- |
| **Milestone M1: Core Foundation, Design Tokens & Auth** | 2026-09-19 | ✅ COMPLETE | Scaffolded Next.js 14 App Router with strict TypeScript compiler options (`noUnusedLocals: true`), full "Modern Luminary" Tailwind tokens, Supabase SSR client/server wrappers, academic calculation engine with 15/15 passing unit tests, staff `/login` screen, and complete PostgreSQL DDL migration with RLS. |
| **Milestone M2: Student Registration, Auto-Matriculation & Email** | 2026-09-19 | ✅ COMPLETE | Built 28-field mobile-first registration form matching Google Form intake, live passport photo upload to `ces-assets`, auto-matriculation engine (`CES/ILR/YY[Month][NN]`), transactional welcome email with course manual link, and confirmation screen. 22/22 unit tests passing. |
| **Milestone M3: Online Student Assessment Engine** | 2026-09-19 | ✅ COMPLETE | Implemented zero-account student assessment room at `/assess` with Matric + PIN gate, interactive quiz taker with `localStorage` offline auto-saving, server-side auto-scoring strictly protecting answer keys, duplicate attempt prevention, and teacher session/PIN control center at `/admin/quizzes`. 36/36 unit tests passing. |
| **Milestone M4: Class Attendance, Delivery Quality Feedback & Teacher Gradebook Override** | 2026-09-19 | ✅ COMPLETE | Implemented zero-overhead student attendance & 5-star teaching delivery feedback portal at `/attendance`, live audited teacher gradebook roster at `/admin/gradebook` with quick attendance toggles and audited manual score override modal (`is_manual_override = true`, required reason), and teaching delivery feedback analytics at `/admin/attendance`. 47/47 unit tests passing. |
| **Milestone M5: Broadsheet, Graduation Clearance Engine, Excel Export & Certificates** | 2026-09-19 | ✅ COMPLETE | Built executive academic broadsheet at `/admin/broadsheet` with real-time clearance status (`GRADUATE`, `PENDING`, `NOT YET`), honour calculation (Distinction $\ge 85$), official Excel `.xlsx` broadsheet export via SheetJS, in-app certificate preview modal, and dedicated print-ready certificate route at `/certificate/[matricNo]`. 62/62 unit tests passing. |
| **Milestone M6: Hardening, E2E Smoke Tests & Load Testing** | 2026-09-19 | 🟡 IN PROGRESS (CODE COMPLETE) | Implemented security headers (CSP, X-Frame-Options: DENY, Permissions-Policy), public health check endpoint (`/api/health`), 60s duplicate registration throttle, Playwright E2E suite covering 4 core user journeys, 100-user concurrent load test script, and `vercel.json`. Deployment to Vercel paused per user request pending audits. |

---

## Active & Upcoming Milestones (P07)

- [x] **Milestones M1–M5**: 100% Complete & Unit Tested (62/62)
- [x] **Milestone M6 Hardening**: Security headers, health check, abuse prevention, E2E specs, load test runner
- [ ] **Milestone M6 Production Deployment**: Awaiting user audit completion before deploying to Vercel

---

## Post-Audit Changes & Remediation Log

### Fixes made after the original audits (2026-09-19 to 2026-10-xx, from git history)
- Assessment: persist active test session across browser refresh; cohort-mismatch validation and notice; removed flash of login gate on refresh; dropdown latency fix.
- Attendance: class date picker, full curriculum course options, strictly blocked duplicate check-ins with an informative error.
- Registration: submit button disabled until compulsory fields and NDPA consent are complete.
- SEO: OG cards, sitemap/robots, JSON-LD (P08), spiritual-oversight name fix in llms.txt.

### 2026-10-22 - Privacy & repo hygiene (repo is PUBLIC)
- Answer keys, question text and default session PINs removed from source and rewritten out of git history (force-pushed). `curriculum.ts` is now a catalogue only; questions live in `ces_quiz_questions`. New quizzes are created closed with a random server-generated PIN. All 18 live PINs were rotated.
- Client xlsx/docx, duplicate `documents/` folder, admin email and sender address removed from repo and history; `private/` and data-file extensions are gitignored.
- Course manual moved to private bucket `ces-private` and attached to the welcome email; public link removed.
- `/assessment` alias route deleted; replaced by a permanent (308) redirect to `/assess` in `next.config.mjs`; removed from `robots.ts`.
- Project moved from Google Drive to `D:devces`; remote switched to HTTPS; hourly backup task copies it to Drive (`D:dev_toolsackup-ces.ps1`).
- Baseline corrected: unit tests are 64 (not 62).
- Large pages split into `_components/` + a state hook each (no behaviour change): `register` 689 -> 70 lines, `admin/gradebook` 745 -> 53, `admin/broadsheet` 819 -> 52, `assess` 949 -> 99. Shared `src/lib/quiz-columns.ts`. Verified with typecheck, lint, 64 tests, build, byte-level SSR HTML diff of `/register` and `/assess` (only difference: the PIN placeholder `SALV26` -> `AB12CD`), and in-browser behaviour checks of both. Admin pages (gradebook, broadsheet) are behind login and were verified by typecheck/lint/build only; a logged-in click-through is still recommended.

### 2026-10-22 - Independent audit re-run (reports in docs/audits/*_2026-10-22.md)
- **Verdict: NOT READY for launch. P05 grade F** (rule: any open CRITICAL). The re-run executed real checks against the code, build, tests and the live Supabase project; the 2026-09-19 reports are marked SUPERSEDED.
- **P04 Security**: 2 CRITICAL (quiz PINs readable with the public key; anonymous inserts into students/attendance), 5 HIGH, several MEDIUM/LOW. The admin-route protection from the old audit was verified as fixed.
- **P03 Readiness**: HIGH items: matric generation (count + 1: race and breaks after a delete), hardcoded semester id in gradebook, tests (E2E 0/4 pass; load test does not test the requirement), dev and prod share one database holding test data, possible 1,000-row API cap, launch essentials missing.
- **P02 Egress**: HIGH - passport photos stored full-size (859 KB sample shown at 32 px); projections included.
- **P05**: 22 unlabeled form inputs, missing planned features (Student 360, semester management, password reset), no error states on staff screens.
- **P08 SEO**: og:image missing on /register, robots/sitemap contradictions, llms.txt states wrong facts.
- **No fixes have been applied.** Waiting for the owner to approve specific finding IDs; each fix then goes through the P07 protocol.

### 2026-10-22 - Fix: P04-01 and P04-02 (database lockdown) - DONE and verified
- Applied `supabase/migrations/20261022_p04_lockdown_anon_access.sql` (owner ran it in the Supabase SQL editor; scoped to the eight `ces_*` tables because the project is shared with the church's sermons app). Rollback script alongside.
- New regression check `npm run test:rls` (`scripts/verify-rls.mjs`): 17/17 pass (5 failed before). Public key can no longer read PINs or write to students/attendance.
- Verified the app still works end to end (registration, quiz entry and submit, attendance and duplicate block, staff login, gradebook override, broadsheet and certificate preview, quiz PIN manager, attendance analytics). Temporary staff account was created for the test and deleted afterwards.
- Also confirmed live: P03-02 (Sunday attendance toggles write to the Regular semester).
- Next suggested: P03-01/P03-02 (matric race, wrong semester), P04-04 (private passport photos).

### 2026-10-23 - Fixes: P03-01, P03-02, P04-04 - DONE and verified
- **P03-01 matric numbers**: migration `20261023_p03_matric_counter.sql` (+ rollback) adds `ces_matric_counters` and `ces_next_matric_seq(year, month)`. Sequence restarts each month, shared by both cohorts, never reused. Verified live: 20 parallel calls returned 1-20 with no duplicates; anon key cannot call it (42501); a real registration received `CES/ILR/26J1004` after `26J1003`.
- **P03-02 wrong semester**: removed the hardcoded semester id; `overrideStudentAttendanceAction` now reads the semester from the student's own record.
- **P04-04 passport photos**: new uploads go to private bucket `ces-private` under `passports/<uuid>.<ext>`; `passport_url` now stores the storage path. Staff broadsheet gets 1-hour signed URLs (`src/lib/passport-photos.ts`); the public certificate lookup returns no photo. `scripts/migrate-passports.mjs` moved the 2 existing test photos and removed the public copies. Verified: public URL returns 400, signed URL returns 200. Not yet checked in a logged-in browser (broadsheet thumbnail).
- Checks: tsc clean, 64/64 unit tests, production build OK.

### 2026-10-24 - Fixes: P04-03, P04-05, P04-21 - DONE and verified
- **P04-21**: `/certificate/*` and `getCertificateByMatricAction` are staff-only (unauthenticated request redirects to /login).
- **P04-03 class codes**: migration `20261024_p04_class_codes_and_rate_limits.sql` (+ rollback) adds `ces_class_codes`. Teacher panel on `/admin/attendance` opens/closes classes and shows/regenerates codes; `/attendance` requires the code. Verified live: closed class, wrong code and unknown matric all give the same refusal; correct code (any case) records attendance.
- **P04-05 rate limiting**: `ces_rate_limits` + `ces_rate_limit_hit()`; limits on registration (20/h/IP), quiz access (12/10min/matric, 60/10min/IP), quiz submit, attendance (10/10min/matric, 40/10min/IP). Verified: 15 parallel hits at limit 10 gave 10 allowed / 5 blocked; 10 rapid wrong check-ins were throttled after the limit. Quiz access: wrong PIN and unknown matric give one identical message; correct PIN still enters the room. Limiter fails open if the database call errors.
- Not done: Cloudflare Turnstile on /register (needs account keys). `npm run test:rls` covers the new tables. Unit tests: 69.

### 2026-10-24 - Fix: P04-06 dependency upgrades - DONE and verified
- `npm audit --omit=dev`: **5 vulnerabilities (1 critical, 4 high) -> 2 (1 moderate, 1 high)**. Upgraded: next 14.2.35 -> **15.5.28** (patched backport; React stays 18.3.1), nodemailer 6.10.1 -> **10.2.1**, xlsx -> SheetJS **0.20.3** (official tarball, integrity-pinned in the lockfile), supabase-js 2.118, playwright, source-map-js (audit fix).
- Code changes required by Next 15: `cookies()`/`headers()` are async (`supabase/server.ts`, `auth/guard.ts`, `rate-limit.ts`), `/register/success` reads async `searchParams`. Note: without the `await` in `getClientIp` every visitor would have silently shared one rate-limit bucket; verified the stored keys now contain the real IP.
- **Remaining (accepted)**: PostCSS <= 8.5.22 vendored inside Next 15 (XSS/source-map issues in CSS stringify). It only processes this project's own CSS at build time, never visitor input. Clearing it needs Next 16; revisit in a later upgrade. Dev-only: vitest/tinypool advisories (dev machines only).
- Verified on the upgraded stack: tsc, 69 unit tests, lint (2 old hook warnings), production build, `test:rls` 17+/all pass; live: registration with photo (26J1005), staff login, class-code open + student check-in, quiz entry, answer and submit, broadsheet Excel export download; xlsx write/read round trip; nodemailer builds a message with PDF attachment. **Not tested**: real SMTP sending (dev mock in use), Next image optimiser.

### Known issues found during remediation (to be covered by the re-run audits)
- `ces-assets` bucket is public and holds passport photos at guessable paths.
- RLS exposes `session_pin` to anonymous reads of open quizzes; `anon` has GRANT ALL and permissive insert policies on students/attendance.
- Matric sequence uses a global `count + 1` (racy, not per-month, violates atomic-generation rule).
- Gradebook attendance toggle writes to a hardcoded Regular-cohort semester id (`use-gradebook.ts`), so Sunday Cohort toggles hit the wrong semester.
- Old reports in `docs/audits/` (dated 2026-09-19) are marked SUPERSEDED; use the 2026-10-22 reports.

---

## Completed Planning Stages
- **P00: Idea Refinement** (`docs/IDEA_BRIEF.md`, `docs/CLIENT_QUESTIONS.md`)
- **P01: Project Blueprint** (`docs/PROJECT_PLAN.md`, `docs/client/PLAN_SUMMARY.md`, `CLAUDE.md`)
- **P06: Design Direction** (`docs/DESIGN.md` - Modern Luminary)

---

## Audits & Production Quality (P02, P03, P04 & P05)
- **P02: Egress & Efficiency Audit**: Documented in `docs/audits/P02_2026-09-19.md`. 7 optimizations applied (cache headers, image optimization, payload reduction, gzip compression).
- **P03: Production Readiness Audit**: Documented in `docs/audits/P03_2026-09-19.md`. 3 fixes applied:
  1. Attendance composite unique index (`idx_ces_attendance_student_course_semester`) on `(student_id, course_name, semester_id)` for atomic idempotency.
  2. Data privacy & consent notice (Nigeria Data Protection Act - NDPA 2023) on student registration form and validation schema.
  3. Official CES favicon (`favicon.ico`) and vector icon (`icon.svg`) eliminating 404s.
- **P04: Security Audit**: Documented in `docs/audits/P04_2026-09-19.md`. 5 defensive patches applied:
  1. Administrative route guard in middleware (`/admin/*` $\rightarrow$ `/login?redirect=...`).
  2. Server-side staff authorization guard (`requireStaffUser()`) across all administrative Server Actions (`gradebook.ts`, `broadsheet.ts`, `assessment.ts`, `attendance.ts`).
  3. Cryptographic magic bytes file header verification (`validateImageBuffer`) and strict extension mapping on passport photo uploads.
  4. Active Session PIN re-verification in `submitAssessmentAction` preventing out-of-band submissions.
  5. HTML entity sanitization in transactional welcome email templates.
- **P05: Architecture & Product Quality Review**: Documented in `docs/audits/P05_2026-09-19.md`. **Overall Grade: A (Exemplary Production & Product Quality)**. 100% requirements traceability across all user stories (US-01 to US-06), zero `any` types, 62/62 unit tests passing, client acceptance readiness certified.
- **P08: SEO & Discoverability Audit**: Documented in `docs/audits/P08_2026-09-19.md`. 6 fixes applied:
  1. Branded Open Graph & Twitter Card social preview card (`public/og-image.png`, 1200x630, 33.6 kB) optimized for WhatsApp, X, Facebook, and LinkedIn.
  2. Native Next.js App Router dynamic generators for `/robots.txt` (`src/app/robots.ts`) and `/sitemap.xml` (`src/app/sitemap.ts`).
  3. Schema.org JSON-LD structured data (`EducationalOrganization` and `Course`) embedded directly in server-rendered root layout.
  4. Server-rendered route layouts across public routes (`/register`, `/assess`, `/attendance`) providing distinct canonical URLs and title templates.
  5. Search engine indexing exclusion (`robots: { index: false, follow: false }`) applied to all administrative (`/admin/*`), authentication (`/login`), student success, and certificate verification routes.
  6. Machine-readable AI directory (`public/llms.txt`) summarizing institution profile, cohort tracks, 8-course curriculum, and graduation criteria for LLM search crawlers.

---

## Known Issues & Follow-ups
- Credentials for live Supabase project configured in `.env.local` with isolated `ces_*` table namespace.
- Storage bucket `ces-assets` created and active for photo and document uploads.
- **Fixed (2026-09-19)**: Form submission database error (PostgreSQL error `42501` and FK `23503`) resolved by granting schema/table privileges to `anon`, `authenticated`, and `service_role`, seeding default active cohorts (`Regular Cohort — 2026`, `Sunday Cohort — 2026`), and introducing `createAdminClient()` in `src/lib/supabase/admin.ts` for atomic server-side registration operations. All tests (62/62) passing and Next.js build clean.

