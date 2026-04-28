-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TakeCare HMS — HOTFIX: Allow patients to see doctors      ║
-- ║  Run this in Supabase SQL Editor to fix the missing docs    ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Patients must be able to see doctor profiles to book appointments
CREATE POLICY "profiles_select_patient_sees_doctors"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'patient' AND role = 'doctor');

-- Also ensure patients can read active doctors from doctor_profiles if needed
-- (There's already a policy "doctor_profiles_select_patients", so that's covered)
