import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState } from '../../hooks/useData';
import { getPatientProfile, updateProfile, updatePatientProfile } from '../../lib/dataService';

export function PatientProfile() {
  const { user } = useAuth();
  const { data: patientData, loading } = useData(
    () => user?.id ? getPatientProfile(user.id) : Promise.resolve(null),
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
      if (patientData) {
        await updatePatientProfile(user.id, {
          blood_group: fd.get('bloodGroup') as string,
          allergies: fd.get('allergies') as string,
          date_of_birth: fd.get('dob') as string || null,
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
            {user?.initials || 'PA'}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A' }}>{user?.name}</div>
            <div style={{ fontSize: 14, color: '#525252', marginTop: 4 }}>Patient</div>
          </div>
          <div style={{ width: '100%', height: 1, background: '#F5F5F5' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#525252', fontSize: 14, width: '100%' }}>
            <Mail size={16} color="#A3A3A3" /> {user?.email}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 20 }}>Personal Information</div>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="input-label">Full Name</label><input name="fullName" className="input" defaultValue={user?.name} required /></div>
              <div><label className="input-label">Date of Birth</label><input name="dob" type="date" className="input" defaultValue={patientData?.date_of_birth ?? ''} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="input-label">Email</label><input className="input" defaultValue={user?.email} disabled /></div>
              <div><label className="input-label">Phone</label><input name="phone" className="input" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="input-label">Blood Group</label>
                <select name="bloodGroup" className="input" defaultValue={patientData?.blood_group ?? ''}>
                  <option value="">Select...</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
              <div><label className="input-label">Allergies</label><input name="allergies" className="input" defaultValue={patientData?.allergies ?? ''} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="submit" className="btn btn-primary">Save Profile</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
