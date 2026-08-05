// Database types for Auto École Saint Augustin

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      students: { Row: Student };
      subscriptions: { Row: Subscription };
      courses: { Row: Course };
      chapters: { Row: Chapter };
      lessons: { Row: Lesson };
      lesson_progress: { Row: LessonProgress };
      questions: { Row: Question };
      answers: { Row: Answer };
      exam_sessions: { Row: ExamSession };
      exercise_sessions: { Row: ExerciseSession };
      learner_permits: { Row: LearnerPermit };
      notifications: { Row: Notification };
      settings: { Row: Setting };
    };
  };
}

export type UserRole = "admin" | "directeur" | "secretaire" | "apprenant" | "moniteur";

export type GradeRating = "Médiocre" | "Passable" | "Bien" | "Très Bien";

export type StudentStatus = "pending" | "validated" | "archived";

export type SubscriptionStatus = "pending" | "active" | "expired" | "suspended" | "cancelled";

export type SubscriptionPlan = "1_mois" | "3_mois" | "6_mois";

export type PermitCategory = "A" | "A1" | "A2" | "B" | "B1" | "C" | "C1" | "D" | "D1" | "E" | "F";

export type LessonType = "video" | "audio" | "pdf" | "image" | "text" | "animation";

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id?: string;
  matricule: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  birth_place?: string;
  gender?: string;
  address?: string;
  city?: string;
  nationality?: string;
  photo_url?: string;
  status: StudentStatus;
  notes?: string;
  registered_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  student_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date?: string;
  end_date?: string;
  amount?: number;
  payment_status?: string;
  payment_reference?: string;
  payment_method?: string;
  fedapay_transaction_id?: string;
  notes?: string;
  activated_by?: string;
  activated_at?: string;
  suspended_by?: string;
  suspended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  thumbnail_url?: string;
  is_published: boolean;
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  chapter_id: string;
  course_id: string;
  title: string;
  description?: string;
  lesson_type: LessonType;
  content?: string;
  file_url?: string;
  duration?: number;
  order_index: number;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  is_completed: boolean;
  progress_percent: number;
  last_position: number;
  completed_at?: string;
  updated_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  explanation?: string;
  image_url?: string;
  category?: string;
  difficulty?: string;
  exam_pool: boolean;
  chapter_id?: string;
  course_id?: string;
  created_by?: string;
  created_at: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface ExamSession {
  id: string;
  student_id: string;
  title: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  pass_score: number;
  time_limit?: number;
  is_passed: boolean;
  started_at: string;
  completed_at?: string;
  questions_detail?: any[];
  recommendations?: string[];
}

export interface ExerciseSession {
  id: string;
  student_id: string;
  chapter_id?: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  started_at: string;
  completed_at?: string;
}

export interface LearnerPermit {
  id: string;
  student_id: string;
  permit_number: string;
  categories?: PermitCategory[];
  issue_date: string;
  delivery_date?: string;
  expiry_date?: string;
  issuing_center?: string;
  scan_url?: string;
  observations?: string;
  registered_by?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface DrivingEvaluation {
  id: string;
  student_id: string;
  instructor_id?: string;
  evaluation_date: string;
  ml1?: GradeRating;
  ml2?: GradeRating;
  ml3?: GradeRating;
  r1?: GradeRating;
  r2?: GradeRating;
  r3?: GradeRating;
  zigzag1?: GradeRating;
  zigzag2?: GradeRating;
  zigzag3?: GradeRating;
  cr1?: GradeRating;
  cr2?: GradeRating;
  cr3?: GradeRating;
  comments?: string;
  created_at: string;
  students?: {
    id: string;
    first_name: string;
    last_name: string;
    matricule: string;
  } | null;
}

export type CompositionQuestionType = "single" | "multiple" | "boolean";

export interface CompositionQuestionOption {
  id: string;
  label: string;
  text: string;
}

export interface CompositionQuestion {
  id: string;
  subject_id: string;
  question_number: number;
  question_text: string;
  question_type: CompositionQuestionType;
  options: CompositionQuestionOption[];
  correct_answers: string[];
  explanation?: string;
  image_url?: string;
  audio_start_time?: number;
  audio_end_time?: number;
  category?: string;
}

export interface CompositionSubject {
  id: string;
  title: string;
  permit_category: PermitCategory;
  duration_minutes: number;
  total_questions: number;
  pass_score: number;
  difficulty: "Facile" | "Moyen" | "Difficile";
  audio_url?: string;
  can_go_back: boolean;
  show_explanations: boolean;
  is_published: boolean;
  created_at: string;
  questions?: CompositionQuestion[];
}

export interface CompositionSession {
  id: string;
  student_id: string;
  subject_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  percentage: number;
  is_passed: boolean;
  duration_seconds: number;
  answers_detail: Record<string, string[]>;
  started_at: string;
  completed_at: string;
  subject?: CompositionSubject;
}
