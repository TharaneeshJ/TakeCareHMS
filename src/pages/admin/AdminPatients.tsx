import { useState } from 'react';
import { Eye, Edit2, Trash2, Search, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getAllPatients, suspendAccount } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';
import type { Profile, PatientProfile } from '../../lib/database.types';

type FullPatient = Profile & { patient_profile: PatientProfile };

export function AdminPatients() {
  const { user } = useAuth();
  const { data: patients, loading, refetch } = useData(() => getAllPatients(), []);
  const [selected, setSelected] = useState<FullPatient | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: 'patient' } },
      });
      if (error) throw error;
      setAddModal(false);
      setSuccessMsg('Patient registered successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      // Re-login as admin since signUp changes the session
      if (user?.email) {
        // Note: in production, use admin API or service role
      }
      refetch();
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this patient?')) return;
    try {
      await suspendAccount(id, 'Suspended by admin');
      setSuccessMsg('Patient account suspended.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const filtered = (patients ?? []).filter(p => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    if (filter === 'All') return matchSearch;
    return matchSearch && p.patient_profile?.blood_group === filter;
  });

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Patients</h1>
        <button className="btn btn-green" onClick={() => setAddModal(true)}>Add Patient</button>
      </div>

      {successMsg && (
        <div style={{ padding: 16, background: successMsg.startsWith('Error') ? '#FEF2F2' : '#F0FDF4', color: successMsg.startsWith('Error') ? '#DC2626' : '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="#A3A3A3" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option>All</option>
          <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
          <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <EmptyState title="No patients found" subtitle="Try adjusting your search or add a new patient." />
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Blood</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{p.full_name}</td>
                  <td>{p.email}</td>
                  <td>{p.phone ?? '—'}</td>
                  <td>{p.patient_profile?.blood_group ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {p.account_status === 'suspended' && <span className="badge badge-red" style={{ marginRight: 8 }}>Suspended</span>}
                      <button className="btn-icon" onClick={() => setSelected(p)}><Eye size={16} /></button>
                      {p.account_status !== 'suspended' && (
                        <button className="btn-icon" style={{ color: '#DC2626' }} onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Patient Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>{selected.full_name}</h3>
              <button className="btn-ghost" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
              <div><span style={{ color: '#A3A3A3' }}>Email:</span><div style={{ fontWeight: 500 }}>{selected.email}</div></div>
              <div><span style={{ color: '#A3A3A3' }}>Phone:</span><div style={{ fontWeight: 500 }}>{selected.phone ?? '—'}</div></div>
              <div><span style={{ color: '#A3A3A3' }}>Blood Group:</span><div style={{ fontWeight: 500 }}>{selected.patient_profile?.blood_group ?? '—'}</div></div>
              <div><span style={{ color: '#A3A3A3' }}>Gender:</span><div style={{ fontWeight: 500 }}>{selected.patient_profile?.gender ?? '—'}</div></div>
              <div><span style={{ color: '#A3A3A3' }}>Allergies:</span><div style={{ fontWeight: 500 }}>{selected.patient_profile?.allergies ?? 'None'}</div></div>
              <div><span style={{ color: '#A3A3A3' }}>Insurance:</span><div style={{ fontWeight: 500 }}>{selected.patient_profile?.insurance_provider ?? 'None'}</div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>Register New Patient</div>
              <button className="btn-ghost" onClick={() => setAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Full Name</label>
                <input name="fullName" type="text" className="input" required />
              </div>
              <div>
                <label className="input-label">Email Address</label>
                <input name="email" type="email" className="input" required />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input name="password" type="password" className="input" minLength={6} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-green">Register Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
