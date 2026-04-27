-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TakeCare HMS — Migration 004: Storage & Final Setup       ║
-- ║  Run AFTER migration 003                                   ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════════
-- 4A. SUPABASE STORAGE BUCKETS
-- ══════════════════════════════════════════════════════════════
-- Run these in Supabase Dashboard > Storage, or via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, -- 2MB
    ARRAY['image/jpeg','image/png','image/webp']),
  ('lab-reports', 'lab-reports', false, 10485760, -- 10MB
    ARRAY['application/pdf','image/jpeg','image/png']),
  ('prescriptions', 'prescriptions', false, 5242880, -- 5MB
    ARRAY['application/pdf','image/jpeg','image/png']),
  ('invoices', 'invoices', false, 5242880,
    ARRAY['application/pdf']),
  ('documents', 'documents', false, 20971520, -- 20MB
    ARRAY['application/pdf','image/jpeg','image/png','image/webp',
          'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('certificates', 'certificates', false, 10485760,
    ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 4B. STORAGE RLS POLICIES
-- ══════════════════════════════════════════════════════════════

-- Avatars: public read, user uploads own
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Lab reports: patient sees own, doctor sees ordered, admin sees all
CREATE POLICY "lab_reports_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lab-reports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.get_user_role() = 'admin'
      OR public.get_user_role() = 'doctor'
    )
  );

CREATE POLICY "lab_reports_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lab-reports'
    AND (public.get_user_role() IN ('doctor', 'admin'))
  );

-- Prescriptions: patient sees own, doctor/admin manages
CREATE POLICY "prescriptions_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'prescriptions'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.get_user_role() IN ('doctor', 'admin')
    )
  );

CREATE POLICY "prescriptions_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'prescriptions'
    AND public.get_user_role() IN ('doctor', 'admin')
  );

-- Documents: owner access + admin
CREATE POLICY "documents_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.get_user_role() = 'admin'
    )
  );

CREATE POLICY "documents_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
  );

-- Invoices: patient + admin
CREATE POLICY "invoices_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.get_user_role() = 'admin'
    )
  );

CREATE POLICY "invoices_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices'
    AND public.get_user_role() = 'admin'
  );

-- Certificates: doctor uploads own, admin sees all
CREATE POLICY "certificates_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.get_user_role() = 'admin'
    )
  );

CREATE POLICY "certificates_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND public.get_user_role() = 'doctor'
  );

-- ══════════════════════════════════════════════════════════════
-- 4C. STORAGE NAMING CONVENTION
-- ══════════════════════════════════════════════════════════════
/*
  Bucket Structure:
  
  avatars/
    {user_id}/avatar.jpg

  lab-reports/
    {patient_id}/{report_id}.pdf

  prescriptions/
    {patient_id}/{prescription_id}.pdf

  invoices/
    {patient_id}/{invoice_number}.pdf

  documents/
    {user_id}/{filename}

  certificates/
    {doctor_id}/{cert_name}.pdf
*/

-- ══════════════════════════════════════════════════════════════
-- 4D. DATABASE VIEWS for reporting (admin dashboard)
-- ══════════════════════════════════════════════════════════════

-- Daily revenue summary
CREATE OR REPLACE VIEW public.v_daily_revenue AS
SELECT
  i.date,
  COUNT(*) AS invoice_count,
  SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) AS collected,
  SUM(CASE WHEN i.status = 'pending' THEN i.amount ELSE 0 END) AS pending,
  SUM(CASE WHEN i.status = 'overdue' THEN i.amount ELSE 0 END) AS overdue,
  SUM(i.amount) AS total
FROM public.invoices i
WHERE i.deleted_at IS NULL
GROUP BY i.date
ORDER BY i.date DESC;

-- Doctor workload summary
CREATE OR REPLACE VIEW public.v_doctor_workload AS
SELECT
  p.id AS doctor_id,
  p.full_name,
  dp.specialization,
  dp.department,
  COUNT(a.id) FILTER (WHERE a.date = CURRENT_DATE) AS today_appointments,
  COUNT(a.id) FILTER (WHERE a.date = CURRENT_DATE AND a.status = 'completed') AS today_completed,
  COUNT(a.id) FILTER (WHERE a.status = 'scheduled' AND a.date >= CURRENT_DATE) AS upcoming,
  dp.is_available
FROM public.profiles p
JOIN public.doctor_profiles dp ON dp.profile_id = p.id
LEFT JOIN public.appointments a ON a.doctor_id = p.id AND a.deleted_at IS NULL
WHERE p.role = 'doctor'
GROUP BY p.id, p.full_name, dp.specialization, dp.department, dp.is_available;

-- Ward occupancy summary
CREATE OR REPLACE VIEW public.v_ward_occupancy AS
SELECT
  id, name, floor, ward_type,
  total_beds, occupied_beds,
  total_beds - occupied_beds AS available_beds,
  ROUND((occupied_beds::NUMERIC / NULLIF(total_beds, 0)) * 100, 1) AS occupancy_pct
FROM public.wards;

-- ══════════════════════════════════════════════════════════════
-- 4E. GRANT access to views
-- ══════════════════════════════════════════════════════════════
GRANT SELECT ON public.v_daily_revenue TO authenticated;
GRANT SELECT ON public.v_doctor_workload TO authenticated;
GRANT SELECT ON public.v_ward_occupancy TO authenticated;

DO $$ BEGIN RAISE NOTICE '✅ Migration 004 complete: Storage and reporting ready'; END $$;

-- ══════════════════════════════════════════════════════════════
-- SUPABASE DASHBOARD SETTINGS REQUIRED
-- ══════════════════════════════════════════════════════════════
/*
  After running all migrations, configure in Supabase Dashboard:

  1. Authentication > Settings:
     - Enable "Confirm email" 
     - Set Site URL to your frontend URL
     - Add redirect URLs for auth callback

  2. Authentication > Email Templates:
     - Customize confirmation email with TakeCare HMS branding

  3. Database > Replication:
     - Verify these tables are in supabase_realtime:
       appointments, notifications, video_sessions, payments, consultation_notes

  4. Storage:
     - Verify all 6 buckets created (avatars, lab-reports, prescriptions, invoices, documents, certificates)
     - avatars bucket should be PUBLIC
     - All others should be PRIVATE

  5. Edge Functions (optional future):
     - Payment gateway webhook handler
     - Email notification sender
     - PDF invoice generator
*/
