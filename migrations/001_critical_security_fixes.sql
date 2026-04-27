-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TakeCare HMS — Migration 001: Critical Security Fixes     ║
-- ║  Run in Supabase SQL Editor (in order)                     ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════════
-- 1A. Add account_status + is_verified to profiles
--     Prevents unauthorized access, enables doctor approval flow
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('pending_approval', 'active', 'suspended', 'deactivated')),
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- ══════════════════════════════════════════════════════════════
-- 1B. Rewrite signup trigger — BLOCK admin self-signup
--     Doctors start as pending_approval
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role TEXT;
  _status TEXT;
BEGIN
  -- Extract requested role, default to patient
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');

  -- SECURITY: Never allow self-signup as admin
  IF _role = 'admin' THEN
    _role := 'patient';
  END IF;

  -- Doctors require approval; patients are active immediately
  IF _role = 'doctor' THEN
    _status := 'pending_approval';
  ELSE
    _status := 'active';
  END IF;

  -- Create base profile
  INSERT INTO public.profiles (id, email, full_name, role, account_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _role,
    _status
  );

  -- Auto-create role-specific profile
  IF _role = 'doctor' THEN
    INSERT INTO public.doctor_profiles (profile_id) VALUES (NEW.id);
  ELSIF _role = 'patient' THEN
    INSERT INTO public.patient_profiles (profile_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- 1C. Helper function — get_user_role (improved, no caching issues)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is active
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND account_status = 'active'
      AND deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ══════════════════════════════════════════════════════════════
-- 1D. Drop & recreate unsafe RLS policies
-- ══════════════════════════════════════════════════════════════

-- ── PROFILES RLS (rewrite) ──
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can read patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "profiles_select_doctor_sees_patients"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'doctor' AND role = 'patient');

-- Users can update own profile but CANNOT change role or account_status
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND account_status = (SELECT account_status FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (true);

CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- ── APPOINTMENTS RLS (rewrite) ──
DROP POLICY IF EXISTS "Patients see own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors see own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins see all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;

CREATE POLICY "appointments_select_patient"
  ON public.appointments FOR SELECT
  USING (patient_id = auth.uid() AND public.is_active_user());

CREATE POLICY "appointments_select_doctor"
  ON public.appointments FOR SELECT
  USING (doctor_id = auth.uid() AND public.is_active_user());

CREATE POLICY "appointments_select_admin"
  ON public.appointments FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "appointments_insert_patient"
  ON public.appointments FOR INSERT
  WITH CHECK (
    patient_id = auth.uid()
    AND public.get_user_role() = 'patient'
    AND public.is_active_user()
  );

CREATE POLICY "appointments_insert_admin"
  ON public.appointments FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- Doctors can only update status and notes on their own appointments
CREATE POLICY "appointments_update_doctor"
  ON public.appointments FOR UPDATE
  USING (doctor_id = auth.uid() AND public.is_active_user())
  WITH CHECK (doctor_id = auth.uid());

-- Patients can only cancel their own appointments
CREATE POLICY "appointments_update_patient_cancel"
  ON public.appointments FOR UPDATE
  USING (patient_id = auth.uid() AND public.is_active_user())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "appointments_update_admin"
  ON public.appointments FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (true);

CREATE POLICY "appointments_delete_admin"
  ON public.appointments FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ── INVOICES RLS (rewrite — CRITICAL: remove patient update) ──
DROP POLICY IF EXISTS "Patients see own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Patients can update own invoices for payment" ON public.invoices;

CREATE POLICY "invoices_select_patient"
  ON public.invoices FOR SELECT
  USING (patient_id = auth.uid() AND public.is_active_user());

CREATE POLICY "invoices_select_admin"
  ON public.invoices FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "invoices_insert_admin"
  ON public.invoices FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "invoices_update_admin"
  ON public.invoices FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "invoices_delete_admin"
  ON public.invoices FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ── DOCTOR PROFILES RLS (rewrite) ──
DROP POLICY IF EXISTS "Doctors can read own doctor_profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admins can manage doctor_profiles" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Patients can view doctors" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can update own doctor_profile" ON public.doctor_profiles;

CREATE POLICY "doctor_profiles_select_own"
  ON public.doctor_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "doctor_profiles_select_admin"
  ON public.doctor_profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "doctor_profiles_select_patients"
  ON public.doctor_profiles FOR SELECT
  USING (public.get_user_role() = 'patient');

CREATE POLICY "doctor_profiles_update_own"
  ON public.doctor_profiles FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());  -- Cannot change profile_id

CREATE POLICY "doctor_profiles_update_admin"
  ON public.doctor_profiles FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (true);

CREATE POLICY "doctor_profiles_insert_admin"
  ON public.doctor_profiles FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- ── PATIENT PROFILES RLS (rewrite) ──
DROP POLICY IF EXISTS "Patients can read own patient_profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Admins can manage patient_profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Doctors can read patient_profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can update own patient_profile" ON public.patient_profiles;

CREATE POLICY "patient_profiles_select_own"
  ON public.patient_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "patient_profiles_select_admin"
  ON public.patient_profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "patient_profiles_select_doctor"
  ON public.patient_profiles FOR SELECT
  USING (public.get_user_role() = 'doctor');

CREATE POLICY "patient_profiles_update_own"
  ON public.patient_profiles FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "patient_profiles_update_admin"
  ON public.patient_profiles FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (true);

-- ── PRESCRIPTIONS RLS (rewrite) ──
DROP POLICY IF EXISTS "Patients see own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors see own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Admins see all prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can update own prescriptions" ON public.prescriptions;

CREATE POLICY "prescriptions_select_patient"
  ON public.prescriptions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "prescriptions_select_doctor"
  ON public.prescriptions FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "prescriptions_select_admin"
  ON public.prescriptions FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "prescriptions_insert_doctor"
  ON public.prescriptions FOR INSERT
  WITH CHECK (doctor_id = auth.uid() AND public.get_user_role() = 'doctor');

CREATE POLICY "prescriptions_insert_admin"
  ON public.prescriptions FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "prescriptions_update_doctor"
  ON public.prescriptions FOR UPDATE
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "prescriptions_update_admin"
  ON public.prescriptions FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (true);

-- ── LAB REPORTS RLS (rewrite) ──
DROP POLICY IF EXISTS "Patients see own lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Doctors see ordered lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Admins manage lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Doctors can create lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Doctors can update ordered lab reports" ON public.lab_reports;

CREATE POLICY "lab_reports_select_patient"
  ON public.lab_reports FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "lab_reports_select_doctor"
  ON public.lab_reports FOR SELECT
  USING (ordered_by = auth.uid());

CREATE POLICY "lab_reports_select_admin"
  ON public.lab_reports FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "lab_reports_insert_doctor"
  ON public.lab_reports FOR INSERT
  WITH CHECK (ordered_by = auth.uid() AND public.get_user_role() = 'doctor');

CREATE POLICY "lab_reports_insert_admin"
  ON public.lab_reports FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "lab_reports_update_doctor"
  ON public.lab_reports FOR UPDATE
  USING (ordered_by = auth.uid())
  WITH CHECK (ordered_by = auth.uid());

CREATE POLICY "lab_reports_update_admin"
  ON public.lab_reports FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (true);

-- ── VIDEO SESSIONS RLS (rewrite) ──
DROP POLICY IF EXISTS "Patients see own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Doctors see own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Admins manage video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Patients can create video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Doctors can update own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Patients can update own video sessions" ON public.video_sessions;

CREATE POLICY "video_sessions_select_patient"
  ON public.video_sessions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "video_sessions_select_doctor"
  ON public.video_sessions FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "video_sessions_select_admin"
  ON public.video_sessions FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Only doctors/admin can create sessions
CREATE POLICY "video_sessions_insert_doctor"
  ON public.video_sessions FOR INSERT
  WITH CHECK (doctor_id = auth.uid() AND public.get_user_role() = 'doctor');

CREATE POLICY "video_sessions_insert_admin"
  ON public.video_sessions FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "video_sessions_update_doctor"
  ON public.video_sessions FOR UPDATE
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "video_sessions_update_patient"
  ON public.video_sessions FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "video_sessions_update_admin"
  ON public.video_sessions FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (true);

-- ── NOTIFICATIONS RLS (rewrite) ──
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin"
  ON public.notifications FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "notifications_select_admin"
  ON public.notifications FOR SELECT
  USING (public.get_user_role() = 'admin');

DO $$ BEGIN RAISE NOTICE '✅ Migration 001 complete: Critical security fixes applied'; END $$;
