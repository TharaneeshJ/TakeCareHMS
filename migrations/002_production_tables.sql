-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TakeCare HMS — Migration 002: New Production Tables       ║
-- ║  Run AFTER migration 001                                   ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════════
-- 2A. DEPARTMENTS (normalize doctor_profiles.department)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.departments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  head_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.departments (name) VALUES
  ('General'),('Cardiology'),('Neurology'),('Orthopedics'),
  ('Oncology'),('Pediatrics'),('Maternity'),('ICU'),('Emergency')
ON CONFLICT (name) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 2B. ADMIN PROFILES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  designation   TEXT NOT NULL DEFAULT 'System Administrator',
  permissions   JSONB NOT NULL DEFAULT '["all"]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_profiles_select_own"
  ON public.admin_profiles FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "admin_profiles_select_admin"
  ON public.admin_profiles FOR ALL USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- 2C. DOCTOR AVAILABILITY / SCHEDULES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  slot_duration INTEGER NOT NULL DEFAULT 30, -- minutes
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_doctor_day UNIQUE (doctor_id, day_of_week)
);

CREATE INDEX idx_doctor_schedules_doctor ON public.doctor_schedules(doctor_id);

ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor_schedules_select_all"
  ON public.doctor_schedules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "doctor_schedules_manage_own"
  ON public.doctor_schedules FOR ALL
  USING (doctor_id = auth.uid() AND public.get_user_role() = 'doctor');
CREATE POLICY "doctor_schedules_manage_admin"
  ON public.doctor_schedules FOR ALL
  USING (public.get_user_role() = 'admin');

-- Doctor blocked dates (leaves, holidays)
CREATE TABLE IF NOT EXISTS public.doctor_blocked_dates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_doctor_blocked UNIQUE (doctor_id, blocked_date)
);

ALTER TABLE public.doctor_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_dates_select_all"
  ON public.doctor_blocked_dates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "blocked_dates_manage_own"
  ON public.doctor_blocked_dates FOR ALL
  USING (doctor_id = auth.uid() AND public.get_user_role() = 'doctor');
CREATE POLICY "blocked_dates_manage_admin"
  ON public.doctor_blocked_dates FOR ALL
  USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- 2D. EMERGENCY CONTACTS (normalize from patient_profiles)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_name  TEXT NOT NULL,
  relationship  TEXT NOT NULL,
  phone         TEXT NOT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_contacts_patient ON public.emergency_contacts(patient_id);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergency_contacts_select_own"
  ON public.emergency_contacts FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "emergency_contacts_manage_own"
  ON public.emergency_contacts FOR ALL
  USING (patient_id = auth.uid() AND public.get_user_role() = 'patient');
CREATE POLICY "emergency_contacts_select_doctor"
  ON public.emergency_contacts FOR SELECT
  USING (public.get_user_role() = 'doctor');
CREATE POLICY "emergency_contacts_manage_admin"
  ON public.emergency_contacts FOR ALL
  USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- 2E. CONSULTATION NOTES (post-appointment clinical notes)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.consultation_notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chief_complaint TEXT,
  diagnosis       TEXT,
  examination     TEXT,
  treatment_plan  TEXT,
  follow_up_date  DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_note_per_appointment UNIQUE (appointment_id)
);

CREATE INDEX idx_consultation_notes_doctor ON public.consultation_notes(doctor_id);
CREATE INDEX idx_consultation_notes_patient ON public.consultation_notes(patient_id);

ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultation_notes_select_patient"
  ON public.consultation_notes FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "consultation_notes_select_doctor"
  ON public.consultation_notes FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "consultation_notes_select_admin"
  ON public.consultation_notes FOR SELECT
  USING (public.get_user_role() = 'admin');
CREATE POLICY "consultation_notes_insert_doctor"
  ON public.consultation_notes FOR INSERT
  WITH CHECK (doctor_id = auth.uid() AND public.get_user_role() = 'doctor');
CREATE POLICY "consultation_notes_update_doctor"
  ON public.consultation_notes FOR UPDATE
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "consultation_notes_manage_admin"
  ON public.consultation_notes FOR ALL
  USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- 2F. INVOICE LINE ITEMS (normalize invoices)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'consultation'
              CHECK (category IN ('consultation','lab','pharmacy','procedure','room','other')),
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_select_patient"
  ON public.invoice_line_items FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.invoices WHERE id = invoice_id AND patient_id = auth.uid()
  ));
CREATE POLICY "invoice_items_select_admin"
  ON public.invoice_line_items FOR SELECT
  USING (public.get_user_role() = 'admin');
CREATE POLICY "invoice_items_manage_admin"
  ON public.invoice_line_items FOR ALL
  USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- 2G. PAYMENTS & TRANSACTIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method  TEXT NOT NULL DEFAULT 'cash'
                  CHECK (payment_method IN ('cash','card','upi','net_banking','insurance','other')),
  transaction_ref TEXT,
  status          TEXT NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('pending','completed','failed','refunded')),
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_patient ON public.payments(patient_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_patient"
  ON public.payments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "payments_select_admin"
  ON public.payments FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "payments_manage_admin"
  ON public.payments FOR ALL USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- 2H. AUDIT LOG
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,  -- 'create','update','delete','login','logout'
  table_name  TEXT,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_log_select_admin"
  ON public.audit_log FOR SELECT USING (public.get_user_role() = 'admin');
-- Service role inserts (no user-facing INSERT policy)

-- ══════════════════════════════════════════════════════════════
-- 2I. ACTIVITY LOG (user actions — lighter than audit_log)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  description TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select_own"
  ON public.activity_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "activity_log_select_admin"
  ON public.activity_log FOR SELECT USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- 2J. FILE UPLOADS (track all uploaded documents)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,   -- 'lab_report','prescription','avatar','certificate','document'
  file_size     INTEGER,
  storage_path  TEXT NOT NULL,   -- supabase storage path
  bucket_name   TEXT NOT NULL DEFAULT 'documents',
  mime_type     TEXT,
  description   TEXT,
  is_public     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_file_uploads_patient ON public.file_uploads(patient_id);
CREATE INDEX idx_file_uploads_uploader ON public.file_uploads(uploaded_by);

ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_uploads_select_own"
  ON public.file_uploads FOR SELECT USING (uploaded_by = auth.uid());
CREATE POLICY "file_uploads_select_patient"
  ON public.file_uploads FOR SELECT
  USING (patient_id = auth.uid());
CREATE POLICY "file_uploads_select_admin"
  ON public.file_uploads FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "file_uploads_insert_authenticated"
  ON public.file_uploads FOR INSERT
  WITH CHECK (uploaded_by = auth.uid() AND auth.uid() IS NOT NULL);
CREATE POLICY "file_uploads_manage_admin"
  ON public.file_uploads FOR ALL USING (public.get_user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════
-- 2K. SOFT DELETE COLUMNS on existing tables
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.lab_reports
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.video_sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ══════════════════════════════════════════════════════════════
-- 2L. MISSING INDEXES & CONSTRAINTS
-- ══════════════════════════════════════════════════════════════
-- Prevent double-booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_appointment_slot
  ON public.appointments(doctor_id, date, time)
  WHERE status NOT IN ('cancelled') AND deleted_at IS NULL;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON public.appointments(doctor_id, date);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_date
  ON public.appointments(patient_id, date);

CREATE INDEX IF NOT EXISTS idx_video_sessions_scheduled
  ON public.video_sessions(scheduled_at);

-- Amount validation (conditionally add if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_invoice_amount') THEN
    ALTER TABLE public.invoices ADD CONSTRAINT chk_invoice_amount CHECK (amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_experience_years') THEN
    ALTER TABLE public.doctor_profiles ADD CONSTRAINT chk_experience_years CHECK (experience_years >= 0);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 2M. REALTIME — add new key tables
-- ══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_notes;

DO $$ BEGIN RAISE NOTICE '✅ Migration 002 complete: Production tables created'; END $$;
