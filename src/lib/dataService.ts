/**
 * TakeCare HMS — Supabase Data Service
 * Central data access layer replacing all mock data imports.
 */
import { supabase } from './supabase';
import type {
  Profile, DoctorProfile, PatientProfile,
  Ward, Appointment, Prescription, LabReport,
  Invoice, InvoiceLineItem, VideoSession, Notification, HospitalSettings,
  Payment, ConsultationNote, DoctorSchedule, Department,
  EmergencyContact, AuditLog, ActivityLog, FileUpload,
} from './database.types';

// ── Helper ──
function handleError(error: unknown, context: string) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, msg);
  return [];
}

// ══════════════════════════════════════════════════
// PROFILES
// ══════════════════════════════════════════════════
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single();
  if (error) { console.error('getProfile:', error.message); return null; }
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { error } = await supabase
    .from('profiles').update(updates).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function getAllProfiles(role?: string): Promise<Profile[]> {
  let q = supabase.from('profiles').select('*').order('full_name');
  if (role) q = q.eq('role', role);
  const { data, error } = await q;
  if (error) return handleError(error, 'getAllProfiles') as Profile[];
  return (data ?? []) as Profile[];
}

// ── Doctor profiles ──
export async function getDoctorProfile(profileId: string): Promise<DoctorProfile | null> {
  const { data, error } = await supabase
    .from('doctor_profiles').select('*').eq('profile_id', profileId).single();
  if (error) return null;
  return data as DoctorProfile;
}

export async function updateDoctorProfile(profileId: string, updates: Partial<DoctorProfile>) {
  const { error } = await supabase
    .from('doctor_profiles').update(updates).eq('profile_id', profileId);
  if (error) throw new Error(error.message);
}

export async function getAllDoctors(): Promise<(Profile & { doctor_profile: DoctorProfile })[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, doctor_profiles(*)')
    .eq('role', 'doctor')
    .order('full_name');
  if (error) return handleError(error, 'getAllDoctors') as [];
  return (data ?? []).map((d: Record<string, unknown>) => ({
    ...d,
    doctor_profile: Array.isArray(d.doctor_profiles) ? d.doctor_profiles[0] : d.doctor_profiles,
  })) as (Profile & { doctor_profile: DoctorProfile })[];
}

// ── Patient profiles ──
export async function getPatientProfile(profileId: string): Promise<PatientProfile | null> {
  const { data, error } = await supabase
    .from('patient_profiles').select('*').eq('profile_id', profileId).single();
  if (error) return null;
  return data as PatientProfile;
}

export async function updatePatientProfile(profileId: string, updates: Partial<PatientProfile>) {
  const { error } = await supabase
    .from('patient_profiles').update(updates).eq('profile_id', profileId);
  if (error) throw new Error(error.message);
}

export async function getAllPatients(): Promise<(Profile & { patient_profile: PatientProfile })[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, patient_profiles(*)')
    .eq('role', 'patient')
    .order('full_name');
  if (error) return handleError(error, 'getAllPatients') as [];
  return (data ?? []).map((d: Record<string, unknown>) => ({
    ...d,
    patient_profile: Array.isArray(d.patient_profiles) ? d.patient_profiles[0] : d.patient_profiles,
  })) as (Profile & { patient_profile: PatientProfile })[];
}

// ══════════════════════════════════════════════════
// WARDS
// ══════════════════════════════════════════════════
export async function getWards(): Promise<Ward[]> {
  const { data, error } = await supabase.from('wards').select('*').order('name');
  if (error) return handleError(error, 'getWards') as Ward[];
  return (data ?? []) as Ward[];
}

export async function createWard(ward: Partial<Ward>) {
  const { data, error } = await supabase.from('wards').insert(ward).select().single();
  if (error) throw new Error(error.message);
  return data as Ward;
}

export async function updateWard(id: string, updates: Partial<Ward>) {
  const { error } = await supabase.from('wards').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// APPOINTMENTS
// ══════════════════════════════════════════════════
export async function getAppointments(filters?: {
  patient_id?: string; doctor_id?: string; date?: string; status?: string;
}): Promise<Appointment[]> {
  let q = supabase
    .from('appointments')
    .select('*, patient:profiles!appointments_patient_id_fkey(*), doctor:profiles!appointments_doctor_id_fkey(*)')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  if (filters?.doctor_id) q = q.eq('doctor_id', filters.doctor_id);
  if (filters?.date) q = q.eq('date', filters.date);
  if (filters?.status) q = q.eq('status', filters.status);

  const { data, error } = await q;
  if (error) return handleError(error, 'getAppointments') as Appointment[];
  return (data ?? []) as Appointment[];
}

export async function createAppointment(appt: Partial<Appointment>) {
  const { data, error } = await supabase.from('appointments').insert(appt).select().single();
  if (error) throw new Error(error.message);
  return data as Appointment;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const { error } = await supabase.from('appointments').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// PRESCRIPTIONS
// ══════════════════════════════════════════════════
export async function getPrescriptions(filters?: {
  patient_id?: string; doctor_id?: string; status?: string;
}): Promise<Prescription[]> {
  let q = supabase
    .from('prescriptions')
    .select('*, patient:profiles!prescriptions_patient_id_fkey(*), doctor:profiles!prescriptions_doctor_id_fkey(*)')
    .order('date', { ascending: false });

  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  if (filters?.doctor_id) q = q.eq('doctor_id', filters.doctor_id);
  if (filters?.status) q = q.eq('status', filters.status);

  const { data, error } = await q;
  if (error) return handleError(error, 'getPrescriptions') as Prescription[];
  return (data ?? []) as Prescription[];
}

export async function createPrescription(rx: Partial<Prescription>) {
  const { data, error } = await supabase.from('prescriptions').insert(rx).select().single();
  if (error) throw new Error(error.message);
  return data as Prescription;
}

export async function updatePrescription(id: string, updates: Partial<Prescription>) {
  const { error } = await supabase.from('prescriptions').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// LAB REPORTS
// ══════════════════════════════════════════════════
export async function getLabReports(filters?: {
  patient_id?: string; ordered_by?: string; status?: string;
}): Promise<LabReport[]> {
  let q = supabase
    .from('lab_reports')
    .select('*, patient:profiles!lab_reports_patient_id_fkey(*), doctor:profiles!lab_reports_ordered_by_fkey(*)')
    .order('date', { ascending: false });

  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  if (filters?.ordered_by) q = q.eq('ordered_by', filters.ordered_by);
  if (filters?.status) q = q.eq('status', filters.status);

  const { data, error } = await q;
  if (error) return handleError(error, 'getLabReports') as LabReport[];
  return (data ?? []) as LabReport[];
}

export async function createLabReport(report: Partial<LabReport>) {
  const { data, error } = await supabase.from('lab_reports').insert(report).select().single();
  if (error) throw new Error(error.message);
  return data as LabReport;
}

export async function updateLabReport(id: string, updates: Partial<LabReport>) {
  const { error } = await supabase.from('lab_reports').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════
export async function getInvoices(filters?: {
  patient_id?: string; status?: string;
}): Promise<Invoice[]> {
  let q = supabase
    .from('invoices')
    .select('*, patient:profiles!invoices_patient_id_fkey(*)')
    .order('date', { ascending: false });

  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  if (filters?.status) q = q.eq('status', filters.status);

  const { data, error } = await q;
  if (error) return handleError(error, 'getInvoices') as Invoice[];
  return (data ?? []) as Invoice[];
}

export async function createInvoice(invoice: Partial<Invoice>) {
  const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
  if (error) throw new Error(error.message);
  return data as Invoice;
}

export async function updateInvoice(id: string, updates: Partial<Invoice>) {
  const { error } = await supabase.from('invoices').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// VIDEO SESSIONS
// ══════════════════════════════════════════════════
export async function getVideoSessions(filters?: {
  patient_id?: string; doctor_id?: string; status?: string;
}): Promise<VideoSession[]> {
  let q = supabase
    .from('video_sessions')
    .select('*, patient:profiles!video_sessions_patient_id_fkey(*), doctor:profiles!video_sessions_doctor_id_fkey(*)')
    .order('scheduled_at', { ascending: true });

  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  if (filters?.doctor_id) q = q.eq('doctor_id', filters.doctor_id);
  if (filters?.status) q = q.eq('status', filters.status);

  const { data, error } = await q;
  if (error) return handleError(error, 'getVideoSessions') as VideoSession[];
  return (data ?? []) as VideoSession[];
}

export async function createVideoSession(session: Partial<VideoSession>) {
  const { data, error } = await supabase.from('video_sessions').insert(session).select().single();
  if (error) throw new Error(error.message);
  return data as VideoSession;
}

export async function updateVideoSession(id: string, updates: Partial<VideoSession>) {
  const { error } = await supabase.from('video_sessions').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════
export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return handleError(error, 'getNotifications') as Notification[];
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// HOSPITAL SETTINGS
// ══════════════════════════════════════════════════
export async function getHospitalSettings(): Promise<HospitalSettings | null> {
  const { data, error } = await supabase.from('hospital_settings').select('*').limit(1).single();
  if (error) { console.error('getHospitalSettings:', error.message); return null; }
  return data as HospitalSettings;
}

export async function updateHospitalSettings(id: string, updates: Partial<HospitalSettings>) {
  const { error } = await supabase.from('hospital_settings').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// REALTIME SUBSCRIPTIONS
// ══════════════════════════════════════════════════
export function subscribeToAppointments(
  userId: string,
  role: string,
  callback: (payload: unknown) => void
) {
  const column = role === 'doctor' ? 'doctor_id' : 'patient_id';
  return supabase
    .channel('appointments-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments', filter: `${column}=eq.${userId}` },
      callback
    )
    .subscribe();
}

export function subscribeToNotifications(userId: string, callback: (payload: unknown) => void) {
  return supabase
    .channel('notifications-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      callback
    )
    .subscribe();
}

// ══════════════════════════════════════════════════
// DASHBOARD STATS (admin)
// ══════════════════════════════════════════════════
export async function getAdminStats() {
  const [patients, doctors, wards, invoices] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'doctor'),
    supabase.from('wards').select('total_beds, occupied_beds'),
    supabase.from('invoices').select('amount, status'),
  ]);

  const totalPatients = patients.count ?? 0;
  const totalDoctors = doctors.count ?? 0;
  const wardData = (wards.data ?? []) as { total_beds: number; occupied_beds: number }[];
  const totalBeds = wardData.reduce((a, w) => a + w.total_beds, 0);
  const occupiedBeds = wardData.reduce((a, w) => a + w.occupied_beds, 0);
  const invoiceData = (invoices.data ?? []) as { amount: number; status: string }[];
  const todayRevenue = invoiceData.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0);

  return { totalPatients, totalDoctors, totalBeds, occupiedBeds, todayRevenue };
}

// ══════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════
export async function getPayments(filters?: {
  invoice_id?: string; patient_id?: string; status?: string;
}): Promise<Payment[]> {
  let q = supabase
    .from('payments')
    .select('*, patient:profiles!payments_patient_id_fkey(*), invoice:invoices(*)')
    .order('paid_at', { ascending: false });

  if (filters?.invoice_id) q = q.eq('invoice_id', filters.invoice_id);
  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  if (filters?.status) q = q.eq('status', filters.status);

  const { data, error } = await q;
  if (error) return handleError(error, 'getPayments') as Payment[];
  return (data ?? []) as Payment[];
}

export async function createPayment(payment: Partial<Payment>) {
  const { data, error } = await supabase.from('payments').insert(payment).select().single();
  if (error) throw new Error(error.message);
  return data as Payment;
}

// ══════════════════════════════════════════════════
// CONSULTATION NOTES
// ══════════════════════════════════════════════════
export async function getConsultationNotes(filters?: {
  doctor_id?: string; patient_id?: string; appointment_id?: string;
}): Promise<ConsultationNote[]> {
  let q = supabase
    .from('consultation_notes')
    .select('*, doctor:profiles!consultation_notes_doctor_id_fkey(*), patient:profiles!consultation_notes_patient_id_fkey(*)')
    .order('created_at', { ascending: false });

  if (filters?.doctor_id) q = q.eq('doctor_id', filters.doctor_id);
  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  if (filters?.appointment_id) q = q.eq('appointment_id', filters.appointment_id);

  const { data, error } = await q;
  if (error) return handleError(error, 'getConsultationNotes') as ConsultationNote[];
  return (data ?? []) as ConsultationNote[];
}

export async function createConsultationNote(note: Partial<ConsultationNote>) {
  const { data, error } = await supabase.from('consultation_notes').insert(note).select().single();
  if (error) throw new Error(error.message);
  return data as ConsultationNote;
}

export async function updateConsultationNote(id: string, updates: Partial<ConsultationNote>) {
  const { error } = await supabase.from('consultation_notes').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// DOCTOR SCHEDULES
// ══════════════════════════════════════════════════
export async function getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
  const { data, error } = await supabase
    .from('doctor_schedules')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('day_of_week');
  if (error) return handleError(error, 'getDoctorSchedules') as DoctorSchedule[];
  return (data ?? []) as DoctorSchedule[];
}

export async function upsertDoctorSchedule(schedule: Partial<DoctorSchedule>) {
  const { data, error } = await supabase
    .from('doctor_schedules')
    .upsert(schedule, { onConflict: 'doctor_id,day_of_week' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DoctorSchedule;
}

// ══════════════════════════════════════════════════
// DEPARTMENTS
// ══════════════════════════════════════════════════
export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) return handleError(error, 'getDepartments') as Department[];
  return (data ?? []) as Department[];
}

// ══════════════════════════════════════════════════
// EMERGENCY CONTACTS
// ══════════════════════════════════════════════════
export async function getEmergencyContacts(patientId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('patient_id', patientId)
    .order('is_primary', { ascending: false });
  if (error) return handleError(error, 'getEmergencyContacts') as EmergencyContact[];
  return (data ?? []) as EmergencyContact[];
}

export async function createEmergencyContact(contact: Partial<EmergencyContact>) {
  const { data, error } = await supabase.from('emergency_contacts').insert(contact).select().single();
  if (error) throw new Error(error.message);
  return data as EmergencyContact;
}

export async function deleteEmergencyContact(id: string) {
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ══════════════════════════════════════════════════
// AUDIT & ACTIVITY LOGS (admin only)
// ══════════════════════════════════════════════════
export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return handleError(error, 'getAuditLogs') as AuditLog[];
  return (data ?? []) as AuditLog[];
}

export async function getActivityLogs(userId?: string, limit = 50): Promise<ActivityLog[]> {
  let q = supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) return handleError(error, 'getActivityLogs') as ActivityLog[];
  return (data ?? []) as ActivityLog[];
}

// ══════════════════════════════════════════════════
// FILE UPLOADS
// ══════════════════════════════════════════════════
export async function getFileUploads(filters?: {
  patient_id?: string; uploaded_by?: string; file_type?: string;
}): Promise<FileUpload[]> {
  let q = supabase
    .from('file_uploads')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
  if (filters?.uploaded_by) q = q.eq('uploaded_by', filters.uploaded_by);
  if (filters?.file_type) q = q.eq('file_type', filters.file_type);

  const { data, error } = await q;
  if (error) return handleError(error, 'getFileUploads') as FileUpload[];
  return (data ?? []) as FileUpload[];
}

export async function createFileUpload(upload: Partial<FileUpload>) {
  const { data, error } = await supabase.from('file_uploads').insert(upload).select().single();
  if (error) throw new Error(error.message);
  return data as FileUpload;
}

// ══════════════════════════════════════════════════
// INVOICE LINE ITEMS
// ══════════════════════════════════════════════════
export async function getInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
  const { data, error } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at');
  if (error) return handleError(error, 'getInvoiceLineItems') as InvoiceLineItem[];
  return (data ?? []) as InvoiceLineItem[];
}

export async function createInvoiceLineItem(item: Partial<InvoiceLineItem>) {
  const { data, error } = await supabase.from('invoice_line_items').insert(item).select().single();
  if (error) throw new Error(error.message);
  return data as InvoiceLineItem;
}

// ══════════════════════════════════════════════════
// SAFE RPC FUNCTIONS (backend business logic)
// ══════════════════════════════════════════════════
export async function approveDoctor(doctorId: string) {
  const { error } = await supabase.rpc('approve_doctor', { p_doctor_id: doctorId });
  if (error) throw new Error(error.message);
}

export async function suspendAccount(userId: string, reason?: string) {
  const { error } = await supabase.rpc('suspend_account', {
    p_user_id: userId,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function cancelAppointmentSafe(appointmentId: string, reason?: string) {
  const { error } = await supabase.rpc('cancel_appointment', {
    p_appointment_id: appointmentId,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function completeConsultation(params: {
  appointmentId: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  followUpDate?: string;
}) {
  const { data, error } = await supabase.rpc('complete_consultation', {
    p_appointment_id: params.appointmentId,
    p_diagnosis: params.diagnosis ?? null,
    p_treatment_plan: params.treatmentPlan ?? null,
    p_notes: params.notes ?? null,
    p_follow_up_date: params.followUpDate ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string; // returns consultation note ID
}

// ══════════════════════════════════════════════════
// PENDING DOCTORS (admin approval queue)
// ══════════════════════════════════════════════════
export async function getPendingDoctors(): Promise<(Profile & { doctor_profile: DoctorProfile })[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, doctor_profiles(*)')
    .eq('role', 'doctor')
    .eq('account_status', 'pending_approval')
    .order('created_at', { ascending: false });
  if (error) return handleError(error, 'getPendingDoctors') as [];
  return (data ?? []).map((d: Record<string, unknown>) => ({
    ...d,
    doctor_profile: Array.isArray(d.doctor_profiles) ? d.doctor_profiles[0] : d.doctor_profiles,
  })) as (Profile & { doctor_profile: DoctorProfile })[];
}
