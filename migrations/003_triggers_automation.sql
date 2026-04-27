-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TakeCare HMS — Migration 003: Triggers & Automation       ║
-- ║  Run AFTER migration 002                                   ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════════
-- 3A. UNIVERSAL updated_at TRIGGER
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','doctor_profiles','departments','appointments',
    'prescriptions','lab_reports','invoices','video_sessions',
    'consultation_notes'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I;
       CREATE TRIGGER %I BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();',
      tbl || '_updated_at', tbl,
      tbl || '_updated_at', tbl
    );
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 3B. INVOICE NUMBER GENERATION
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  _year TEXT;
  _seq INTEGER;
BEGIN
  _year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO _seq
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || _year || '-%';

  NEW.invoice_number := 'INV-' || _year || '-' || LPAD(_seq::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_generate_number ON public.invoices;
CREATE TRIGGER invoices_generate_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_invoice_number();

-- ══════════════════════════════════════════════════════════════
-- 3C. AUTO-CREATE NOTIFICATION on appointment booking
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  _patient_name TEXT;
  _doctor_name TEXT;
BEGIN
  SELECT full_name INTO _patient_name FROM public.profiles WHERE id = NEW.patient_id;
  SELECT full_name INTO _doctor_name FROM public.profiles WHERE id = NEW.doctor_id;

  -- Notify the doctor
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.doctor_id,
    'New Appointment',
    _patient_name || ' booked an appointment on ' || NEW.date || ' at ' || NEW.time,
    'info',
    '/doctor/appointments'
  );

  -- Notify the patient (confirmation)
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.patient_id,
    'Appointment Confirmed',
    'Your appointment with Dr. ' || _doctor_name || ' on ' || NEW.date || ' at ' || NEW.time || ' is confirmed.',
    'success',
    '/patient/appointments'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_created ON public.appointments;
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_created();

-- ══════════════════════════════════════════════════════════════
-- 3D. NOTIFY on appointment cancellation
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_appointment_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  _name TEXT;
  _target_id UUID;
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Determine who cancelled and notify the other party
    IF auth.uid() = NEW.patient_id THEN
      SELECT full_name INTO _name FROM public.profiles WHERE id = NEW.patient_id;
      _target_id := NEW.doctor_id;
    ELSE
      SELECT full_name INTO _name FROM public.profiles WHERE id = NEW.doctor_id;
      _target_id := NEW.patient_id;
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      _target_id,
      'Appointment Cancelled',
      _name || ' cancelled the appointment on ' || NEW.date,
      'warning',
      CASE WHEN _target_id = NEW.doctor_id THEN '/doctor/appointments' ELSE '/patient/appointments' END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_cancelled ON public.appointments;
CREATE TRIGGER on_appointment_cancelled
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_cancelled();

-- ══════════════════════════════════════════════════════════════
-- 3E. AUTO-CREATE VIDEO SESSION for video appointments
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.auto_create_video_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'Video Consultation' THEN
    INSERT INTO public.video_sessions (
      appointment_id, patient_id, doctor_id,
      scheduled_at, room_id, status
    ) VALUES (
      NEW.id, NEW.patient_id, NEW.doctor_id,
      (NEW.date || ' ' || NEW.time)::TIMESTAMPTZ,
      'room-' || SUBSTRING(NEW.id::TEXT, 1, 8),
      'scheduled'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_video_appointment_created ON public.appointments;
CREATE TRIGGER on_video_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_video_session();

-- ══════════════════════════════════════════════════════════════
-- 3F. PAYMENT CONFIRMATION — update invoice status
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.on_payment_completed()
RETURNS TRIGGER AS $$
DECLARE
  _total_paid NUMERIC;
  _invoice_amount NUMERIC;
BEGIN
  IF NEW.status = 'completed' THEN
    -- Sum all completed payments for this invoice
    SELECT COALESCE(SUM(amount), 0) INTO _total_paid
    FROM public.payments
    WHERE invoice_id = NEW.invoice_id AND status = 'completed';

    SELECT amount INTO _invoice_amount
    FROM public.invoices WHERE id = NEW.invoice_id;

    -- Update invoice status
    IF _total_paid >= _invoice_amount THEN
      UPDATE public.invoices
      SET status = 'paid', paid_at = now(), payment_method = NEW.payment_method
      WHERE id = NEW.invoice_id;
    END IF;

    -- Notify patient
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.patient_id,
      'Payment Received',
      'Payment of ₹' || NEW.amount || ' received. Thank you!',
      'success',
      '/patient/bills'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payment_completed ON public.payments;
CREATE TRIGGER on_payment_completed
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.on_payment_completed();

-- ══════════════════════════════════════════════════════════════
-- 3G. AUDIT LOG TRIGGER (generic)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'appointments','invoices','prescriptions','payments',
    'video_sessions','profiles'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS audit_%I ON public.%I;
       CREATE TRIGGER audit_%I
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 3H. SAFE BUSINESS LOGIC FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Doctor approval workflow
CREATE OR REPLACE FUNCTION public.approve_doctor(p_doctor_id UUID)
RETURNS VOID AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Only admins can approve doctors';
  END IF;

  UPDATE public.profiles
  SET account_status = 'active', is_verified = true, verified_at = now()
  WHERE id = p_doctor_id AND role = 'doctor';

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    p_doctor_id,
    'Account Approved',
    'Your doctor account has been verified and activated. Welcome to TakeCare HMS!',
    'success',
    '/doctor/dashboard'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspend account
CREATE OR REPLACE FUNCTION public.suspend_account(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Only admins can suspend accounts';
  END IF;

  UPDATE public.profiles
  SET account_status = 'suspended'
  WHERE id = p_user_id;

  INSERT INTO public.activity_log (user_id, action, description)
  VALUES (auth.uid(), 'suspend_account', 'Suspended user ' || p_user_id || '. Reason: ' || COALESCE(p_reason, 'N/A'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe appointment cancellation
CREATE OR REPLACE FUNCTION public.cancel_appointment(
  p_appointment_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  _appt RECORD;
BEGIN
  SELECT * INTO _appt FROM public.appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Check ownership
  IF auth.uid() NOT IN (_appt.patient_id, _appt.doctor_id)
     AND public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to cancel this appointment';
  END IF;

  IF _appt.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel a % appointment', _appt.status;
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled', cancelled_reason = p_reason
  WHERE id = p_appointment_id;

  -- Also cancel linked video session
  UPDATE public.video_sessions
  SET status = 'cancelled'
  WHERE appointment_id = p_appointment_id AND status != 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete consultation
CREATE OR REPLACE FUNCTION public.complete_consultation(
  p_appointment_id UUID,
  p_diagnosis TEXT DEFAULT NULL,
  p_treatment_plan TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_follow_up_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  _appt RECORD;
  _note_id UUID;
BEGIN
  SELECT * INTO _appt FROM public.appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF auth.uid() != _appt.doctor_id AND public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Only the assigned doctor can complete this consultation';
  END IF;

  -- Update appointment status
  UPDATE public.appointments
  SET status = 'completed'
  WHERE id = p_appointment_id;

  -- Create consultation note
  INSERT INTO public.consultation_notes (
    appointment_id, doctor_id, patient_id,
    diagnosis, treatment_plan, notes, follow_up_date
  ) VALUES (
    p_appointment_id, _appt.doctor_id, _appt.patient_id,
    p_diagnosis, p_treatment_plan, p_notes, p_follow_up_date
  )
  RETURNING id INTO _note_id;

  -- Complete linked video session
  UPDATE public.video_sessions
  SET status = 'completed', ended_at = now()
  WHERE appointment_id = p_appointment_id AND status IN ('in_progress', 'waiting', 'scheduled');

  RETURN _note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ Migration 003 complete: Triggers and automation deployed'; END $$;
