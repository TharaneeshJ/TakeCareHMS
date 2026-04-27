// ══════════════════════════════════════════════════════════════
// TakeCare HMS — Database Types (v2 — production upgrade)
// Backward-compatible: all existing fields preserved
// ══════════════════════════════════════════════════════════════

export type Role = 'admin' | 'doctor' | 'patient';
export type AccountStatus = 'pending_approval' | 'active' | 'suspended' | 'deactivated';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone: string | null;
  avatar_url: string | null;
  account_status: AccountStatus;
  is_verified: boolean;
  verified_at: string | null;
  last_sign_in_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  profile_id: string;
  specialization: string;
  department: string;
  qualifications: string | null;
  license_number: string | null;
  experience_years: number;
  consultation_fee: number;
  is_available: boolean;
  created_at: string;
}

export interface PatientProfile {
  id: string;
  profile_id: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string | null;
  emergency_contact: string | null;
  allergies: string | null;
  insurance_provider: string | null;
  insurance_id: string | null;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  profile_id: string;
  designation: string;
  permissions: string[];
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_doctor_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ward {
  id: string;
  name: string;
  floor: string;
  total_beds: number;
  occupied_beds: number;
  ward_type: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // joined fields
  patient?: Profile;
  doctor?: Profile;
  doctor_profile?: DoctorProfile;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  medicines: PrescriptionMedicine[];
  duration: string;
  status: 'active' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient?: Profile;
  doctor?: Profile;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface LabReport {
  id: string;
  patient_id: string;
  ordered_by: string;
  test_name: string;
  date: string;
  result: string | null;
  status: 'pending' | 'normal' | 'abnormal' | 'critical';
  report_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient?: Profile;
  doctor?: Profile;
}

export interface Invoice {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  invoice_number: string | null;
  date: string;
  amount: number;
  subtotal: number;
  tax_amount: number;
  discount: number;
  description: string;
  insurance_provider: string | null;
  status: 'paid' | 'pending' | 'overdue';
  payment_method: string | null;
  paid_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient?: Profile;
  line_items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  category: 'consultation' | 'lab' | 'pharmacy' | 'procedure' | 'room' | 'other';
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'net_banking' | 'insurance' | 'other';
  transaction_ref: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  patient?: Profile;
  invoice?: Invoice;
}

export interface VideoSession {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  room_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient?: Profile;
  doctor?: Profile;
}

export interface ConsultationNote {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  examination: string | null;
  treatment_plan: string | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  doctor?: Profile;
  patient?: Profile;
  appointment?: Appointment;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  contact_name: string;
  relationship: string;
  phone: string;
  is_primary: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  link: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface HospitalSettings {
  id: string;
  hospital_name: string;
  address: string;
  email: string;
  phone: string;
  currency: string;
  timezone: string;
  date_format: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface FileUpload {
  id: string;
  uploaded_by: string;
  patient_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  storage_path: string;
  bucket_name: string;
  mime_type: string | null;
  description: string | null;
  is_public: boolean;
  created_at: string;
  deleted_at: string | null;
}

// Supabase Database type for client generics
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string; role: Role }; Update: Partial<Profile> };
      doctor_profiles: { Row: DoctorProfile; Insert: Partial<DoctorProfile> & { profile_id: string }; Update: Partial<DoctorProfile> };
      patient_profiles: { Row: PatientProfile; Insert: Partial<PatientProfile> & { profile_id: string }; Update: Partial<PatientProfile> };
      admin_profiles: { Row: AdminProfile; Insert: Partial<AdminProfile> & { profile_id: string }; Update: Partial<AdminProfile> };
      departments: { Row: Department; Insert: Partial<Department>; Update: Partial<Department> };
      wards: { Row: Ward; Insert: Partial<Ward>; Update: Partial<Ward> };
      appointments: { Row: Appointment; Insert: Partial<Appointment> & { patient_id: string; doctor_id: string }; Update: Partial<Appointment> };
      prescriptions: { Row: Prescription; Insert: Partial<Prescription> & { patient_id: string; doctor_id: string }; Update: Partial<Prescription> };
      lab_reports: { Row: LabReport; Insert: Partial<LabReport> & { patient_id: string; ordered_by: string }; Update: Partial<LabReport> };
      invoices: { Row: Invoice; Insert: Partial<Invoice> & { patient_id: string }; Update: Partial<Invoice> };
      invoice_line_items: { Row: InvoiceLineItem; Insert: Partial<InvoiceLineItem> & { invoice_id: string }; Update: Partial<InvoiceLineItem> };
      payments: { Row: Payment; Insert: Partial<Payment> & { invoice_id: string; patient_id: string }; Update: Partial<Payment> };
      video_sessions: { Row: VideoSession; Insert: Partial<VideoSession> & { patient_id: string; doctor_id: string }; Update: Partial<VideoSession> };
      consultation_notes: { Row: ConsultationNote; Insert: Partial<ConsultationNote> & { appointment_id: string; doctor_id: string; patient_id: string }; Update: Partial<ConsultationNote> };
      doctor_schedules: { Row: DoctorSchedule; Insert: Partial<DoctorSchedule> & { doctor_id: string }; Update: Partial<DoctorSchedule> };
      emergency_contacts: { Row: EmergencyContact; Insert: Partial<EmergencyContact> & { patient_id: string }; Update: Partial<EmergencyContact> };
      notifications: { Row: Notification; Insert: Partial<Notification> & { user_id: string }; Update: Partial<Notification> };
      hospital_settings: { Row: HospitalSettings; Insert: Partial<HospitalSettings>; Update: Partial<HospitalSettings> };
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
      activity_log: { Row: ActivityLog; Insert: Partial<ActivityLog> & { user_id: string }; Update: Partial<ActivityLog> };
      file_uploads: { Row: FileUpload; Insert: Partial<FileUpload> & { uploaded_by: string }; Update: Partial<FileUpload> };
    };
  };
}
