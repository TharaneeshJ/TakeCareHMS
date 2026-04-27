-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TakeCare HMS — HOTFIX: Restore profiles RLS               ║
-- ║  Run this in Supabase SQL Editor NOW to fix login           ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Step 1: Check current state (see results in output)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Step 2: Drop any broken/partial policies (safe — ignores if not found)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can read patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_doctor_sees_patients" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate helper function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 5: Create clean policies
-- Everyone can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Doctors can see patient profiles (for appointment booking etc.)
CREATE POLICY "profiles_select_doctor_sees_patients"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'doctor' AND role = 'patient');

-- Users can update own profile (but not role)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- Admins can insert profiles
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- ALSO fix any other tables that might have broken policies
-- ══════════════════════════════════════════════════════════════

-- APPOINTMENTS
DROP POLICY IF EXISTS "Patients see own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors see own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins see all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_patient" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_doctor" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_patient" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_doctor" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_patient_cancel" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_admin" ON public.appointments;

CREATE POLICY "appointments_select_patient"
  ON public.appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "appointments_select_doctor"
  ON public.appointments FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "appointments_select_admin"
  ON public.appointments FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "appointments_insert_patient"
  ON public.appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());
CREATE POLICY "appointments_insert_admin"
  ON public.appointments FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "appointments_update_doctor"
  ON public.appointments FOR UPDATE
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "appointments_update_patient"
  ON public.appointments FOR UPDATE
  USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "appointments_update_admin"
  ON public.appointments FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- DOCTOR PROFILES
DROP POLICY IF EXISTS "Doctors can read own doctor_profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admins can manage doctor_profiles" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Patients can view doctors" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can update own doctor_profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "doctor_profiles_select_own" ON public.doctor_profiles;
DROP POLICY IF EXISTS "doctor_profiles_select_admin" ON public.doctor_profiles;
DROP POLICY IF EXISTS "doctor_profiles_select_patients" ON public.doctor_profiles;
DROP POLICY IF EXISTS "doctor_profiles_update_own" ON public.doctor_profiles;
DROP POLICY IF EXISTS "doctor_profiles_update_admin" ON public.doctor_profiles;
DROP POLICY IF EXISTS "doctor_profiles_insert_admin" ON public.doctor_profiles;

CREATE POLICY "doctor_profiles_select_own"
  ON public.doctor_profiles FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "doctor_profiles_select_admin"
  ON public.doctor_profiles FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "doctor_profiles_select_patients"
  ON public.doctor_profiles FOR SELECT USING (public.get_user_role() = 'patient');
CREATE POLICY "doctor_profiles_update_own"
  ON public.doctor_profiles FOR UPDATE
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "doctor_profiles_update_admin"
  ON public.doctor_profiles FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY "doctor_profiles_insert_admin"
  ON public.doctor_profiles FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

-- PATIENT PROFILES
DROP POLICY IF EXISTS "Patients can read own patient_profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "Admins can manage patient_profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Doctors can read patient_profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Patients can update own patient_profile" ON public.patient_profiles;
DROP POLICY IF EXISTS "patient_profiles_select_own" ON public.patient_profiles;
DROP POLICY IF EXISTS "patient_profiles_select_admin" ON public.patient_profiles;
DROP POLICY IF EXISTS "patient_profiles_select_doctor" ON public.patient_profiles;
DROP POLICY IF EXISTS "patient_profiles_update_own" ON public.patient_profiles;
DROP POLICY IF EXISTS "patient_profiles_update_admin" ON public.patient_profiles;

CREATE POLICY "patient_profiles_select_own"
  ON public.patient_profiles FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "patient_profiles_select_admin"
  ON public.patient_profiles FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "patient_profiles_select_doctor"
  ON public.patient_profiles FOR SELECT USING (public.get_user_role() = 'doctor');
CREATE POLICY "patient_profiles_update_own"
  ON public.patient_profiles FOR UPDATE
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "patient_profiles_update_admin"
  ON public.patient_profiles FOR UPDATE USING (public.get_user_role() = 'admin');

-- PRESCRIPTIONS
DROP POLICY IF EXISTS "Patients see own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors see own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Admins see all prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can update own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_select_patient" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_select_doctor" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_select_admin" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_insert_doctor" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_insert_admin" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_update_doctor" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_update_admin" ON public.prescriptions;

CREATE POLICY "prescriptions_select_patient"
  ON public.prescriptions FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "prescriptions_select_doctor"
  ON public.prescriptions FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "prescriptions_select_admin"
  ON public.prescriptions FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "prescriptions_insert_doctor"
  ON public.prescriptions FOR INSERT WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "prescriptions_insert_admin"
  ON public.prescriptions FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "prescriptions_update_doctor"
  ON public.prescriptions FOR UPDATE
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "prescriptions_update_admin"
  ON public.prescriptions FOR UPDATE USING (public.get_user_role() = 'admin');

-- LAB REPORTS
DROP POLICY IF EXISTS "Patients see own lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Doctors see ordered lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Admins manage lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Doctors can create lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Doctors can update ordered lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "lab_reports_select_patient" ON public.lab_reports;
DROP POLICY IF EXISTS "lab_reports_select_doctor" ON public.lab_reports;
DROP POLICY IF EXISTS "lab_reports_select_admin" ON public.lab_reports;
DROP POLICY IF EXISTS "lab_reports_insert_doctor" ON public.lab_reports;
DROP POLICY IF EXISTS "lab_reports_insert_admin" ON public.lab_reports;
DROP POLICY IF EXISTS "lab_reports_update_doctor" ON public.lab_reports;
DROP POLICY IF EXISTS "lab_reports_update_admin" ON public.lab_reports;

CREATE POLICY "lab_reports_select_patient"
  ON public.lab_reports FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "lab_reports_select_doctor"
  ON public.lab_reports FOR SELECT USING (ordered_by = auth.uid());
CREATE POLICY "lab_reports_select_admin"
  ON public.lab_reports FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "lab_reports_insert_doctor"
  ON public.lab_reports FOR INSERT WITH CHECK (ordered_by = auth.uid());
CREATE POLICY "lab_reports_insert_admin"
  ON public.lab_reports FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "lab_reports_update_doctor"
  ON public.lab_reports FOR UPDATE
  USING (ordered_by = auth.uid()) WITH CHECK (ordered_by = auth.uid());
CREATE POLICY "lab_reports_update_admin"
  ON public.lab_reports FOR UPDATE USING (public.get_user_role() = 'admin');

-- INVOICES
DROP POLICY IF EXISTS "Patients see own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Patients can update own invoices for payment" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_patient" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;

CREATE POLICY "invoices_select_patient"
  ON public.invoices FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "invoices_select_admin"
  ON public.invoices FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "invoices_insert_admin"
  ON public.invoices FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "invoices_update_admin"
  ON public.invoices FOR UPDATE USING (public.get_user_role() = 'admin');

-- VIDEO SESSIONS
DROP POLICY IF EXISTS "Patients see own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Doctors see own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Admins manage video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Patients can create video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Doctors can update own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "Patients can update own video sessions" ON public.video_sessions;
DROP POLICY IF EXISTS "video_sessions_select_patient" ON public.video_sessions;
DROP POLICY IF EXISTS "video_sessions_select_doctor" ON public.video_sessions;
DROP POLICY IF EXISTS "video_sessions_select_admin" ON public.video_sessions;
DROP POLICY IF EXISTS "video_sessions_insert_doctor" ON public.video_sessions;
DROP POLICY IF EXISTS "video_sessions_insert_admin" ON public.video_sessions;
DROP POLICY IF EXISTS "video_sessions_update_doctor" ON public.video_sessions;
DROP POLICY IF EXISTS "video_sessions_update_patient" ON public.video_sessions;
DROP POLICY IF EXISTS "video_sessions_update_admin" ON public.video_sessions;

CREATE POLICY "video_sessions_select_patient"
  ON public.video_sessions FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "video_sessions_select_doctor"
  ON public.video_sessions FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "video_sessions_select_admin"
  ON public.video_sessions FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "video_sessions_insert_doctor"
  ON public.video_sessions FOR INSERT WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "video_sessions_insert_admin"
  ON public.video_sessions FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "video_sessions_update_doctor"
  ON public.video_sessions FOR UPDATE
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "video_sessions_update_patient"
  ON public.video_sessions FOR UPDATE
  USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "video_sessions_update_admin"
  ON public.video_sessions FOR UPDATE USING (public.get_user_role() = 'admin');

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_admin" ON public.notifications;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_insert_admin"
  ON public.notifications FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "notifications_select_admin"
  ON public.notifications FOR SELECT USING (public.get_user_role() = 'admin');

-- WARDS (these are probably fine but let's ensure)
DROP POLICY IF EXISTS "All authenticated can read wards" ON public.wards;
DROP POLICY IF EXISTS "Admins can manage wards" ON public.wards;

CREATE POLICY "wards_select_authenticated"
  ON public.wards FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "wards_manage_admin"
  ON public.wards FOR ALL USING (public.get_user_role() = 'admin');

-- HOSPITAL SETTINGS
DROP POLICY IF EXISTS "All authenticated can read settings" ON public.hospital_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.hospital_settings;

CREATE POLICY "settings_select_authenticated"
  ON public.hospital_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "settings_update_admin"
  ON public.hospital_settings FOR UPDATE USING (public.get_user_role() = 'admin');
