import { useNavigate } from 'react-router-dom';
import { FileText, Pill, FlaskConical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getAppointments } from '../../lib/dataService';

export function DoctorPatients() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: appointments, loading } = useData(
    () => user?.id ? getAppointments({ doctor_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  // Deduplicate patients from appointments
  const patientMap = new Map<string, { name: string; lastDate: string; type: string; status: string }>();
  (appointments ?? []).forEach(a => {
    if (a.patient?.full_name && !patientMap.has(a.patient_id)) {
      patientMap.set(a.patient_id, {
        name: a.patient.full_name,
        lastDate: a.date,
        type: a.type,
        status: a.status,
      });
    }
  });
  const patients = Array.from(patientMap.entries());

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>My Patients</h1>

      {patients.length === 0 ? (
        <EmptyState title="No patients yet" subtitle="Your patients will appear here after appointments." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Last Visit</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {patients.map(([id, p]) => (
                <tr key={id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{p.name}</td>
                  <td>{p.lastDate}</td>
                  <td>{p.type}</td>
                  <td><span className={`badge ${p.status === 'completed' ? 'badge-gray' : 'badge-blue'}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" style={{ width: 28, height: 28 }} title="History" onClick={() => nav('/doctor/appointments')}><FileText size={13} strokeWidth={1.5} /></button>
                      <button className="btn-icon" style={{ width: 28, height: 28 }} title="Prescriptions" onClick={() => nav('/doctor/prescriptions')}><Pill size={13} strokeWidth={1.5} /></button>
                      <button className="btn-icon" style={{ width: 28, height: 28 }} title="Lab Orders" onClick={() => nav('/doctor/lab-orders')}><FlaskConical size={13} strokeWidth={1.5} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
