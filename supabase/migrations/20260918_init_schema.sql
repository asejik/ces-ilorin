-- ==============================================================================
-- MIGRATION: 20260918_init_schema.sql
-- Citizens Elementary School (CES) Discipleship Training Platform
-- Classification: ADDITIVE (All tables prefixed with ces_ for 100% collision isolation)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STAFF PROFILES
CREATE TABLE IF NOT EXISTS ces_staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'ces_admin', 'ces_teacher')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. SEMESTERS
CREATE TABLE IF NOT EXISTS ces_semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Regular', 'Sunday Cohort')),
  start_date DATE,
  end_date DATE,
  year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. STUDENTS
CREATE TABLE IF NOT EXISTS ces_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID NOT NULL REFERENCES ces_semesters(id) ON DELETE RESTRICT,
  matric_no TEXT NOT NULL UNIQUE,
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT,
  email_address TEXT NOT NULL,
  permanent_address TEXT,
  gender TEXT NOT NULL,
  marital_status TEXT NOT NULL,
  educational_level TEXT,
  born_again TEXT NOT NULL,
  baptised_hs TEXT NOT NULL,
  unit_of_interest TEXT,
  years_as_christian TEXT,
  previously_served TEXT,
  prev_service_details TEXT,
  gifts_skills TEXT,
  attended_mem_vision TEXT NOT NULL,
  committed_to_programme TEXT NOT NULL,
  comments_enquiries TEXT,
  cohort_type TEXT NOT NULL CHECK (cohort_type IN ('Regular', 'Sunday Cohort')),
  status TEXT DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Graduated', 'Deferred')),
  occupation TEXT,
  emergency_contact TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  passport_url TEXT,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for high-speed student lookup
CREATE INDEX IF NOT EXISTS idx_ces_students_matric ON ces_students(matric_no);
CREATE INDEX IF NOT EXISTS idx_ces_students_semester ON ces_students(semester_id);
CREATE INDEX IF NOT EXISTS idx_ces_students_names ON ces_students(surname, first_name);
CREATE INDEX IF NOT EXISTS idx_ces_students_status ON ces_students(status);

-- 5. QUIZZES & EXAMS
CREATE TABLE IF NOT EXISTS ces_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID NOT NULL REFERENCES ces_semesters(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  title TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'final_exam')),
  max_score NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  session_pin TEXT,
  is_open BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(semester_id, course_code)
);

-- 6. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS ces_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES ces_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INTEGER NOT NULL CHECK (correct_option_index >= 0 AND correct_option_index <= 3),
  marks NUMERIC(4,2) DEFAULT 1.00 NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ces_quiz_questions_quiz ON ces_quiz_questions(quiz_id);

-- 7. STUDENT ASSESSMENTS (GRADES)
CREATE TABLE IF NOT EXISTS ces_student_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES ces_students(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES ces_quizzes(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0),
  answer_payload JSONB,
  is_manual_override BOOLEAN DEFAULT false NOT NULL,
  overridden_by UUID REFERENCES ces_staff_profiles(id) ON DELETE SET NULL,
  override_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, quiz_id)
);

CREATE INDEX IF NOT EXISTS idx_ces_assessments_student ON ces_student_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_ces_assessments_quiz ON ces_student_assessments(quiz_id);

-- 8. ATTENDANCE & FEEDBACK
CREATE TABLE IF NOT EXISTS ces_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES ces_students(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES ces_semesters(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Attended', 'Not Attended', 'Excused')),
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  delivery_feedback TEXT,
  session_date DATE DEFAULT CURRENT_DATE NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ces_attendance_student ON ces_attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_ces_attendance_semester ON ces_attendance_records(semester_id);

-- 9. CERTIFICATES
CREATE TABLE IF NOT EXISTS ces_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES ces_students(id) ON DELETE CASCADE UNIQUE,
  certificate_no TEXT NOT NULL UNIQUE,
  honour_class TEXT NOT NULL CHECK (honour_class IN ('Distinction', 'Merit', 'Pass', 'Below Pass')),
  cumulative_total NUMERIC(5,2) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  pdf_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_ces_certificates_student ON ces_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_ces_certificates_cert_no ON ces_certificates(certificate_no);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE ces_staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_student_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_certificates ENABLE ROW LEVEL SECURITY;

-- Helper function: is authenticated staff in CES
CREATE OR REPLACE FUNCTION is_ces_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ces_staff_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Semesters Policies
CREATE POLICY "Public can view active semesters" ON ces_semesters
  FOR SELECT USING (is_active = true OR is_ces_staff());

CREATE POLICY "Staff can insert/update semesters" ON ces_semesters
  FOR ALL USING (is_ces_staff());

-- Students Policies
CREATE POLICY "Anyone can register (insert student)" ON ces_students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view all students" ON ces_students
  FOR SELECT USING (is_ces_staff());

CREATE POLICY "Staff can update/delete students" ON ces_students
  FOR UPDATE USING (is_ces_staff());

-- Quizzes Policies
CREATE POLICY "Public can view open quizzes" ON ces_quizzes
  FOR SELECT USING (is_open = true OR is_ces_staff());

CREATE POLICY "Staff can manage quizzes" ON ces_quizzes
  FOR ALL USING (is_ces_staff());

-- Quiz Questions Policies (Answer keys never leaked to public)
CREATE POLICY "Staff can view all question data" ON ces_quiz_questions
  FOR ALL USING (is_ces_staff());

-- Student Assessments Policies
CREATE POLICY "Staff can view and override assessments" ON ces_student_assessments
  FOR ALL USING (is_ces_staff());

-- Attendance Policies
CREATE POLICY "Anyone can insert attendance" ON ces_attendance_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view all attendance" ON ces_attendance_records
  FOR SELECT USING (is_ces_staff());

-- Certificates Policies
CREATE POLICY "Staff can view and manage certificates" ON ces_certificates
  FOR ALL USING (is_ces_staff());

-- ==============================================================================
-- 11. ROLE PRIVILEGES & DEFAULT SEEDS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Seed default active semesters
INSERT INTO ces_semesters (name, type, year, is_active, notes)
SELECT 'Regular Cohort — 2026', 'Regular', 2026, true, 'Default 2026 Regular Cohort'
WHERE NOT EXISTS (
  SELECT 1 FROM ces_semesters WHERE type = 'Regular' AND year = 2026
);

INSERT INTO ces_semesters (name, type, year, is_active, notes)
SELECT 'Sunday Cohort — 2026', 'Sunday Cohort', 2026, true, 'Default 2026 Sunday Cohort'
WHERE NOT EXISTS (
  SELECT 1 FROM ces_semesters WHERE type = 'Sunday Cohort' AND year = 2026
);

