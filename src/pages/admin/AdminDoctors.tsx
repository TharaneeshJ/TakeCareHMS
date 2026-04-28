import { useState } from 'react';
import { UserCheck, X, CheckCircle2, Mail, Building2, CalendarDays } from 'lucide-react';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getAllDoctors, approveDoctor, suspendAccount } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';
import type { Profile, DoctorProfile } from '../../lib/database.types';

type FullDoctor = Profile & { doctor_profile: DoctorProfile };

export function AdminDoctors() {
  const { data: doctors, loading, refetch } = useData(() => getAllDoctors(), []);
  const [addModal, setAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    try {
      const { error } = await supabase.auth.signUp({
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        options: { data: { full_name: fd.get('fullName') as string, role: 'doctor' } },
      });
      if (error) throw error;
      setAddModal(false);
      setSuccessMsg('Doctor registered successfully. Account is pending approval.');
      setTimeout(() => { setSuccessMsg(''); refetch(); }, 3000);
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveDoctor(id);
      setSuccessMsg('Doctor approved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this doctor?')) return;
    try {
      await suspendAccount(id, 'Suspended by admin');
      setSuccessMsg('Doctor account suspended.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Doctors</h1>
        <button className="btn btn-blue" onClick={() => setAddModal(true)}>Add Doctor</button>
      </div>

      {successMsg && (
        <div style={{ padding: 16, background: successMsg.startsWith('Error') ? '#FEF2F2' : '#F0FDF4', color: successMsg.startsWith('Error') ? '#DC2626' : '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {(doctors ?? []).length === 0 ? (
        <EmptyState title="No doctors found" subtitle="Register your first doctor to get started." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {(doctors ?? []).map((d: FullDoctor) => (
            <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
                  {d.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>{d.full_name}</div>
                  <div style={{ fontSize: 12, color: '#2563EB' }}>{d.doctor_profile?.specialization ?? 'General'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#525252' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} color="#A3A3A3" /> {d.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} color="#A3A3A3" /> {d.doctor_profile?.department ?? 'General'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CalendarDays size={14} color="#A3A3A3" /> {d.doctor_profile?.experience_years ?? 0} years experience</div>
                <div>Status: <span className={`badge ${d.account_status === 'active' ? 'badge-green' : d.account_status === 'suspended' ? 'badge-red' : 'badge-amber'}`}>{d.account_status}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {d.account_status === 'pending_approval' ? (
                  <button className="btn btn-green" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleApprove(d.id)}>
                    <UserCheck size={16} /> Approve
                  </button>
                ) : (
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} disabled>Profile Active</button>
                )}
                {d.account_status !== 'suspended' && (
                  <button className="btn-icon" style={{ color: '#DC2626' }} onClick={() => handleSuspend(d.id)} title="Suspend Doctor">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>Register New Doctor</div>
              <button className="btn-ghost" onClick={() => setAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="input-label">Full Name</label><input name="fullName" className="input" required /></div>
              <div><label className="input-label">Email</label><input name="email" type="email" className="input" required /></div>
              <div><label className="input-label">Password</label><input name="password" type="password" className="input" minLength={6} required /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-blue">Register Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
