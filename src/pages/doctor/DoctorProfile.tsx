import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState } from '../../hooks/useData';
import { getDoctorProfile, updateProfile, updateDoctorProfile } from '../../lib/dataService';

export function DoctorProfile() {
  const { user } = useAuth();
  const { data: doctorData, loading } = useData(
    () => user?.id ? getDoctorProfile(user.id) : Promise.resolve(null),
    [user?.id]
  );
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await updateProfile(user.id, {
        full_name: fd.get('fullName') as string,
        phone: fd.get('phone') as string,
      });
      if (doctorData) {
        await updateDoctorProfile(user.id, {
          specialization: fd.get('specialization') as string,
          qualifications: fd.get('qualifications') as string,
          license_number: fd.get('licenseNumber') as string,
        });
      }
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>My Profile</h1>
      {successMsg && (
        <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#F5F5F5', color: '#525252', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 600 }}>
            {user?.initials || 'DR'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A' }}>{user?.name}</div>
            <div style={{ fontSize: 14, color: '#525252', marginTop: 4 }}>{doctorData?.specialization ?? 'Doctor'}</div>
          </div>
          <div style={{ width: '100%', height: 1, background: '#F5F5F5' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#525252', fontSize: 14 }}><Mail size={16} color="#A3A3A3" /> {user?.email}</div>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 20 }}>Personal Information</div>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="input-label">Full Name</label><input name="fullName" className="input" defaultValue={user?.name} required /></div>
              <div><label className="input-label">Specialization</label><input name="specialization" className="input" defaultValue={doctorData?.specialization ?? ''} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="input-label">Email</label><input className="input" defaultValue={user?.email} disabled /></div>
              <div><label className="input-label">Phone</label><input name="phone" className="input" /></div>
            </div>
            <div><label className="input-label">Qualifications</label><input name="qualifications" className="input" defaultValue={doctorData?.qualifications ?? ''} /></div>
            <div><label className="input-label">License Number</label><input name="licenseNumber" className="input" defaultValue={doctorData?.license_number ?? ''} /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="submit" className="btn btn-primary">Save Profile</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
