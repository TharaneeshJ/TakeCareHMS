import { useNavigate } from 'react-router-dom';
import { Users, Calendar, FlaskConical, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState } from '../../hooks/useData';
import { getAppointments, getLabReports } from '../../lib/dataService';

export function DoctorDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];

  const { data: appointments, loading } = useData(
    () => user?.id ? getAppointments({ doctor_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );
  const { data: labReports } = useData(
    () => user?.id ? getLabReports({ ordered_by: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  const todayAppts = (appointments ?? []).filter(a => a.date === todayISO);
  const completedToday = todayAppts.filter(a => a.status === 'completed').length;
  const pendingLabs = (labReports ?? []).filter(r => r.status === 'pending').length;

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Good morning, {user?.name}</h1>
        <p style={{ fontSize: 13, color: '#A3A3A3', marginTop: 2 }}>{today}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { icon: Users, bg: '#EFF6FF', color: '#2563EB', label: 'Today\'s Patients', value: String(todayAppts.length) },
          { icon: Calendar, bg: '#EFF6FF', color: '#2563EB', label: 'Appointments', value: String((appointments ?? []).length) },
          { icon: FlaskConical, bg: '#FFFBEB', color: '#D97706', label: 'Pending Labs', value: String(pendingLabs) },
          { icon: CheckCircle, bg: '#F0FDF4', color: '#16A34A', label: 'Completed Today', value: String(completedToday) },
        ].map(({ icon: Icon, bg, color, label, value }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="icon-box" style={{ background: bg, flexShrink: 0 }}><Icon size={18} strokeWidth={1.5} color={color} /></div>
            <div><div className="stat-number" style={{ fontSize: 24 }}>{value}</div><div className="stat-label">{label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Today's Appointments</div>
            <button className="btn-ghost" onClick={() => nav('/doctor/appointments')}>View all</button>
          </div>
          <div>
            {todayAppts.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#A3A3A3', fontSize: 13 }}>No appointments today</div>}
            {todayAppts.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#2563EB', width: 44 }}>{String(a.time).slice(0, 5)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>{a.patient?.full_name ?? 'Patient'}</div>
                  <div style={{ fontSize: 11, color: '#A3A3A3' }}>{a.type} · {a.duration}</div>
                </div>
                <span className={`badge ${a.status === 'completed' ? 'badge-gray' : a.status === 'in_progress' ? 'badge-green' : 'badge-blue'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 16 }}>Recent Lab Results</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(labReports ?? []).slice(0, 4).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>{r.patient?.full_name ?? 'Patient'}</div>
                  <div style={{ fontSize: 11, color: '#A3A3A3' }}>{r.test_name}</div>
                </div>
                <span className={`badge ${r.status === 'normal' ? 'badge-green' : r.status === 'pending' ? 'badge-blue' : 'badge-red'}`}>{r.status}</span>
                <button className="btn-ghost" onClick={() => nav('/doctor/lab-orders')}>Review</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
