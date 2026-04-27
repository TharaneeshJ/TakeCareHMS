import { useNavigate } from 'react-router-dom';
import { Calendar, Pill, ReceiptText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState } from '../../hooks/useData';
import { getAppointments, getPrescriptions, getLabReports, getInvoices } from '../../lib/dataService';

export function PatientDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();

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
  const { data: invoices } = useData(
    () => user?.id ? getInvoices({ patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  const upcoming = (appointments ?? []).filter(a => a.status === 'scheduled');
  const activeRx = (prescriptions ?? []).filter(p => p.status === 'active');
  const pendingBills = (invoices ?? []).filter(i => i.status === 'pending' || i.status === 'overdue');

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { normal: 'badge-green', abnormal: 'badge-red', pending: 'badge-blue', paid: 'badge-green', overdue: 'badge-red' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>;
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ background: '#0A0A0A', color: '#FFFFFF', padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4 }}>Welcome back, {user?.name}</h1>
          <p style={{ fontSize: 14, color: '#A3A3A3' }}>
            {upcoming.length > 0
              ? `Your next appointment: ${upcoming[0].date} with ${upcoming[0].doctor?.full_name ?? 'Doctor'}`
              : 'No upcoming appointments'}
          </p>
        </div>
        <button className="btn btn-green" onClick={() => nav('/patient/appointments')}>Book New Appointment</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="icon-box" style={{ background: '#EFF6FF' }}><Calendar color="#2563EB" /></div>
          <div><div className="stat-number">{upcoming.length}</div><div className="stat-label">Upcoming Appointments</div></div>
        </div>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="icon-box" style={{ background: '#F0FDF4' }}><Pill color="#16A34A" /></div>
          <div><div className="stat-number">{activeRx.length}</div><div className="stat-label">Active Prescriptions</div></div>
        </div>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', border: pendingBills.length > 0 ? '1.5px solid var(--red)' : '' }}>
          <div className="icon-box" style={{ background: pendingBills.length > 0 ? '#FEF2F2' : '#F5F5F5' }}><ReceiptText color={pendingBills.length > 0 ? '#DC2626' : '#0A0A0A'} /></div>
          <div><div className="stat-number" style={{ color: pendingBills.length > 0 ? 'var(--red)' : '#0A0A0A' }}>{pendingBills.length}</div><div className="stat-label">Pending Bills</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Upcoming Appointments</div>
          </div>
          {upcoming.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: '#A3A3A3', fontSize: 13 }}>No upcoming appointments</div> : (
            <div>{upcoming.slice(0, 4).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>{a.doctor?.full_name ?? 'Doctor'}</div>
                  <div style={{ fontSize: 12, color: '#A3A3A3' }}>{a.date} at {String(a.time).slice(0, 5)}</div>
                </div>
                <button className="btn-ghost" style={{ color: '#16A34A' }} onClick={() => nav('/patient/appointments')}>View</button>
              </div>
            ))}</div>
          )}
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Recent Prescriptions</div>
          </div>
          {activeRx.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: '#A3A3A3', fontSize: 13 }}>No active prescriptions</div> : (
            <div>{activeRx.slice(0, 4).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>{Array.isArray(p.medicines) && p.medicines.length > 0 ? (p.medicines[0] as {name:string}).name : 'Prescription'}</div>
                  <div style={{ fontSize: 12, color: '#A3A3A3' }}>By {p.doctor?.full_name ?? 'Doctor'}</div>
                </div>
                <button className="btn-ghost" onClick={() => nav('/patient/prescriptions')}>View</button>
              </div>
            ))}</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Lab Reports</div>
          </div>
          {(labReports ?? []).length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: '#A3A3A3', fontSize: 13 }}>No lab reports</div> : (
            <div>{(labReports ?? []).slice(0, 4).map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>{l.test_name}</div>
                  <div style={{ fontSize: 12, color: '#A3A3A3' }}>{l.date}</div>
                </div>
                {statusBadge(l.status)}
              </div>
            ))}</div>
          )}
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Billing Summary</div>
          </div>
          {(invoices ?? []).length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: '#A3A3A3', fontSize: 13 }}>No invoices</div> : (
            <div>{(invoices ?? []).slice(0, 4).map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>{i.description}</div>
                  <div style={{ fontSize: 12, color: '#A3A3A3' }}>{i.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>₹{i.amount.toLocaleString()}</div>
                  {statusBadge(i.status)}
                </div>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}
