import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public pages
import { LandingPage } from './pages/LandingPage.tsx';
import { RoleSelectPage } from './pages/login/RoleSelectPage.tsx';
import { LoginPage } from './pages/login/LoginPage.tsx';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminPatients } from './pages/admin/AdminPatients.tsx';
import { AdminDoctors } from './pages/admin/AdminDoctors.tsx';
import { AdminWards } from './pages/admin/AdminWards.tsx';
import { AdminBilling } from './pages/admin/AdminBilling.tsx';
import { AdminReports } from './pages/admin/AdminReports.tsx';
import { AdminSettings } from './pages/admin/AdminSettings.tsx';
import { AdminAppointments } from './pages/admin/AdminAppointments.tsx';

// Doctor pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard.tsx';
import { DoctorPatients } from './pages/doctor/DoctorPatients.tsx';
import { DoctorAppointments } from './pages/doctor/DoctorAppointments.tsx';
import { DoctorVideoSessions } from './pages/doctor/DoctorVideoSessions.tsx';
import { DoctorPrescriptions } from './pages/doctor/DoctorPrescriptions.tsx';
import { DoctorLabOrders } from './pages/doctor/DoctorLabOrders.tsx';
import { DoctorWardRounds } from './pages/doctor/DoctorWardRounds.tsx';
import { DoctorProfile } from './pages/doctor/DoctorProfile.tsx';

// Patient pages
import { PatientDashboard } from './pages/patient/PatientDashboard.tsx';
import { PatientAppointments } from './pages/patient/PatientAppointments.tsx';
import { PatientVideoSessions } from './pages/patient/PatientVideoSessions.tsx';
import { PatientRecords } from './pages/patient/PatientRecords.tsx';
import { PatientPrescriptions } from './pages/patient/PatientPrescriptions.tsx';
import { PatientLabReports } from './pages/patient/PatientLabReports.tsx';
import { PatientBills } from './pages/patient/PatientBills.tsx';
import { PatientProfile } from './pages/patient/PatientProfile.tsx';

import { VideoRoom } from './pages/VideoRoom.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<RoleSelectPage />} />
          <Route path="/login/:role" element={<LoginPage />} />

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard"    element={<AdminDashboard />} />
              <Route path="/admin/patients"     element={<AdminPatients />} />
              <Route path="/admin/doctors"      element={<AdminDoctors />} />
              <Route path="/admin/wards"        element={<AdminWards />} />
              <Route path="/admin/billing"      element={<AdminBilling />} />
              <Route path="/admin/reports"      element={<AdminReports />} />
              <Route path="/admin/settings"     element={<AdminSettings />} />
              <Route path="/admin/appointments" element={<AdminAppointments />} />
            </Route>
          </Route>

          {/* Doctor */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/doctor/dashboard"    element={<DoctorDashboard />} />
              <Route path="/doctor/patients"     element={<DoctorPatients />} />
              <Route path="/doctor/appointments" element={<DoctorAppointments />} />
              <Route path="/doctor/video-sessions" element={<DoctorVideoSessions />} />
              <Route path="/doctor/prescriptions"element={<DoctorPrescriptions />} />
              <Route path="/doctor/lab-orders"   element={<DoctorLabOrders />} />
              <Route path="/doctor/ward-rounds"  element={<DoctorWardRounds />} />
              <Route path="/doctor/profile"      element={<DoctorProfile />} />
            </Route>
          </Route>

          {/* Patient */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/patient/dashboard"    element={<PatientDashboard />} />
              <Route path="/patient/appointments" element={<PatientAppointments />} />
              <Route path="/patient/video-sessions" element={<PatientVideoSessions />} />
              <Route path="/patient/records"      element={<PatientRecords />} />
              <Route path="/patient/prescriptions"element={<PatientPrescriptions />} />
              <Route path="/patient/lab-reports"  element={<PatientLabReports />} />
              <Route path="/patient/bills"        element={<PatientBills />} />
              <Route path="/patient/profile"      element={<PatientProfile />} />
            </Route>
          </Route>

          {/* Video Room */}
          <Route element={<ProtectedRoute allowedRoles={['doctor', 'patient']} />}>
            <Route path="/video-room/:id" element={<VideoRoom />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
