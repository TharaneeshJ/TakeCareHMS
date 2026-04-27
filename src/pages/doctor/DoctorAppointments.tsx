import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getAppointments, updateAppointment, completeConsultation, cancelAppointmentSafe } from '../../lib/dataService';

export function DoctorAppointments() {
  const { user } = useAuth();
  const { data: appointments, loading, refetch } = useData(
    () => user?.id ? getAppointments({ doctor_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  const [completeModal, setCompleteModal] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAppointment(id, { status: status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' });
      refetch();
    } catch (err) { console.error(err); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointmentSafe(id, 'Cancelled by doctor');
      refetch();
    } catch (err) { console.error(err); }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModal) return;
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await completeConsultation({
        appointmentId: completeModal,
        diagnosis: fd.get('diagnosis') as string,
        treatmentPlan: fd.get('treatmentPlan') as string,
        notes: fd.get('notes') as string,
      });
      setCompleteModal(null);
      refetch();
    } catch (err) {
      console.error(err);
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { scheduled: 'badge-blue', in_progress: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>;
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>My Appointments</h1>

      {(appointments ?? []).length === 0 ? (
        <EmptyState title="No appointments" subtitle="Your appointments will appear here." />
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {(appointments ?? []).map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{a.patient?.full_name ?? '—'}</td>
                  <td>{a.date}</td>
                  <td>{String(a.time).slice(0, 5)}</td>
                  <td>{a.type}</td>
                  <td>{statusBadge(a.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {a.status === 'scheduled' && (
                        <button className="btn btn-green btn-sm" onClick={() => handleStatusChange(a.id, 'in_progress')}>Start</button>
                      )}
                      {a.status === 'in_progress' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setCompleteModal(a.id)}>Complete</button>
                      )}
                      {a.status === 'scheduled' && (
                        <button className="btn-ghost" style={{ color: '#DC2626', fontSize: 12 }} onClick={() => handleCancel(a.id)}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {completeModal && (
        <div className="modal-overlay" onClick={() => setCompleteModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>Complete Consultation</div>
              <button className="btn-ghost" onClick={() => setCompleteModal(null)}>×</button>
            </div>
            <form onSubmit={handleComplete} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="input-label">Diagnosis</label><input name="diagnosis" className="input" required placeholder="e.g. Viral Pharyngitis" /></div>
              <div><label className="input-label">Treatment Plan</label><textarea name="treatmentPlan" className="input" style={{ minHeight: 80 }} placeholder="Medications, rest, etc." /></div>
              <div><label className="input-label">Additional Notes</label><textarea name="notes" className="input" style={{ minHeight: 60 }} placeholder="Any other observations..." /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCompleteModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Complete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
