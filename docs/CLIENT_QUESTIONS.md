# Client Questions & Decisions: Citizens Elementary School (CES) Web Platform

This document tracks all design and operational clarifications agreed with Citizens Elementary School leadership.

---

## Part 1: Initial Questions — All Resolved ✅

### 1. Distinction Honour Cut-Off Score
- **Client Answer**: **85 marks**.
- **Context**: Formerly 90, but officially adjusted to 85 considering general cohort performance.
- **Status**: **RESOLVED** — System will enforce:
  - Distinction: $\ge 85$
  - Merit: $\ge 75$ and $< 85$
  - Pass: $\ge 50$ and $< 75$
  - Below Pass: $< 50$

---

### 2. User Roles & Student Interaction Boundary
- **Client Answer**: Students will **not** have access to view their cumulative results or the administrative portal. Their interaction is strictly focused:
  1. Taking course quizzes and the final exam online.
  2. Providing post-class delivery feedback during attendance capture.
- **Context**: The portal remains an internal administrative tool for church leadership, administrators, and teachers, with dedicated student-facing assessment routes.
- **Status**: **RESOLVED**.

---

### 3. Matriculation Number Generation Rule
- **Client Answer**: Standardized pattern: `CES/ILR/YY(MonthAlphabet)MonthCharacter(Sequence)`
- **Example**: `CES/ILR/26H801`
  - `CES/ILR/`: Citizens Elementary School, Ilorin.
  - `26`: Year 2026.
  - `H`: 8th letter of alphabet (for August).
  - `8`: 8th month character.
  - `01`: First student sequence (starting from `801`).
- **Timing**: Auto-generated at the exact moment of registration.
- **Status**: **RESOLVED**.

---

### 4. Grade Entry Workflow
- **Client Answer**: Scores are captured automatically through the direct web entry of the online quiz or exam taken by the student, automatically attaching to their profile.
- **Status**: **RESOLVED** — The web app will feature an online assessment module for the 8 quizzes (5 marks max each) and the final exam (60 marks max), with auto-grading.

---

### 5. Automated Welcome Email & Course Material
- **Client Answer**: Upon registration, the system must automatically send an email to the student containing instructions and an instructional manual for the class.
- **Status**: **RESOLVED** — Integration with transactional email service (e.g., Resend, Brevo, SendGrid) to deliver welcome message with manual download link/attachment.

---

### 6. Post-Class Attendance & Quality Feedback
- **Client Answer**: Attendance can be captured at the end of class with a field providing opportunity for students to comment on the quality of teaching delivery.
- **Status**: **RESOLVED** — Attendance submission form includes rating/comments for teaching delivery quality.

---

### 7. Reporting & Automated Certificate Generation
- **Client Answer**: System must generate an Excel file showing students and their complete scores. The data will feed a section for automated graduation certificate generation.
- **Status**: **RESOLVED** — Will provide Excel export and an integrated automated certificate generation module.

---

### 8. Custom Domain
- **Client Answer**: Church owns domain; the application will be hosted at `ces.citizensoflightchurch.org`.
- **Status**: **RESOLVED**.

---

## Part 2: Technical & Material Inputs Needed for Build (P01)

### 9. Course Instructional Manual File
- **Question**: Do you have the PDF of the instructional manual ready for upload, and what is its file size?
- **Why this matters**: We will host this file securely so the automated registration email can instantly deliver a fast, reliable download link to newly admitted students without bouncing.
- **Recommended Default**: If not ready immediately, we will configure a placeholder manual in the system and provide an admin upload button so you can upload or replace the PDF at any time.

---

### 10. Quiz & Examination Questions Content
- **Question**: Are the questions for the 8 modular quizzes and the final examination currently in a Word document or spreadsheet, and are they strictly multiple-choice?
- **Why this matters**: Online instant grading requires predefined questions with correct answer keys. Knowing the format ensures we can seed them directly into the database.
- **Recommended Default**: We recommend standard multiple-choice questions (e.g., 5 questions per quiz, 1 mark each = 5 marks total; and 60 questions for the final exam = 60 marks total). We will include an administrative question manager so teachers can review and update questions.

---

### 11. Certificate Design Assets
- **Question**: Does the church have an official certificate layout or logo graphic, and whose signatures should appear on the certificate?
- **Why this matters**: Automated certificate generation needs the church crest/logo, header text, and signature placeholders (e.g., Senior Pastor and School Director).
- **Recommended Default**: We will create an elegant, professional certificate template incorporating the Citizens of Light Church branding, with dynamic fields for Student Name, Matric Number, Completion Date, and Honour Class (Distinction, Merit, Pass).
