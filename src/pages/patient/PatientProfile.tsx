import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState } from '../../hooks/useData';
import { getPatientProfile, updateProfile, updatePatientProfile, getEmergencyContacts, createEmergencyContact, deleteEmergencyContact } from '../../lib/dataService';

export function PatientProfile() {
  const { user } = useAuth();
  const { data: patientData, loading } = useData(
    () => user?.id ? getPatientProfile(user.id) : Promise.resolve(null),
    [user?.id]
  );
  const { data: contacts, refetch: refetchContacts } = useData(
    () => user?.id ? getEmergencyContacts(user.id) : Promise.resolve([]),
    [user?.id]
  );
  const [successMsg, setSuccessMsg] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await createEmergencyContact({
        patient_id: user.id,
        contact_name: fd.get('contactName') as string,
        relationship: fd.get('relationship') as string,
        phone: fd.get('phone') as string,
        is_primary: fd.get('isPrimary') === 'on'
      });
      setShowAddContact(false);
      refetchContacts();
      setSuccessMsg('Emergency contact added.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Remove this emergency contact?')) return;
    try {
      await deleteEmergencyContact(id);
      refetchContacts();
      setSuccessMsg('Contact removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

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

        {/* EMERGENCY CONTACTS SECTION */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>Emergency Contacts</div>
            <button className="btn btn-secondary" onClick={() => setShowAddContact(true)}>Add Contact</button>
          </div>
          
          {(contacts ?? []).length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#737373', background: '#F9FAFB', borderRadius: 8 }}>
              No emergency contacts added yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Relationship</th>
                    <th>Phone</th>
                    <th>Primary</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(contacts ?? []).map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{c.contact_name}</td>
                      <td>{c.relationship}</td>
                      <td>{c.phone}</td>
                      <td>{c.is_primary ? <span className="badge badge-blue">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                      <td>
                        <button className="btn-ghost" style={{ color: '#DC2626', padding: '4px 8px', fontSize: 12 }} onClick={() => handleDeleteContact(c.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showAddContact && (
            <div className="modal-overlay" onClick={() => setShowAddContact(false)}>
              <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>Add Emergency Contact</div>
                  <button className="btn-ghost" onClick={() => setShowAddContact(false)}>&times;</button>
                </div>
                <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div><label className="input-label">Contact Name</label><input name="contactName" className="input" required /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label className="input-label">Relationship</label><input name="relationship" className="input" placeholder="e.g. Spouse, Parent" required /></div>
                    <div><label className="input-label">Phone</label><input name="phone" className="input" required /></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="isPrimary" id="isPrimary" />
                    <label htmlFor="isPrimary" style={{ fontSize: 14, color: '#0A0A0A' }}>Set as primary contact</label>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddContact(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Contact</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
