# IDEA BRIEF: Citizens Elementary School (CES) Web Platform

## Metadata
- **Mode**: MODE C — CLIENT PRD
- **Project Type**: Internal Organisation Tool / Client Project
- **Working Name**: CES Portal (Citizens Elementary School Discipleship Training Portal)
- **Target Subdomain**: `ces.citizensoflightchurch.org`
- **Client / Owner**: Citizens of Light Church / Citizens Elementary School (CES), Ilorin
- **Current Stage**: P00 — Idea Refinement (Complete) → Transitioning to P01

---

## 1. Executive Summary & Problem vs Solution

### One-Sentence Summary
An integrated academic and assessment management platform for Citizens Elementary School that handles student intake, automated matriculation, online student quizzes/exams, attendance with delivery feedback, graduation clearance, and automated certificate generation.

### The Problem
CES administrators, instructors, and students currently deal with fragmented, error-prone spreadsheets and manual procedures:
- **Fragile Data Chains**: Cross-referencing 28+ student profile fields with quiz scores across 8 subjects, final exams, and attendance via fragile spreadsheet formulas (`VLOOKUP`, `INDEX/MATCH`) frequently breaks or desynchronizes.
- **Manual Grade Entry & Collation**: Teachers collect and grade assessments manually, then hand-type scores into spreadsheets.
- **Onboarding Friction**: Admitted students must be manually sent materials and assigned matriculation numbers.
- **Audit & Certification Bottlenecks**: Determining who has met all graduation criteria (score $\ge 50$ + both attendance classes cleared) and producing graduation lists/certificates requires exhaustive manual auditing.

### The Proposed Solution
A role-governed web application (Super Admin, CES Admin, CES Teacher, Student Assessment Mode) that:
1. Auto-generates matriculation numbers on registration and immediately emails students their admission confirmation, instructions, and training manual.
2. Provides an online student assessment interface where students take quizzes (8 courses, max 5 each) and the final exam (max 60), with scores automatically calculated, validated, and recorded directly to their profile.
3. Logs attendance at class conclusion with student feedback on delivery quality.
4. Automatically calculates graduation status (`GRADUATE`, `NOT YET`, `PENDING`) and honours (`Distinction` $\ge 85$, `Merit` $\ge 75$, `Pass` $\ge 50$, `Below Pass` $< 50$).
5. Provides an instant 360° student lookup with an outstanding items checklist and an automated certificate generation pipeline.

---

## 2. Current Alternatives & Why They Fall Short

| Alternative | What It Does Well | Where It Falls Short |
| :--- | :--- | :--- |
| **Existing Multi-Sheet Excel (`TEST DATA`)** | Zero hosting cost; established formulas for totals and status. | No true concurrency; manual grade entry; fragile VLOOKUPs; zero role security; cannot administer online quizzes to students. |
| **Google Forms + Google Sheets** | Free, familiar registration and basic quiz forms. | Cannot auto-generate matric numbers during intake; cannot enforce custom graduation logic; disconnected from student profiles; cannot gate certificates automatically. |
| **Commercial School Portals (Edves, OpenSIS)** | Full student records, transcripts, report cards. | Built for conventional K-12/universities with terms/subjects, not discipleship modules (8 quizzes × 5 marks, attendance-only graduation gating, Sunday cohort model). High ongoing subscription fees. |

---

## 3. Value Proposition
> **For** Citizens Elementary School administrators, teachers, and students, **CES Portal** is an end-to-end discipleship school portal that automates student onboarding, delivers online quizzes/exams with instant grade recording, tracks attendance and feedback, and automatically validates graduation and issues certificates, **unlike** manual spreadsheets that require tedious cross-referencing and risk calculation errors.

---

## 4. Users, Roles & Context

### User Personas & Permissions
1. **Super Administrator**: Complete oversight of all semesters, KPIs, enrollment trends, pass/fail analytics, cohort distribution, and system logs.
2. **CES Admin**: Manages semester configurations, student admissions, profile record editing/deletion, attendance records, and graduation certification.
3. **CES Teacher**: Manages quiz and exam questions/templates, monitors student performance, reviews score distributions, and assists in attendance tracking.
4. **Student (Assessment Mode)**: Students do **not** have access to the administrative backend or a general results dashboard. Their interaction is strictly focused:
   - Completing registration.
   - Taking the 8 modular quizzes and the final exam online.
   - Submitting post-class delivery feedback.

### Operating Context
- **Devices**: Desktop/laptop for administrators and teachers; mobile phones, tablets, or laptops for students taking quizzes and registering.
- **Connectivity**: Ilorin, Nigeria. Bandwidth-conscious design, low data overhead, and auto-saving during online assessments to prevent data loss during network drops.
- **Language**: English.

---

## 5. Comprehensive Requirements Extract

| REQ ID | Requirement | Label | Resolution / Technical Notes |
| :--- | :--- | :--- | :--- |
| **REQ-01** | Multi-user role-based access control (Super Admin, CES Admin, CES Teacher, Student Assessment Mode). | **CLEAR** | Enforced via route-level authorization guards. |
| **REQ-02** | Executive dashboard with KPIs per semester (enrollment, active, graduated, deferred, Sunday cohort count, pass rates). | **CLEAR** | Real-time aggregation matching the `📊 Dashboard` model. |
| **REQ-03** | Management of student admission and attendance logs across all classes. | **CLEAR** | CES Admin responsibility. |
| **REQ-04** | Direct web entry / online student assessment for quiz and exam grading. | **CLEAR** | Scores automatically compute upon quiz/exam submission and tie to the student profile. |
| **REQ-05** | Student interaction boundary. | **CLEAR** | Confirmed by client: Students do not view administrative results; interaction is restricted to taking quizzes, exams, and providing class feedback. |
| **REQ-06** | Student registration form matching Google Form structure (21 intake fields + 7 admin fields) plus passport photo upload. | **CLEAR** | Includes photo upload, image optimization, and storage. |
| **REQ-07** | Automatic matriculation number generation: `CES/ILR/YY[MonthAlphabet][MonthDigit][NN]` (e.g., `CES/ILR/26H801`). | **CLEAR** | Confirmed formula: Year (`26`), Month Alphabet (`H` for August), Month Digit (`8`), Sequential Count (`01` upwards). Generated on registration. |
| **REQ-08** | Automatic admission email with instructions and class manual upon successful registration. | **CLEAR** | Transactional email integration (SMTP / API) triggered on student creation. |
| **REQ-09** | Unlimited semester management (Name, Type: Regular/Sunday Cohort, Start Date, End Date, Year, Active flag, Notes). | **CLEAR** | Relational configuration table. |
| **REQ-10** | Visual distinction/highlighting for Sunday Cohorts throughout the system. | **CLEAR** | Distinct visual badges, indicators, and filtering across all views. |
| **REQ-11** | Searchable, filterable student table (filter by semester and status; real-time full-text search by name or matric). | **CLEAR** | Core student management view. |
| **REQ-12** | Student CRUD operations: create via form, edit any record, delete with confirmation. | **CLEAR** | Standard database operations with audit safety. |
| **REQ-13** | 8 Quiz courses with strict score limits (0–5 marks each, total 40 marks; scores > 5 blocked). | **CLEAR** | Courses: Salvation, Righteousness, Word of God, Love Walk, Service, Spiritual Authority, Holy Spirit, Prayer. |
| **REQ-14** | Final exam with strict score limit (0–60 marks; pass mark $\ge 30$). | **CLEAR** | Online exam module or teacher entry. |
| **REQ-15** | Two mandatory attendance courses (*Elementary Principles*, *Membership & Vision Class*); values: `Attended`, `Not Attended`, `Excused`. | **CLEAR** | Both must be `Attended` for graduation clearance. |
| **REQ-16** | Class attendance capture at end of class with student feedback on delivery quality. | **CLEAR** | Logs attendance plus rating/comments on teaching delivery. |
| **REQ-17** | Automated graduation status: `✅ GRADUATE` (Total $\ge 50$ AND both attended), `❌ NOT YET` (complete data, failed criteria), `⏳ PENDING` (missing data). | **CLEAR** | Strictly computed, zero manual override. |
| **REQ-18** | Automated honour classification: Distinction ($\ge 85$), Merit ($\ge 75$), Pass ($\ge 50$), Below Pass ($< 50$). | **CLEAR** | Confirmed: Cut-off for Distinction is **85 marks**. |
| **REQ-19** | Graduation results table with Quiz Total, Exam Score, Cumulative Total, Attendance Status, Graduation Status, Honour Class. | **CLEAR** | Auto-derived calculation table. |
| **REQ-20** | Exportable student score report in Excel format. | **CLEAR** | Generates `.xlsx` file showing student scores, attendance, and graduation status. |
| **REQ-21** | Automated certificate generation module. | **CLEAR / HIDDEN COMPLEXITY** | System ingests/reads the student graduation data and generates printable/downloadable completion certificates. |
| **REQ-22** | Student Lookup: simultaneous search by matric number, first name, or surname; displays 360° profile, 8 quiz scores, exam score, attendance, and outstanding items checklist. | **CLEAR** | Quick diagnostic view for church administrators. |
| **REQ-23** | Disambiguation list with clickable links when multiple students share a searched name. | **CLEAR** | Collision handling. |
| **REQ-24** | Quick-action navigation links from lookup directly to Edit Student, Quiz Entry, and Exam Entry. | **CLEAR** | Admin workflow accelerator. |

---

## 6. Assumptions & Fact Tracking

| # | Statement / Finding | Status | Confirmation Source / Validation Method |
| :--- | :--- | :--- | :--- |
| **A-01** | Distinction threshold is 85, not 90. | **FACT** | Confirmed by client: *"The score threshold is 85. It was formerly 90 but we changed it to 85 considering the general performance."* |
| **A-02** | Students do not have a full dashboard login; interaction is restricted to taking quizzes/exams and feedback. | **FACT** | Confirmed by client: *"Students will not be able to view their result. The only interaction students should have is specifically for taking quiz and exams..."* |
| **A-03** | Matric format: `CES/ILR/YY(MonthAlphabet)MonthCharacter(Sequence)`. | **FACT** | Confirmed by client: `CES/ILR/26H801` for August 2026 student 1. |
| **A-04** | Email with manual/instructions must be dispatched on registration. | **FACT** | Confirmed by client: Requires transactional email integration with attachment/link. |
| **A-05** | Domain is `ces.citizensoflightchurch.org`. | **FACT** | Confirmed by client. DNS configuration to point to app host. |
| **A-06** | Automated certificate generation is required. | **FACT** | Confirmed by client: Can read from the verified results table/export. |
| **A-07** | High-stakes quiz taking on mobile devices requires offline answer resilience. | **ASSUMPTION** | Standard best practice for Nigerian network conditions. Local state caching recommended. |

---

## 7. Version 1 Core Scope Boundary

### Core Job of Version 1
Deliver a secure, end-to-end academic portal on `ces.citizensoflightchurch.org` that automates student registration and welcome emails, administers 8 course quizzes and the final exam online, logs class attendance and feedback, enforces strict graduation rules, and outputs verified graduation lists and certificates.

### Must-Have for Launch (v1)
- Role-based staff authentication (Super Admin, CES Admin, CES Teacher).
- Semester setup with distinct Sunday Cohort visual indicators.
- Student registration form (28 fields + passport photo upload) with immediate matriculation number generation.
- Automated welcome email dispatch (instructions + course manual).
- Student Assessment interface: taking the 8 quizzes (5 marks max each) and the final exam (60 marks max) with automatic grade recording.
- Class attendance recording with delivery quality feedback.
- Automated Graduation Clearance & Honour Classification engine (Distinction $\ge 85$, Merit $\ge 75$, Pass $\ge 50$, Below Pass $< 50$).
- 360° Student Lookup with live Outstanding Items checklist.
- Excel score report export.
- Automated certificate generation for cleared graduates.

### Deferred / Phase 2 Scope
- Student self-service profile portal (checking cumulative grade histories across multiple years).
- Bulk SMS / WhatsApp broadcast integration (adds recurring provider fees).
- Online payment gateway integration (if paid tuition is introduced in the future).

---

## 8. Constraints, Dependencies & Risks

1. **Email Deliverability**: Automated registration emails containing course manuals must have high deliverability. Providing a cloud download link (e.g. hosted PDF) rather than a heavy file attachment prevents bounce-backs and keeps email provider costs near zero.
2. **Concurrent Exam Taking**: When 50–100 students take an online quiz simultaneously at the end of a session, server response times must remain swift with zero data loss.
3. **Data Protection (NDPA 2023)**: Student demographic, contact, and spiritual data must be protected. The student assessment entry page must be accessed via a secure token or matric number lookup that does not expose other students' personal records.

---

## 9. Verdict & Handoff to P01

### Verdict: **READY TO PLAN**
All fundamental ambiguities regarding role boundaries, scoring cutoffs, matriculation formatting, assessment entry methods, and domain configuration have been resolved with authoritative client decisions.

### Kill or Pivot Signals (During Build / Post-Launch)
- **Pivot Signal**: If creating and configuring individual quiz questions inside the app proves too labor-intensive for teachers prior to semester launch, pivot to a hybrid model: allow direct teacher score entry as a fallback alongside online student quiz taking.
- **Kill Signal**: Inability of the organization to maintain cloud hosting or transactional email DNS configuration on `citizensoflightchurch.org`.

### Open Inputs for P01 (Project Planning)
1. Technical architecture & stack selection (e.g. Next.js / Vite + React + Supabase / PostgreSQL).
2. Database schema design encompassing Semesters, Students, Quizzes, Questions/Submissions, Attendance/Feedback, and Certificates.
3. Transactional email service setup (Resend, SendGrid, or Brevo) for `ces.citizensoflightchurch.org`.
4. Certificate template design and generation pipeline (HTML-to-PDF / Canvas / SVG).
