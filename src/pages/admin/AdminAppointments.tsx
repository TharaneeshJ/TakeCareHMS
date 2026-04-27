import { useState } from 'react';
import { Calendar, X, CheckCircle2 } from 'lucide-react';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getAppointments, createAppointment, getAllPatients, getAllDoctors, cancelAppointmentSafe } from '../../lib/dataService';

export function AdminAppointments() {
  const { data: appointments, loading, refetch } = useData(() => getAppointments(), []);
  const { data: patients } = useData(() => getAllPatients(), []);
  const { data: doctors } = useData(() => getAllDoctors(), []);
  const [bookingModal, setBookingModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await createAppointment({
        patient_id: fd.get('patientId') as string,
        doctor_id: fd.get('doctorId') as string,
        date: fd.get('date') as string,
        time: fd.get('time') as string,
        type: 'Consultation',
      });
      setBookingModal(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointmentSafe(id, 'Cancelled by admin');
      setSuccessMsg(true); // Reusing success state for simplicity
      setTimeout(() => setSuccessMsg(false), 3000);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { scheduled: 'badge-blue', in_progress: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>;
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Appointments</h1>
        <button className="btn btn-primary" onClick={() => setBookingModal(true)}><Calendar size={16} /> Schedule Appointment</button>
      </div>

      {successMsg && (
        <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> Action completed successfully.
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {(appointments ?? []).length === 0 ? (
          <EmptyState title="No appointments" subtitle="Schedule your first appointment." />
        ) : (
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Duration</th><th>Actions</th></tr></thead>
            <tbody>
              {(appointments ?? []).map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{a.patient?.full_name ?? '—'}</td>
                  <td>{a.doctor?.full_name ?? '—'}</td>
                  <td>{a.date}</td>
                  <td>{String(a.time).slice(0, 5)}</td>
                  <td>{a.type}</td>
                  <td>{statusBadge(a.status)}</td>
                  <td>{a.duration}</td>
                  <td>
                    {a.status !== 'cancelled' && a.status !== 'completed' && (
                      <button className="btn btn-ghost" style={{ color: '#DC2626', padding: '4px 8px', fontSize: 13 }} onClick={() => handleCancel(a.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {bookingModal && (
        <div className="modal-overlay" onClick={() => setBookingModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Schedule Appointment</div>
              <button className="btn-ghost" onClick={() => setBookingModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="input-label">Patient</label>
                <select name="patientId" className="input" required>
                  <option value="">Select patient...</option>
                  {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div><label className="input-label">Doctor</label>
                <select name="doctorId" className="input" required>
                  <option value="">Select doctor...</option>
                  {(doctors ?? []).map(d => <option key={d.id} value={d.id}>{d.full_name} — {d.doctor_profile?.specialization}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label className="input-label">Date</label><input name="date" type="date" className="input" required /></div>
                <div><label className="input-label">Time</label><input name="time" type="time" className="input" required /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBookingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
