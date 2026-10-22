# AUDIT STANDARD

Shared rules for P02, P03, P04, P05, and P08. Every audit prompt says
"Follow docs/AUDIT_STANDARD.md". Keep this file in docs/ of every repo.

---

## 1. Before auditing

- Read, if they exist: docs/PROJECT_PLAN.md (especially the Project
  Profile), docs/IDEA_BRIEF.md, docs/DESIGN.md, docs/PROGRESS.md, and the
  most recent reports in docs/audits/.
- If there is no Project Profile, build one from the code (stack, platform,
  backend, services, public/private pages, payments, AI features) and ask me
  to confirm: project type, owner (me or a client), user locations, and data
  sensitivity.
- Set the RIGOR LEVEL from the profile (section 2) and tell me which one you
  are using.
- Inventory the codebase: main features and the files that implement them.
- Mark each audit section APPLIES or N/A, with a one-line reason. Never
  invent findings for sections that don't apply.
- Stack examples in the prompts (Supabase, Vite, Paystack, TanStack Query)
  are examples only. Detect the actual stack and apply the equivalent checks
  (e.g. Firebase Security Rules instead of RLS, Express middleware instead
  of edge functions, Expo instead of a PWA).
- Ask me for what you cannot see: database schema, access policies,
  dashboard settings, usage numbers, screenshots.
- State what you can and cannot review fully. If the codebase is too large
  for one careful pass, propose splitting the audit into sessions by section.
- If I specify SCOPE: [sections], audit only those sections.

## 2. Rigor levels

- LIGHT: learning, portfolio, and personal tools with no sensitive data.
  Report CRITICAL and HIGH findings in full; summarise the rest as a short
  list.
- STANDARD: internal organisation tools and small client projects. Full
  audit.
- STRICT: public products; payments; health or mental health data; children;
  financial or government data; anything with legal exposure. Full audit,
  assume hostile users, and treat SUSPECTED high-impact issues as HIGH until
  disproven.

## 3. Evidence

- Never claim something is fine unless you actually checked it.
- Run commands and paste real output. If you cannot run them, say so and
  give me the exact commands to run.
- Every finding includes:
  - ID (e.g. P04-03), severity, and section
  - Location: file path and line numbers with the code quoted, or the
    setting, policy, or URL
  - What's wrong, and the impact in plain language
  - The minimal COMPLETE fix, and every other place the same pattern appears
  - How I can verify it myself without reading code
  - Confidence: VERIFIED (checked directly) or SUSPECTED (needs confirmation)
- Tag capabilities that don't exist yet as [MISSING].
- No generic best-practice padding. Every item must be about this codebase.

## 4. Severity

- CRITICAL: easy to exploit or certain to happen; causes a data leak, data
  loss, money loss, account takeover, or outage. Fix immediately.
- HIGH: serious harm under realistic conditions. Fix before launch or the
  next release.
- MEDIUM: bugs, poor experience, or costs that grow with users. Fix soon.
- LOW: polish and hardening. Fix when convenient.

## 5. Report

Structure every report as:

1. Context: rigor level, sections audited, sections N/A (with reasons)
2. Top 5 fixes (biggest impact for the effort)
3. Findings table sorted by severity
4. Findings in detail
5. CHECKED AND PASSED, with evidence
6. NOT VERIFIED, with reasons
7. ACTIONS FOR ME: settings to change, dashboards to check, questions for
   the client
8. Comparison with the previous report of the same audit, if one exists:
   fixed, new, regressed
9. CLIENT SUMMARY (client projects only): a half-page, non-technical summary
   of the app's status, main risks, and what is being done, safe to share
   with the client. No jargon, no blame, no secrets, no internal file paths.

Save as docs/audits/[PROMPT-ID]_[YYYY-MM-DD].md
(e.g. docs/audits/P04_2026-09-11.md).

## 6. Fixing

- Do not change any code, settings, or data until I approve specific
  finding IDs.
- Fix approved items through the P07 Safe Change Protocol, highest severity
  first, one at a time.
- After fixes, re-run the relevant checks and update the report with the
  results.
