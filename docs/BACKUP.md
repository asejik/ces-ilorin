# Backups and health check

## Health check
`GET /api/health` reads one row from the database. `200 {status:"ok", database:"ok"}` means the portal can reach its data; `503 {status:"degraded", database:"unreachable"}` means it cannot (details are only in the server log).
Point an uptime monitor (for example UptimeRobot, free) at `https://<your-site>/api/health`, check every 5 minutes, alert by email on anything other than 200.

## Backup script
```
npm run db:backup -- --with-files                                   # staging
npm run db:backup -- --env private/env/production.env --with-files  # production
npm run db:backup -- --verify private/backups/<folder>              # re-check a finished backup
```
- Writes every CES table as JSON (plus passport photos and the course manual with `--with-files`) to `private/backups/<project>_<time>/` with a `manifest.json` of row counts and SHA-256 hashes.
- It compares what it read with the table's real row count, and exits with an error (and says INCOMPLETE) if anything is missing.
- **The folder holds personal data and quiz answer keys.** It is git-ignored. Copy it to an encrypted drive; never email it or commit it.

## Routine
- Production: run weekly during a cohort, and always before any migration, bulk import or deletion. Keep the last 4 weekly backups.
- Supabase's own daily backups (Pro plan) are a second layer, not a replacement.
- **Test a restore once** before launch: create a scratch Supabase project, run the fresh-install SQL, then load the JSON tables in the order listed in `scripts/backup.mjs` (parents before children). Record the date here when done.

## Restoring (outline)
1. New or emptied project with the schema (`npm run db:fresh-install`).
2. Insert the JSON rows table by table in the script's order: staff profiles, semesters, students, quizzes, quiz questions, assessments, attendance, certificates, audit log, class codes, matric counters.
3. Upload the files from `files/` back into the `ces-private` bucket under the same paths.
4. Run `node scripts/verify-rls.mjs` and a test login.
