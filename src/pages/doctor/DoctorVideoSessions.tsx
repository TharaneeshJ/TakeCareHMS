import { useNavigate } from 'react-router-dom';
import { Video, Clock, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getVideoSessions } from '../../lib/dataService';

export function DoctorVideoSessions() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: sessions, loading } = useData(
    () => user?.id ? getVideoSessions({ doctor_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  const upcoming = (sessions ?? []).filter(s => s.status === 'scheduled');
  const past = (sessions ?? []).filter(s => s.status === 'completed' || s.status === 'cancelled');

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Video Consultations</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="icon-box" style={{ background: '#EFF6FF' }}><Video color="#2563EB" /></div>
          <div><div className="stat-number">{upcoming.length}</div><div className="stat-label">Upcoming</div></div>
        </div>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="icon-box" style={{ background: '#F0FDF4' }}><Users color="#16A34A" /></div>
          <div><div className="stat-number">{past.length}</div><div className="stat-label">Completed</div></div>
        </div>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="icon-box" style={{ background: '#FFFBEB' }}><Clock color="#D97706" /></div>
          <div><div className="stat-number">{(sessions ?? []).length}</div><div className="stat-label">Total</div></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Upcoming Sessions</div>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming sessions" subtitle="Your schedule is clear." />
        ) : (
          <div>
            {upcoming.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>{s.patient?.full_name ?? 'Patient'}</div>
                  <div style={{ fontSize: 13, color: '#525252' }}>{new Date(s.scheduled_at).toLocaleString()}</div>
                </div>
                <button className="btn btn-blue" onClick={() => nav(`/video-room/${s.id}`)}>Start Meeting</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Past Sessions</div>
          </div>
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {past.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{s.patient?.full_name ?? '—'}</td>
                  <td>{new Date(s.scheduled_at).toLocaleDateString()}</td>
                  <td><span className={`badge ${s.status === 'completed' ? 'badge-gray' : 'badge-red'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
