export type CohortType = 'Regular' | 'Sunday Cohort';
export type StudentStatus = 'Active' | 'Graduated' | 'Deferred';
export type AssessmentType = 'quiz' | 'final_exam';
export type AttendanceStatus = 'Attended' | 'Not Attended' | 'Excused';
export type GraduationStatus = '✅ GRADUATE' | '❌ NOT YET' | '⏳ PENDING';
export type HonourClass = 'Distinction' | 'Merit' | 'Pass' | 'Below Pass';
export type StaffRole = 'super_admin' | 'ces_admin' | 'ces_teacher';

export interface CesSemester {
  id: string;
  name: string;
  type: CohortType;
  start_date: string;
  end_date: string;
  year: number;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
}

export interface CesStudent {
  id: string;
  semester_id: string;
  matric_no: string;
  surname: string;
  first_name: string;
  middle_name?: string | null;
  phone_number: string;
  whatsapp_number?: string | null;
  email_address: string;
  permanent_address?: string | null;
  gender: string;
  marital_status: string;
  educational_level?: string | null;
  born_again: string;
  baptised_hs: string;
  unit_of_interest?: string | null;
  years_as_christian?: string | null;
  previously_served?: string | null;
  prev_service_details?: string | null;
  gifts_skills?: string | null;
  attended_mem_vision: string;
  committed_to_programme: string;
  comments_enquiries?: string | null;
  cohort_type: CohortType;
  status: StudentStatus;
  occupation?: string | null;
  emergency_contact?: string | null;
  emergency_contact_phone?: string | null;
  notes?: string | null;
  passport_url?: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface CesQuiz {
  id: string;
  semester_id: string;
  course_code: string;
  title: string;
  assessment_type: AssessmentType;
  max_score: number;
  session_pin?: string | null;
  is_open: boolean;
  created_at: string;
}

export interface CesQuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  marks: number;
  sort_order: number;
}

export interface CesStudentAssessment {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number;
  answer_payload?: Record<string, number> | null;
  is_manual_override: boolean;
  overridden_by?: string | null;
  override_reason?: string | null;
  submitted_at: string;
}

export interface CesAttendanceRecord {
  id: string;
  student_id: string;
  semester_id: string;
  course_name: string;
  status: AttendanceStatus;
  delivery_rating?: number | null;
  delivery_feedback?: string | null;
  session_date: string;
  logged_at: string;
}

export interface CesCertificate {
  id: string;
  student_id: string;
  certificate_no: string;
  honour_class: HonourClass;
  cumulative_total: number;
  issued_at: string;
  pdf_url?: string | null;
}

export interface CesStaffProfile {
  id: string;
  email: string;
  role: StaffRole;
  full_name: string;
  created_at: string;
}

// Complete Academic Result Structure for Diagnostics and Broadsheet
export interface StudentAcademicSummary {
  student: CesStudent;
  quiz_scores: Record<string, number | null>; // keyed by course_code
  quiz_total: number | null; // out of 40
  final_exam_score: number | null; // out of 60
  cumulative_total: number | null; // out of 100
  elementary_principles_attendance: AttendanceStatus | null;
  membership_vision_attendance: AttendanceStatus | null;
  graduation_status: GraduationStatus;
  honour_class: HonourClass | null;
  notes: string;
}
