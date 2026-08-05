-- ============================================================
-- AUTO ÉCOLE SAINT AUGUSTIN — Schéma PostgreSQL complet
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'directeur', 'secretaire', 'apprenant');
CREATE TYPE subscription_plan AS ENUM ('1_mois', '3_mois', '6_mois');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'suspended', 'pending');
CREATE TYPE enrollment_status AS ENUM ('pending', 'validated', 'archived');
CREATE TYPE lesson_type AS ENUM ('video', 'audio', 'pdf', 'image', 'animation', 'text');
CREATE TYPE question_type AS ENUM ('qcm', 'vrai_faux', 'choix_multiple', 'image');
CREATE TYPE permit_category AS ENUM ('A', 'A1', 'A2', 'B', 'B1', 'C', 'C1', 'D', 'D1', 'E', 'F');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ============================================================
-- TABLE: roles
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name user_role NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('admin', 'Accès complet à la plateforme'),
  ('directeur', 'Consultation des statistiques et supervision'),
  ('secretaire', 'Gestion des inscriptions et des apprenants'),
  ('apprenant', 'Accès uniquement à l''espace personnel');

-- ============================================================
-- TABLE: profiles (extension de auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'apprenant',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: students (apprenants)
-- ============================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  matricule TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  birth_place TEXT,
  nationality TEXT DEFAULT 'Béninoise',
  gender TEXT CHECK (gender IN ('M', 'F')),
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  photo_url TEXT,
  status enrollment_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Séquence pour matricule
CREATE SEQUENCE IF NOT EXISTS student_matricule_seq START 1;

-- Fonction auto-matricule SA-YYYY-NNNN
CREATE OR REPLACE FUNCTION generate_matricule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.matricule IS NULL OR NEW.matricule = '' THEN
    NEW.matricule := 'SA-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('student_matricule_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_matricule
  BEFORE INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION generate_matricule();

-- ============================================================
-- TABLE: documents (pièces jointes)
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'photo', 'cip', 'acte_naissance', 'autre'
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: subscriptions (abonnements)
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  status subscription_status DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  payment_reference TEXT,
  payment_status payment_status DEFAULT 'pending',
  fedapay_transaction_id TEXT,
  amount DECIMAL(10,2),
  activated_by UUID REFERENCES profiles(id),
  activated_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES profiles(id),
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: device_sessions (sécurité multi-appareils)
-- ============================================================
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  is_trusted BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- ============================================================
-- TABLE: login_history (historique connexions)
-- ============================================================
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  status TEXT NOT NULL, -- 'success', 'blocked', 'failed'
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: courses (cours)
-- ============================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  level TEXT DEFAULT 'débutant',
  is_published BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  estimated_duration INTEGER, -- en minutes
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: chapters (chapitres)
-- ============================================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: lessons (leçons)
-- ============================================================
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- HTML content / markdown
  lesson_type lesson_type DEFAULT 'text',
  file_url TEXT, -- pour video/audio/pdf/image
  thumbnail_url TEXT,
  duration INTEGER, -- en secondes
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: lesson_progress (progression)
-- ============================================================
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  progress_percent INTEGER DEFAULT 0,
  watch_time INTEGER DEFAULT 0, -- secondes regardées
  last_position INTEGER DEFAULT 0, -- position en secondes
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- ============================================================
-- TABLE: exercises (exercices)
-- ============================================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  exercise_type question_type DEFAULT 'qcm',
  time_limit INTEGER, -- secondes, NULL = sans limite
  pass_score INTEGER DEFAULT 60, -- pourcentage minimum
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: questions
-- ============================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  exam_pool BOOLEAN DEFAULT FALSE, -- utilisable dans les examens blancs
  question_text TEXT NOT NULL,
  question_type question_type DEFAULT 'qcm',
  image_url TEXT,
  explanation TEXT, -- explication de la bonne réponse
  difficulty TEXT DEFAULT 'moyen', -- facile, moyen, difficile
  category TEXT, -- catégorie du code de la route
  tags TEXT[],
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: answers (options de réponse)
-- ============================================================
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: exercise_sessions (sessions d'exercice)
-- ============================================================
CREATE TABLE exercise_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_taken INTEGER, -- secondes
  is_passed BOOLEAN DEFAULT FALSE,
  answers_detail JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- TABLE: exam_sessions (examens blancs)
-- ============================================================
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Examen Blanc',
  total_questions INTEGER DEFAULT 40,
  time_limit INTEGER DEFAULT 2400, -- 40 min en secondes
  score INTEGER,
  correct_answers INTEGER,
  is_passed BOOLEAN,
  pass_score INTEGER DEFAULT 70,
  questions_detail JSONB DEFAULT '[]', -- questions + réponses choisies
  recommendations TEXT[],
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- TABLE: learner_permits (permis délivrés)
-- ============================================================
CREATE TABLE learner_permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  permit_number TEXT NOT NULL UNIQUE,
  categories permit_category[],
  issue_date DATE NOT NULL,
  delivery_date DATE,
  expiry_date DATE,
  issuing_center TEXT,
  scan_url TEXT,
  scan_type TEXT, -- 'pdf' ou 'image'
  observations TEXT,
  registered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'info', 'warning', 'success', 'exam', 'subscription'
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: settings (paramètres globaux)
-- ============================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  label TEXT,
  category TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value, label, category) VALUES
  ('school_name', 'Auto École Saint Augustin', 'Nom de l''école', 'general'),
  ('school_phone', '', 'Téléphone', 'general'),
  ('school_address', 'Bénin', 'Adresse', 'general'),
  ('exam_questions_count', '40', 'Nombre de questions par examen', 'exam'),
  ('exam_duration', '2400', 'Durée de l''examen (secondes)', 'exam'),
  ('exam_pass_score', '70', 'Score minimum de réussite (%)', 'exam'),
  ('subscription_1_month_price', '5000', 'Prix abonnement 1 mois (FCFA)', 'subscription'),
  ('subscription_3_months_price', '12000', 'Prix abonnement 3 mois (FCFA)', 'subscription'),
  ('subscription_6_months_price', '20000', 'Prix abonnement 6 mois (FCFA)', 'subscription');

-- ============================================================
-- TABLE: audit_logs (journal d'audit)
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (Performance)
-- ============================================================
CREATE INDEX idx_students_matricule ON students(matricule);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX idx_exercise_sessions_student ON exercise_sessions(student_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_questions_pool ON questions(exam_pool) WHERE exam_pool = TRUE;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Suspension automatique des abonnements expirés
CREATE OR REPLACE FUNCTION suspend_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active' AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Créer le profil automatiquement après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'apprenant'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour le rôle actuel
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fonction helper pour l'ID student
CREATE OR REPLACE FUNCTION get_student_id()
RETURNS UUID AS $$
  SELECT id FROM students WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid() OR get_current_user_role() IN ('admin', 'directeur', 'secretaire'));
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid() OR get_current_user_role() = 'admin');
CREATE POLICY "profiles_admin_insert" ON profiles FOR INSERT WITH CHECK (get_current_user_role() = 'admin');

-- STUDENTS
CREATE POLICY "students_select" ON students FOR SELECT USING (
  user_id = auth.uid() OR get_current_user_role() IN ('admin', 'directeur', 'secretaire')
);
CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (get_current_user_role() IN ('admin', 'secretaire'));
CREATE POLICY "students_update" ON students FOR UPDATE USING (get_current_user_role() IN ('admin', 'secretaire'));
CREATE POLICY "students_delete" ON students FOR DELETE USING (get_current_user_role() = 'admin');

-- DOCUMENTS
CREATE POLICY "documents_select" ON documents FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
  get_current_user_role() IN ('admin', 'secretaire')
);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (get_current_user_role() IN ('admin', 'secretaire'));
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (get_current_user_role() IN ('admin', 'secretaire'));

-- SUBSCRIPTIONS
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
  get_current_user_role() IN ('admin', 'directeur', 'secretaire')
);
CREATE POLICY "subscriptions_manage" ON subscriptions FOR ALL USING (get_current_user_role() = 'admin');

-- COURSES (lecture publique si publié)
CREATE POLICY "courses_select_published" ON courses FOR SELECT USING (is_published = TRUE OR get_current_user_role() IN ('admin', 'directeur'));
CREATE POLICY "courses_manage" ON courses FOR ALL USING (get_current_user_role() = 'admin');

-- CHAPTERS
CREATE POLICY "chapters_select" ON chapters FOR SELECT USING (is_published = TRUE OR get_current_user_role() IN ('admin', 'directeur'));
CREATE POLICY "chapters_manage" ON chapters FOR ALL USING (get_current_user_role() = 'admin');

-- LESSONS
CREATE POLICY "lessons_select" ON lessons FOR SELECT USING (is_published = TRUE OR get_current_user_role() IN ('admin', 'directeur'));
CREATE POLICY "lessons_manage" ON lessons FOR ALL USING (get_current_user_role() = 'admin');

-- LESSON_PROGRESS
CREATE POLICY "progress_select_own" ON lesson_progress FOR SELECT USING (
  student_id = get_student_id() OR get_current_user_role() IN ('admin', 'directeur')
);
CREATE POLICY "progress_upsert_own" ON lesson_progress FOR ALL USING (student_id = get_student_id());

-- EXERCISES
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (is_published = TRUE OR get_current_user_role() = 'admin');
CREATE POLICY "exercises_manage" ON exercises FOR ALL USING (get_current_user_role() = 'admin');

-- QUESTIONS & ANSWERS
CREATE POLICY "questions_select" ON questions FOR SELECT USING (TRUE);
CREATE POLICY "questions_manage" ON questions FOR ALL USING (get_current_user_role() = 'admin');
CREATE POLICY "answers_select" ON answers FOR SELECT USING (TRUE);
CREATE POLICY "answers_manage" ON answers FOR ALL USING (get_current_user_role() = 'admin');

-- SESSIONS
CREATE POLICY "exercise_sessions_own" ON exercise_sessions FOR ALL USING (student_id = get_student_id() OR get_current_user_role() IN ('admin', 'directeur'));
CREATE POLICY "exam_sessions_own" ON exam_sessions FOR ALL USING (student_id = get_student_id() OR get_current_user_role() IN ('admin', 'directeur'));

-- LEARNER PERMITS
CREATE POLICY "permits_select" ON learner_permits FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
  get_current_user_role() IN ('admin', 'directeur', 'secretaire')
);
CREATE POLICY "permits_manage" ON learner_permits FOR ALL USING (get_current_user_role() IN ('admin', 'secretaire'));

-- NOTIFICATIONS
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- SETTINGS
CREATE POLICY "settings_select_all" ON settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_manage_admin" ON settings FOR ALL USING (get_current_user_role() = 'admin');

-- AUDIT LOGS
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT USING (get_current_user_role() IN ('admin', 'directeur'));
CREATE POLICY "audit_insert_all" ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- DEVICE SESSIONS
CREATE POLICY "device_sessions_own" ON device_sessions FOR SELECT USING (user_id = auth.uid() OR get_current_user_role() = 'admin');
CREATE POLICY "device_sessions_manage_own" ON device_sessions FOR ALL USING (user_id = auth.uid() OR get_current_user_role() = 'admin');

-- LOGIN HISTORY
CREATE POLICY "login_history_own" ON login_history FOR SELECT USING (user_id = auth.uid() OR get_current_user_role() = 'admin');
CREATE POLICY "login_history_insert" ON login_history FOR INSERT WITH CHECK (TRUE);
