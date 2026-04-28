import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState } from '../../hooks/useData';
import { getDoctorProfile, updateProfile, updateDoctorProfile, getDoctorSchedules, upsertDoctorSchedule } from '../../lib/dataService';

export function DoctorProfile() {
  const { user } = useAuth();
  const { data: doctorData, loading } = useData(
    () => user?.id ? getDoctorProfile(user.id) : Promise.resolve(null),
    [user?.id]
  );
  const { data: schedules, refetch: refetchSchedules } = useData(
    () => user?.id ? getDoctorSchedules(user.id) : Promise.resolve([]),
    [user?.id]
  );
  const [successMsg, setSuccessMsg] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<number | null>(null);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || editingSchedule === null) return;
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await upsertDoctorSchedule({
        doctor_id: user.id,
        day_of_week: editingSchedule,
        start_time: fd.get('startTime') as string,
        end_time: fd.get('endTime') as string,
        slot_duration: parseInt(fd.get('slotDuration') as string, 10),
        is_active: fd.get('isActive') === 'on'
      });
      setEditingSchedule(null);
      refetchSchedules();
      setSuccessMsg('Schedule updated.');
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

        {/* DOCTOR SCHEDULES SECTION */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>Weekly Schedule</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, idx) => {
              const schedule = (schedules ?? []).find(s => s.day_of_week === idx);
              return (
                <div key={idx} style={{ padding: '16px', border: '1px solid #E5E5E5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, width: 100 }}>{dayName}</div>
                    {schedule?.is_active ? (
                      <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#525252' }}>
                        <span>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                        <span>{schedule.slot_duration} min slots</span>
                        <span className="badge badge-green">Active</span>
                      </div>
                    ) : (
                      <span className="badge badge-gray">Off Duty</span>
                    )}
                  </div>
                  <button className="btn-ghost" style={{ fontSize: 14, color: '#2563EB' }} onClick={() => setEditingSchedule(idx)}>
                    Edit
                  </button>
                </div>
              );
            })}
          </div>

          {editingSchedule !== null && (
            <div className="modal-overlay" onClick={() => setEditingSchedule(null)}>
              <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>Edit Schedule - {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][editingSchedule]}</div>
                  <button className="btn-ghost" onClick={() => setEditingSchedule(null)}>&times;</button>
                </div>
                <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="isActive" id="isActive" defaultChecked={(schedules ?? []).find(s => s.day_of_week === editingSchedule)?.is_active ?? true} />
                    <label htmlFor="isActive" style={{ fontWeight: 500 }}>Active/Working Day</label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label className="input-label">Start Time</label><input type="time" name="startTime" className="input" defaultValue={(schedules ?? []).find(s => s.day_of_week === editingSchedule)?.start_time ?? '09:00:00'} required /></div>
                    <div><label className="input-label">End Time</label><input type="time" name="endTime" className="input" defaultValue={(schedules ?? []).find(s => s.day_of_week === editingSchedule)?.end_time ?? '17:00:00'} required /></div>
                  </div>
                  <div><label className="input-label">Slot Duration (mins)</label><input type="number" name="slotDuration" className="input" defaultValue={(schedules ?? []).find(s => s.day_of_week === editingSchedule)?.slot_duration ?? 30} required min={5} step={5} /></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingSchedule(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Schedule</button>
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
