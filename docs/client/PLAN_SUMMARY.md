# Citizens Elementary School (CES) Web Platform: Project Summary & Roadmap

**Prepared for:** Leadership of Citizens Elementary School & Citizens of Light Church, Ilorin  
**Project Objective:** Modernizing student enrollment, assessment, attendance, and graduation certification into an automated, error-free web portal.

---

## 1. What We Are Building (Version 1)

1. **Student Registration & Instant Onboarding**:
   - An online registration form matching the church's existing Google Form questions plus passport photo upload.
   - Immediate automatic generation of official matriculation numbers (e.g., `CES/ILR/26H801`).
   - Automated welcome email sent to the student containing class instructions and a direct download link for the instructional course manual.
2. **Online Student Quizzes & Final Examination**:
   - A fast, mobile-friendly test-taking screen where students take the 8 modular course quizzes (5 marks each) and the final examination (60 marks) on their mobile phones.
   - Tests are secured by a **Teacher Session PIN** given out in class, ensuring only students physically present can take the test.
   - Tests are auto-graded immediately, eliminating manual marking and recording delays.
3. **Class Attendance & Delivery Feedback**:
   - Students check in at the end of class for *Elementary Principles* and *Membership & Vision Class*.
   - Includes a 5-star rating and comment box for students to provide feedback on teaching delivery quality.
4. **Teacher Gradebook & Emergency Override**:
   - Teachers can view live student rosters and scores.
   - If a student's phone battery dies or their network fails, teachers have a secure screen to enter or adjust scores manually.
5. **Automated Graduation Clearance & Honours**:
   - Automatic calculation of graduation eligibility: Students graduate if their total score is **$\ge 50$** and they have **Attended** both mandatory classes.
   - Automatic calculation of honours: **Distinction ($\ge 85$)**, **Merit ($\ge 75$)**, **Pass ($\ge 50$)**, and **Below Pass ($< 50$)**.
6. **Reporting & Automated Certificate Generation**:
   - One-click Excel download of the complete student cohort broadsheet.
   - An automated certificate tool that creates print-ready, high-resolution graduation certificates for all approved graduates.
7. **Student 360° Diagnostic Lookup**:
   - An administrative search tool allowing church leaders to search by student name or matric number to instantly view their full profile, quiz breakdown, and an **Outstanding Items checklist** showing any incomplete requirements.

---

## 2. What Is Out of Scope for Version 1 (Planned for Future Phases)

- **Student Self-Service Profile Accounts**: Students do not have persistent logins to look up multi-year academic transcripts; the system is optimized for fast testing and staff administration.
- **Automated SMS / WhatsApp Gateway Messaging**: Excluded to avoid recurring third-party messaging subscription fees; email and in-class PINs handle all notifications.
- **Online Tuition / Payment Gateways**: The portal does not process commercial payments.

---

## 3. Project Delivery Milestones

| Milestone | Deliverable | What You Will Review / Sign Off |
| :--- | :--- | :--- |
| **Milestone 1** | **System Foundation & Roles** | Administrator, Teacher, and Leadership login accounts; Regular vs. Sunday Cohort setups. |
| **Milestone 2** | **Student Registration & Welcome Email** | Completing the student registration form on mobile/desktop and receiving the automated welcome email. |
| **Milestone 3** | **Online Quiz & Exam System** | Taking a sample quiz on a smartphone using a teacher PIN, and seeing the score record automatically. |
| **Milestone 4** | **Attendance & Teacher Gradebook** | Submitting class attendance with delivery feedback, and testing the teacher emergency score override. |
| **Milestone 5** | **Graduation Broadsheet & Certificates** | Reviewing the automated graduation results, exporting the Excel file, and generating sample graduation certificates. |
| **Milestone 6** | **Full Verification & Launch** | Final testing with 100 simultaneous simulated test-takers, staff training guide handover, and launch. |

---

## 4. What We Need From You (Client Inputs)

To keep development moving smoothly, we will need:
1. **Instructional Course Manual**: The PDF document of the student manual so it can be linked to the welcome email (a placeholder will be used until provided).
2. **Quiz & Exam Questions**: The list of questions and answer keys for the 8 quizzes and final exam (standard multiple-choice format).
3. **Church Branding & Signatures**: High-resolution image of the church crest/logo, and the names/titles of signatories to appear on the graduation certificates.

---

## 5. Ongoing Running Costs

By carefully selecting modern cloud infrastructure (Vercel + Supabase hobby tiers + Gmail/Brevo email dispatch):
- **Hosting & Database Costs**: **$0.00 / month** (Free tier comfortably supports up to 50,000 monthly active users and over 200,000 student records).
- **Email Dispatch**: **$0.00 / month** (Free tier handles daily cohort email volumes without monthly fees).
- **Domain Name**: Covered under your existing church domain (`ces.citizensoflightchurch.org`).

**Total Estimated Infrastructure Cost to the Church: $0.00 / month.**
