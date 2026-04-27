// ── Mock data for TakeCare HMS ───────────────────────────────

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  ward: string;
  doctor: string;
  status: 'Active' | 'Admitted' | 'Discharged' | 'Critical';
  admitted: string;
  condition: string;
  phone: string;
  email: string;
  blood: string;
  lastVisit: string;
}

export interface Doctor {
  id: string;
  name: string;
  initials: string;
  specialization: string;
  department: string;
  patientsToday: number;
  appointments: number;
  email: string;
  phone: string;
  experience: string;
}

export interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  duration: string;
}

export interface Ward {
  id: string;
  name: string;
  floor: string;
  total: number;
  occupied: number;
  type: string;
}

export interface Invoice {
  id: string;
  patient: string;
  date: string;
  amount: number;
  insurance: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  description: string;
}

export interface Prescription {
  id: string;
  patient: string;
  date: string;
  medicines: string[];
  duration: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  doctor: string;
  notes: string;
}

export interface LabResult {
  id: string;
  patient: string;
  test: string;
  date: string;
  result: string;
  status: 'Normal' | 'Abnormal' | 'Pending' | 'Critical';
  orderedBy: string;
}

// ── Patients ──────────────────────────────────────────────────
export const mockPatients: Patient[] = [
  { id: 'P001', name: 'Arjun Mehta',    age: 45, gender: 'M', ward: 'Cardiology',  doctor: 'Dr. Sharma',   status: 'Admitted',   admitted: '2026-04-20', condition: 'Hypertension',    phone: '+91 9876543210', email: 'arjun@email.com',  blood: 'B+',  lastVisit: '2026-04-20' },
  { id: 'P002', name: 'Priya Nair',     age: 32, gender: 'F', ward: 'Maternity',   doctor: 'Dr. Kaur',     status: 'Active',     admitted: '2026-04-22', condition: 'Prenatal Care',   phone: '+91 9876543211', email: 'priya@email.com',  blood: 'A+',  lastVisit: '2026-04-22' },
  { id: 'P003', name: 'Rahul Singh',    age: 58, gender: 'M', ward: 'Oncology',    doctor: 'Dr. Reddy',    status: 'Critical',   admitted: '2026-04-18', condition: 'Lung Cancer',     phone: '+91 9876543212', email: 'rahul@email.com',  blood: 'O-',  lastVisit: '2026-04-18' },
  { id: 'P004', name: 'Sunita Verma',   age: 67, gender: 'F', ward: 'General',     doctor: 'Dr. Patel',    status: 'Discharged', admitted: '2026-04-15', condition: 'Fracture',        phone: '+91 9876543213', email: 'sunita@email.com', blood: 'AB+', lastVisit: '2026-04-24' },
  { id: 'P005', name: 'Kavya Iyer',     age: 28, gender: 'F', ward: 'Neurology',   doctor: 'Dr. Kumar',    status: 'Admitted',   admitted: '2026-04-23', condition: 'Migraine',        phone: '+91 9876543214', email: 'kavya@email.com',  blood: 'O+',  lastVisit: '2026-04-23' },
  { id: 'P006', name: 'Mohan Das',      age: 72, gender: 'M', ward: 'ICU',         doctor: 'Dr. Sharma',   status: 'Critical',   admitted: '2026-04-19', condition: 'Cardiac Arrest',  phone: '+91 9876543215', email: 'mohan@email.com',  blood: 'A-',  lastVisit: '2026-04-19' },
  { id: 'P007', name: 'Deepa Krishnan', age: 41, gender: 'F', ward: 'Orthopedics', doctor: 'Dr. Joshi',    status: 'Active',     admitted: '2026-04-21', condition: 'Knee Replacement', phone: '+91 9876543216', email: 'deepa@email.com',  blood: 'B-',  lastVisit: '2026-04-21' },
  { id: 'P008', name: 'Ankit Gupta',    age: 35, gender: 'M', ward: 'General',     doctor: 'Dr. Patel',    status: 'Active',     admitted: '2026-04-24', condition: 'Appendicitis',    phone: '+91 9876543217', email: 'ankit@email.com',  blood: 'AB-', lastVisit: '2026-04-24' },
  { id: 'P009', name: 'Rekha Pillai',   age: 55, gender: 'F', ward: 'Cardiology',  doctor: 'Dr. Sharma',   status: 'Admitted',   admitted: '2026-04-22', condition: 'Arrhythmia',     phone: '+91 9876543218', email: 'rekha@email.com',  blood: 'O+',  lastVisit: '2026-04-22' },
  { id: 'P010', name: 'Vijay Rao',      age: 63, gender: 'M', ward: 'Urology',     doctor: 'Dr. Reddy',    status: 'Active',     admitted: '2026-04-23', condition: 'Kidney Stones',   phone: '+91 9876543219', email: 'vijay@email.com',  blood: 'B+',  lastVisit: '2026-04-23' },
];

// ── Doctors ──────────────────────────────────────────────────
export const mockDoctors: Doctor[] = [
  { id: 'D001', name: 'Dr. Amit Sharma',    initials: 'AS', specialization: 'Cardiologist',       department: 'Cardiology',   patientsToday: 12, appointments: 8,  email: 'amit@takecarehms.com',   phone: '+91 9811111111', experience: '15 yrs' },
  { id: 'D002', name: 'Dr. Preethi Kaur',   initials: 'PK', specialization: 'Obstetrician',       department: 'Maternity',    patientsToday: 9,  appointments: 7,  email: 'preethi@takecarehms.com', phone: '+91 9811111112', experience: '10 yrs' },
  { id: 'D003', name: 'Dr. Suresh Reddy',   initials: 'SR', specialization: 'Oncologist',         department: 'Oncology',     patientsToday: 6,  appointments: 5,  email: 'suresh@takecarehms.com', phone: '+91 9811111113', experience: '20 yrs' },
  { id: 'D004', name: 'Dr. Neha Patel',     initials: 'NP', specialization: 'General Physician',  department: 'General',      patientsToday: 18, appointments: 14, email: 'neha@takecarehms.com',   phone: '+91 9811111114', experience: '8 yrs'  },
  { id: 'D005', name: 'Dr. Rajesh Kumar',   initials: 'RK', specialization: 'Neurologist',        department: 'Neurology',    patientsToday: 10, appointments: 9,  email: 'rajesh@takecarehms.com', phone: '+91 9811111115', experience: '12 yrs' },
  { id: 'D006', name: 'Dr. Anjali Joshi',   initials: 'AJ', specialization: 'Orthopedic Surgeon', department: 'Orthopedics',  patientsToday: 8,  appointments: 6,  email: 'anjali@takecarehms.com', phone: '+91 9811111116', experience: '18 yrs' },
];

// ── Wards ─────────────────────────────────────────────────────
export const mockWards: Ward[] = [
  { id: 'W001', name: 'Cardiology Ward',   floor: 'Floor 2, Block A', total: 30, occupied: 24, type: 'Specialized' },
  { id: 'W002', name: 'ICU',              floor: 'Floor 3, Block B', total: 20, occupied: 19, type: 'Critical Care' },
  { id: 'W003', name: 'General Ward',     floor: 'Floor 1, Block A', total: 60, occupied: 35, type: 'General' },
  { id: 'W004', name: 'Maternity Ward',   floor: 'Floor 2, Block C', total: 25, occupied: 12, type: 'Specialized' },
  { id: 'W005', name: 'Oncology Ward',    floor: 'Floor 4, Block B', total: 20, occupied: 15, type: 'Specialized' },
  { id: 'W006', name: 'Orthopedics Ward', floor: 'Floor 3, Block A', total: 25, occupied: 10, type: 'Surgical' },
  { id: 'W007', name: 'Neurology Ward',   floor: 'Floor 4, Block C', total: 20, occupied: 8,  type: 'Specialized' },
  { id: 'W008', name: 'Pediatrics Ward',  floor: 'Floor 1, Block C', total: 30, occupied: 14, type: 'Specialized' },
];

// ── Appointments ─────────────────────────────────────────────
export const mockAppointments: Appointment[] = [
  { id: 'A001', patient: 'Arjun Mehta',    doctor: 'Dr. Amit Sharma',  date: '2026-04-27', time: '09:00', type: 'Consultation', status: 'Completed',   duration: '30 min' },
  { id: 'A002', patient: 'Priya Nair',     doctor: 'Dr. Preethi Kaur', date: '2026-04-27', time: '09:30', type: 'Follow-up',    status: 'In Progress', duration: '20 min' },
  { id: 'A003', patient: 'Kavya Iyer',     doctor: 'Dr. Rajesh Kumar', date: '2026-04-27', time: '10:00', type: 'Check-up',     status: 'Scheduled',   duration: '30 min' },
  { id: 'A004', patient: 'Deepa Krishnan', doctor: 'Dr. Anjali Joshi', date: '2026-04-27', time: '10:30', type: 'Post-Op',      status: 'Scheduled',   duration: '45 min' },
  { id: 'A005', patient: 'Ankit Gupta',    doctor: 'Dr. Neha Patel',   date: '2026-04-27', time: '11:00', type: 'Consultation', status: 'Scheduled',   duration: '30 min' },
  { id: 'A006', patient: 'Vijay Rao',      doctor: 'Dr. Suresh Reddy', date: '2026-04-28', time: '09:00', type: 'Follow-up',    status: 'Scheduled',   duration: '30 min' },
  { id: 'A007', patient: 'Rekha Pillai',   doctor: 'Dr. Amit Sharma',  date: '2026-04-28', time: '10:00', type: 'Check-up',     status: 'Scheduled',   duration: '20 min' },
];

// ── Invoices ─────────────────────────────────────────────────
export const mockInvoices: Invoice[] = [
  { id: 'INV-001', patient: 'Arjun Mehta',    date: '2026-04-20', amount: 45000, insurance: 'Star Health',   status: 'Paid',    description: 'Cardiac Consultation + Tests' },
  { id: 'INV-002', patient: 'Priya Nair',     date: '2026-04-22', amount: 28000, insurance: 'HDFC ERGO',     status: 'Pending', description: 'Prenatal Package' },
  { id: 'INV-003', patient: 'Rahul Singh',    date: '2026-04-18', amount: 120000,insurance: 'LIC Health',    status: 'Pending', description: 'Oncology Treatment - Cycle 1' },
  { id: 'INV-004', patient: 'Sunita Verma',   date: '2026-04-24', amount: 35000, insurance: 'Bajaj Allianz', status: 'Paid',    description: 'Orthopedic Surgery' },
  { id: 'INV-005', patient: 'Kavya Iyer',     date: '2026-04-23', amount: 8500,  insurance: 'None',          status: 'Pending', description: 'Neurology Consultation' },
  { id: 'INV-006', patient: 'Deepa Krishnan', date: '2026-04-21', amount: 95000, insurance: 'Star Health',   status: 'Paid',    description: 'Knee Replacement Surgery' },
  { id: 'INV-007', patient: 'Mohan Das',      date: '2026-04-19', amount: 250000,insurance: 'Mediclaim',     status: 'Overdue', description: 'ICU + Cardiac Emergency' },
];

// ── Prescriptions ─────────────────────────────────────────────
export const mockPrescriptions: Prescription[] = [
  { id: 'RX001', patient: 'Arjun Mehta',  date: '2026-04-20', medicines: ['Amlodipine 5mg', 'Atorvastatin 10mg', 'Aspirin 75mg'], duration: '30 days', status: 'Active',    doctor: 'Dr. Amit Sharma',  notes: 'Take with food. Avoid grapefruit.' },
  { id: 'RX002', patient: 'Priya Nair',   date: '2026-04-22', medicines: ['Folic Acid 5mg', 'Iron Supplement', 'Calcium 500mg'],  duration: '90 days', status: 'Active',    doctor: 'Dr. Preethi Kaur', notes: 'Prenatal vitamins. Essential.' },
  { id: 'RX003', patient: 'Kavya Iyer',   date: '2026-04-23', medicines: ['Sumatriptan 50mg', 'Paracetamol 500mg'],               duration: '14 days', status: 'Active',    doctor: 'Dr. Rajesh Kumar', notes: 'Only as needed. Max 2 doses/day.' },
  { id: 'RX004', patient: 'Sunita Verma', date: '2026-04-15', medicines: ['Cefixime 200mg', 'Pantoprazole 40mg', 'Vitamin D'],    duration: '7 days',  status: 'Completed', doctor: 'Dr. Neha Patel',   notes: 'Post surgery antibiotics.' },
  { id: 'RX005', patient: 'Deepa Krishnan',date:'2026-04-21', medicines: ['Celecoxib 200mg', 'Gabapentin 300mg'],                 duration: '21 days', status: 'Active',    doctor: 'Dr. Anjali Joshi', notes: 'Post knee replacement pain management.' },
];

// ── Lab Results ────────────────────────────────────────────────
export const mockLabResults: LabResult[] = [
  { id: 'LR001', patient: 'Arjun Mehta',    test: 'CBC + Lipid Profile',   date: '2026-04-21', result: 'LDL 180 mg/dL (H)', status: 'Abnormal', orderedBy: 'Dr. Amit Sharma' },
  { id: 'LR002', patient: 'Priya Nair',     test: 'Antenatal Panel',       date: '2026-04-22', result: 'All within range',   status: 'Normal',   orderedBy: 'Dr. Preethi Kaur' },
  { id: 'LR003', patient: 'Rahul Singh',    test: 'CT Scan Chest',         date: '2026-04-19', result: 'Mass 3.2cm RUL',    status: 'Critical', orderedBy: 'Dr. Suresh Reddy' },
  { id: 'LR004', patient: 'Kavya Iyer',     test: 'MRI Brain',             date: '2026-04-23', result: 'Awaiting report',   status: 'Pending',  orderedBy: 'Dr. Rajesh Kumar' },
  { id: 'LR005', patient: 'Mohan Das',      test: 'Troponin + ECG',        date: '2026-04-19', result: 'Troponin 4.2 (H)',  status: 'Critical', orderedBy: 'Dr. Amit Sharma' },
  { id: 'LR006', patient: 'Deepa Krishnan', test: 'X-ray Knee',            date: '2026-04-21', result: 'Post-op normal',    status: 'Normal',   orderedBy: 'Dr. Anjali Joshi' },
  { id: 'LR007', patient: 'Vijay Rao',      test: 'Urine Culture + KFT',   date: '2026-04-23', result: 'Creatinine 1.8 (H)', status:'Abnormal', orderedBy: 'Dr. Suresh Reddy' },
];
