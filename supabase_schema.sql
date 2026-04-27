-- ╔══════════════════════════════════════════════════════════════╗
-- ║         TakeCare HMS — Complete Database Schema             ║
-- ║         Run this in Supabase SQL Editor                     ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════
-- 1. PROFILES (synced from auth.users via trigger)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ══════════════════════════════════════════════════════════════
-- 2. DOCTOR PROFILES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.doctor_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id       UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization   TEXT NOT NULL DEFAULT 'General Physician',
  department       TEXT NOT NULL DEFAULT 'General',
  qualifications   TEXT,
  license_number   TEXT,
  experience_years INTEGER NOT NULL DEFAULT 0,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 500,
  is_available     BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctor_profiles_profile ON public.doctor_profiles(profile_id);
CREATE INDEX idx_doctor_profiles_dept ON public.doctor_profiles(department);

-- ══════════════════════════════════════════════════════════════
-- 3. PATIENT PROFILES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.patient_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_of_birth     DATE,
  gender            TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_group       TEXT,
  address           TEXT,
  emergency_contact TEXT,
  allergies         TEXT,
  insurance_provider TEXT,
  insurance_id      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_profiles_profile ON public.patient_profiles(profile_id);

-- ══════════════════════════════════════════════════════════════
-- 4. WARDS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.wards (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  floor         TEXT NOT NULL DEFAULT 'Floor 1',
  total_beds    INTEGER NOT NULL DEFAULT 20,
  occupied_beds INTEGER NOT NULL DEFAULT 0,
  ward_type     TEXT NOT NULL DEFAULT 'General',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT occupied_lte_total CHECK (occupied_beds <= total_beds)
);

-- ══════════════════════════════════════════════════════════════
-- 5. APPOINTMENTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.appointments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  time        TIME NOT NULL,
  duration    TEXT NOT NULL DEFAULT '30 min',
  type        TEXT NOT NULL DEFAULT 'Consultation',
  status      TEXT NOT NULL DEFAULT 'scheduled'
              CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ══════════════════════════════════════════════════════════════
-- 6. PRESCRIPTIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.prescriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  medicines   JSONB NOT NULL DEFAULT '[]',
  duration    TEXT NOT NULL DEFAULT '7 days',
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'completed', 'cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON public.prescriptions(doctor_id);

-- ══════════════════════════════════════════════════════════════
-- 7. LAB REPORTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.lab_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ordered_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_name   TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  result      TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'normal', 'abnormal', 'critical')),
  report_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_reports_patient ON public.lab_reports(patient_id);
CREATE INDEX idx_lab_reports_doctor ON public.lab_reports(ordered_by);

-- ══════════════════════════════════════════════════════════════
-- 8. INVOICES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.invoices (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date               DATE NOT NULL DEFAULT CURRENT_DATE,
  amount             NUMERIC(12,2) NOT NULL,
  description        TEXT NOT NULL,
  insurance_provider TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('paid', 'pending', 'overdue')),
  payment_method     TEXT,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- ══════════════════════════════════════════════════════════════
-- 9. VIDEO SESSIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.video_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id   UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER,
  status           TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled', 'waiting', 'in_progress', 'completed', 'cancelled')),
  room_id          TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_sessions_patient ON public.video_sessions(patient_id);
CREATE INDEX idx_video_sessions_doctor ON public.video_sessions(doctor_id);

-- ══════════════════════════════════════════════════════════════
-- 10. NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read    BOOLEAN NOT NULL DEFAULT false,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE NOT is_read;

-- ══════════════════════════════════════════════════════════════
-- 11. HOSPITAL SETTINGS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.hospital_settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_name TEXT NOT NULL DEFAULT 'TakeCare General Hospital',
  address       TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT 'admin@takecarehms.com',
  phone         TEXT NOT NULL DEFAULT '',
  currency      TEXT NOT NULL DEFAULT 'INR',
  timezone      TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  date_format   TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings row
INSERT INTO public.hospital_settings (hospital_name, address, email, phone)
VALUES ('TakeCare General Hospital', '123 Medical Drive, Healthcare City', 'admin@takecarehms.com', '+91 98765 43210');

-- ══════════════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile on signup
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );

  -- Auto-create role-specific profile
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'doctor' THEN
    INSERT INTO public.doctor_profiles (profile_id) VALUES (NEW.id);
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'patient' THEN
    INSERT INTO public.patient_profiles (profile_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGER: Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES RLS ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Doctors can read patient profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'doctor' AND role = 'patient');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- ── DOCTOR PROFILES RLS ──
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can read own doctor_profile"
  ON public.doctor_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage doctor_profiles"
  ON public.doctor_profiles FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Patients can view doctors"
  ON public.doctor_profiles FOR SELECT
  USING (public.get_user_role() = 'patient');

CREATE POLICY "Doctors can update own doctor_profile"
  ON public.doctor_profiles FOR UPDATE
  USING (profile_id = auth.uid());

-- ── PATIENT PROFILES RLS ──
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can read own patient_profile"
  ON public.patient_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage patient_profiles"
  ON public.patient_profiles FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Doctors can read patient_profiles"
  ON public.patient_profiles FOR SELECT
  USING (public.get_user_role() = 'doctor');

CREATE POLICY "Patients can update own patient_profile"
  ON public.patient_profiles FOR UPDATE
  USING (profile_id = auth.uid());

-- ── WARDS RLS ──
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read wards"
  ON public.wards FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage wards"
  ON public.wards FOR ALL
  USING (public.get_user_role() = 'admin');

-- ── APPOINTMENTS RLS ──
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own appointments"
  ON public.appointments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors see own appointments"
  ON public.appointments FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "Admins see all appointments"
  ON public.appointments FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Patients can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors can update own appointments"
  ON public.appointments FOR UPDATE
  USING (doctor_id = auth.uid());

CREATE POLICY "Patients can update own appointments"
  ON public.appointments FOR UPDATE
  USING (patient_id = auth.uid());

-- ── PRESCRIPTIONS RLS ──
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors see own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "Admins see all prescriptions"
  ON public.prescriptions FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Doctors can create prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update own prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (doctor_id = auth.uid());

-- ── LAB REPORTS RLS ──
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own lab reports"
  ON public.lab_reports FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors see ordered lab reports"
  ON public.lab_reports FOR SELECT
  USING (ordered_by = auth.uid());

CREATE POLICY "Admins manage lab reports"
  ON public.lab_reports FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Doctors can create lab reports"
  ON public.lab_reports FOR INSERT
  WITH CHECK (ordered_by = auth.uid());

CREATE POLICY "Doctors can update ordered lab reports"
  ON public.lab_reports FOR UPDATE
  USING (ordered_by = auth.uid());

-- ── INVOICES RLS ──
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own invoices"
  ON public.invoices FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Admins manage invoices"
  ON public.invoices FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Patients can update own invoices for payment"
  ON public.invoices FOR UPDATE
  USING (patient_id = auth.uid());

-- ── VIDEO SESSIONS RLS ──
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own video sessions"
  ON public.video_sessions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors see own video sessions"
  ON public.video_sessions FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "Admins manage video sessions"
  ON public.video_sessions FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Patients can create video sessions"
  ON public.video_sessions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors can update own video sessions"
  ON public.video_sessions FOR UPDATE
  USING (doctor_id = auth.uid());

CREATE POLICY "Patients can update own video sessions"
  ON public.video_sessions FOR UPDATE
  USING (patient_id = auth.uid());

-- ── NOTIFICATIONS RLS ──
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- System can insert via service role key (triggers etc.)

-- ── HOSPITAL SETTINGS RLS ──
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read settings"
  ON public.hospital_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update settings"
  ON public.hospital_settings FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- ENABLE REALTIME on key tables
-- ══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_sessions;

-- ══════════════════════════════════════════════════════════════
-- SEED DATA: Default Wards
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.wards (name, floor, total_beds, occupied_beds, ward_type) VALUES
  ('Cardiology Ward',   'Floor 2, Block A', 30, 24, 'Specialized'),
  ('ICU',               'Floor 3, Block B', 20, 19, 'Critical Care'),
  ('General Ward',      'Floor 1, Block A', 60, 35, 'General'),
  ('Maternity Ward',    'Floor 2, Block C', 25, 12, 'Specialized'),
  ('Oncology Ward',     'Floor 4, Block B', 20, 15, 'Specialized'),
  ('Orthopedics Ward',  'Floor 3, Block A', 25, 10, 'Surgical'),
  ('Neurology Ward',    'Floor 4, Block C', 20, 8,  'Specialized'),
  ('Pediatrics Ward',   'Floor 1, Block C', 30, 14, 'Specialized');
