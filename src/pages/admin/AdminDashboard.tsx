import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, BedDouble, DollarSign, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState } from '../../hooks/useData';
import { getAdminStats, getAllPatients, getAppointments, getWards } from '../../lib/dataService';

function StatCard({ icon, iconBg, iconColor, label, value }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; value: string;
}) {
  const Icon = icon;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="icon-box" style={{ background: iconBg }}>
        <Icon size={18} strokeWidth={1.5} color={iconColor} />
      </div>
      <div>
        <div className="stat-number">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'badge-green', admitted: 'badge-green', critical: 'badge-red',
    discharged: 'badge-gray', scheduled: 'badge-blue', in_progress: 'badge-blue',
    completed: 'badge-gray', Admitted: 'badge-green', Active: 'badge-green',
    Critical: 'badge-red', Discharged: 'badge-gray', Scheduled: 'badge-blue',
    'In Progress': 'badge-blue', Completed: 'badge-gray',
  };
  return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];

  const { data: stats, loading: statsLoading } = useData(() => getAdminStats(), []);
  const { data: patients } = useData(() => getAllPatients(), []);
  const { data: appointments } = useData(() => getAppointments({ date: todayISO }), []);
  const { data: wards } = useData(() => getWards(), []);

  if (statsLoading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>{greeting}, {user?.name}</h1>
        <p style={{ fontSize: 13, color: '#A3A3A3', marginTop: 2 }}>{today} · Here's what's happening</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <StatCard icon={Users}     iconBg="#F0FDF4" iconColor="#16A34A" label="Total Patients"  value={String(stats?.totalPatients ?? 0)} />
        <StatCard icon={UserCheck} iconBg="#EFF6FF" iconColor="#2563EB" label="Active Doctors"  value={String(stats?.totalDoctors ?? 0)} />
        <StatCard icon={BedDouble} iconBg="#F5F5F5" iconColor="#0A0A0A" label="Beds Occupied"   value={`${stats?.occupiedBeds ?? 0}/${stats?.totalBeds ?? 0}`} />
        <StatCard icon={DollarSign}iconBg="#F5F5F5" iconColor="#0A0A0A" label="Revenue"         value={`₹${((stats?.todayRevenue ?? 0)/100000).toFixed(1)}L`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Recent Patients</div>
            <button className="btn-ghost" onClick={() => nav('/admin/patients')}>View all</button>
          </div>
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Email</th><th>Role</th><th></th></tr></thead>
            <tbody>
              {(patients ?? []).slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td><span style={{ fontWeight: 500, color: '#0A0A0A' }}>{p.full_name}</span></td>
                  <td>{p.email}</td>
                  <td>{statusBadge(p.role)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" style={{ width: 28, height: 28 }}><Eye size={13} strokeWidth={1.5} /></button>
                      <button className="btn-icon" style={{ width: 28, height: 28 }}><Edit2 size={13} strokeWidth={1.5} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 20 }}>Bed Occupancy</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(wards ?? []).slice(0, 6).map(w => {
              const pct = w.total_beds > 0 ? Math.round(w.occupied_beds / w.total_beds * 100) : 0;
              const fill = pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : '#16A34A';
              return (
                <div key={w.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: pct >= 90 ? '#DC2626' : '#0A0A0A' }}>{w.name}</span>
                    <span style={{ fontSize: 12, color: '#A3A3A3' }}>{w.occupied_beds}/{w.total_beds}</span>
                  </div>
                  <div style={{ height: 6, background: '#F5F5F5', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: fill, borderRadius: 9999, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Appointments Today</div>
            <button className="btn-ghost" onClick={() => nav('/admin/appointments')}>View all</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {(appointments ?? []).length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#A3A3A3', fontSize: 13 }}>No appointments today</div>
            )}
            {(appointments ?? []).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 24px', borderBottom: '1px solid #F5F5F5' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', width: 44 }}>{String(a.time).slice(0,5)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>{a.patient?.full_name ?? 'Patient'}</div>
                  <div style={{ fontSize: 12, color: '#A3A3A3' }}>{a.doctor?.full_name ?? 'Doctor'}</div>
                </div>
                {statusBadge(a.status)}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 20 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'New Admission', cls: 'btn-green', action: () => nav('/admin/patients') },
              { label: 'Add Doctor', cls: 'btn-blue', action: () => nav('/admin/doctors') },
              { label: 'Generate Report', cls: 'btn-primary', action: () => nav('/admin/reports') },
              { label: 'View Billing', cls: 'btn-secondary', action: () => nav('/admin/billing') },
            ].map(({ label, cls, action }) => (
              <button key={label} className={`btn ${cls}`} onClick={action} style={{ justifyContent: 'center', fontSize: 13 }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
