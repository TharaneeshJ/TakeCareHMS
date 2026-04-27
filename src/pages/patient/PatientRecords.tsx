import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getAppointments, getPrescriptions, getLabReports } from '../../lib/dataService';

export function PatientRecords() {
  const { user } = useAuth();
  const { data: appointments, loading } = useData(
    () => user?.id ? getAppointments({ patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );
  const { data: prescriptions } = useData(
    () => user?.id ? getPrescriptions({ patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );
  const { data: labReports } = useData(
    () => user?.id ? getLabReports({ patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Medical Records</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-number">{(appointments ?? []).length}</div>
          <div className="stat-label">Total Visits</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-number">{(prescriptions ?? []).length}</div>
          <div className="stat-label">Prescriptions</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="stat-number">{(labReports ?? []).length}</div>
          <div className="stat-label">Lab Reports</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Visit History</div>
        </div>
        {(appointments ?? []).length === 0 ? (
          <EmptyState title="No visit records" subtitle="Your medical history will build over time." />
        ) : (
          <table className="tbl">
            <thead><tr><th>Date</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {(appointments ?? []).map(a => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{a.doctor?.full_name ?? '—'}</td>
                  <td>{a.type}</td>
                  <td><span className={`badge ${a.status === 'completed' ? 'badge-gray' : 'badge-blue'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
