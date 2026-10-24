# Launch checklist: CES Discipleship Portal

Work top to bottom. Tick each box only after you have seen it work. "Owner" = you (Sogo / the school). "Claude" = something I can do in this repo when asked.
Rule: nothing is changed in production without a backup first (section 2) and an explicit go-ahead.

## 1. Production database (owner)
- [ ] Production project exists and `private/env/production.env` holds its URL and keys (never in `.env.local`).
- [ ] Fresh-install SQL has been run in the production SQL editor (`npm run db:fresh-install`, then `node scripts/setup-project.mjs --env private/env/production.env`).
- [ ] Attendance unique index present. Run in the SQL editor; expect one row:
  `SELECT indexname FROM pg_indexes WHERE tablename='ces_attendance_records' AND indexname='idx_ces_attendance_student_course_semester';`
  If empty, run `supabase/migrations/20261028_p04_attendance_unique_index.sql` (step 1 must return no rows first).
- [ ] Row-level security check passes: `node scripts/verify-rls.mjs --env private/env/production.env`.
- [ ] Staff accounts created (Authentication > Users), then given roles with `node scripts/make-staff.mjs --env private/env/production.env <email> <super_admin|ces_admin|ces_teacher> "Name"`. At least two admins, so one person's absence cannot lock the school out.
- [ ] No test data left: students, semesters and staff named `e2e-...` do not exist in production.

## 2. Backups (owner)
- [ ] First production backup taken: `npm run db:backup -- --env private/env/production.env --with-files`, then `--verify` on the folder, copied to an encrypted drive.
- [ ] Restore rehearsed once into a scratch project (see `docs/BACKUP.md`); date noted there.
- [ ] Weekly backup reminder set for the person responsible.

## 3. Content (owner)
- [ ] Real course manual uploaded to the private bucket `ces-private` at `manuals/course-manual.pdf` (production).
- [ ] Fresh final-exam and quiz questions loaded, replacing placeholders; question text and answer keys exist only in the database.
- [ ] Semester created in Admin > Semesters for each cohort (Regular, Sunday) and set active. Registration is closed until a semester exists.
- [ ] Quiz PINs and class codes are opened by teachers only on class day.

## 4. Email (owner)
- [ ] Real sender account configured in hosting settings: `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`.
- [ ] Sending domain has SPF and DKIM records so mail does not land in spam.
- [ ] A real registration made with your own address: welcome email arrives with the manual attached, and Student Lookup shows email status "sent". Resend works.

## 5. Hosting (owner)
- [ ] Vercel project connected to the repo; production environment variables set: the three Supabase values, the email values, `NEXT_PUBLIC_APP_URL` (the real https address) and `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL`.
- [ ] Region matches the database (`vercel.json` uses `fra1`; confirm the Supabase project is in the same region, or change one of them).
- [ ] Domain `ces.citizensoflightchurch.org` points at Vercel; HTTPS works; `http://` redirects.
- [ ] `/api/health` returns `{"status":"ok","database":"ok"}` on the live address.
- [ ] Uptime monitor watching `/api/health` every 5 minutes, alerting by email (see `docs/BACKUP.md`).

## 6. Abuse protection (owner + Claude)
- [ ] Cloudflare Turnstile (or similar) added to public registration before the address is shared widely. Claude can wire it in once you have the site key and secret.
- [ ] Rate limits left on (they fail open if the limiter breaks, so watch the logs in the first week).

## 7. Privacy (owner)
- [ ] `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` set and `/privacy` shows the address.
- [ ] Someone has read `/privacy` and agrees with it, including the 5-year retention.
- [ ] A named person owns data requests (`docs/DATA-REQUESTS.md`) and knows the 30-day deadline.
- [ ] The church has considered registering with the Nigeria Data Protection Commission and appointing a data protection contact; take legal advice if unsure. This repository's text is not legal advice.

## 8. Final checks on the live site (owner, with Claude on request)
- [ ] Run the load test against the deployed address (not localhost): `LOAD_TEST_TARGET=https://<site> npm run test:load`. Check no errors and acceptable response times.
- [ ] GitHub secrets `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY`, `STAGING_SUPABASE_SERVICE_ROLE_KEY` added so the browser tests run in CI.
- [ ] Full dry run with a few real people: register (phone and laptop), take a quiz with a PIN, check attendance, teacher enters a score, admin imports an Excel file, issues and prints a certificate, then deletes the dry-run students.
- [ ] Staging test data reset (old test students, scores, audit rows are append-only and may remain; that is fine).

## 9. Launch day and first week
- [ ] Production backup immediately before opening registration.
- [ ] Open the semester, announce the link.
- [ ] Watch `/api/health`, the Vercel logs and the Supabase dashboard for the first day.
- [ ] After the first class: spot-check attendance and scores against a paper list.
- [ ] End of week 1: backup, then review any errors and the audit log.

## Known limits (accepted for launch)
- The database does not enforce one active semester per cohort; the admin screen does.
- Semester changes are not audit-logged.
- Export of one student's data and anonymisation are manual (documented).
- Real email delivery is untested until section 4 is done.
- Optional later work: hide Export and Batch buttons for teachers, nonce-based CSP, remaining medium and low audit items.
