import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getPrescriptions, createPrescription, getAllPatients } from '../../lib/dataService';

function PrescriptionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const { data: patients } = useData(() => getAllPatients(), []);
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await createPrescription({
        patient_id: fd.get('patientId') as string,
        doctor_id: user!.id,
        medicines: meds.filter(m => m.name),
        duration: fd.get('duration') as string,
        notes: fd.get('notes') as string,
        date: new Date().toISOString().split('T')[0],
      });
      onCreated();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>New Prescription</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} strokeWidth={1.5} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label className="input-label">Patient</label>
            <select name="patientId" className="input" required>
              <option value="">Select patient...</option>
              {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="input-label" style={{ margin: 0 }}>Medicines</label>
              <button type="button" className="btn-ghost" onClick={() => setMeds(m => [...m, { name: '', dosage: '', frequency: '', duration: '' }])}>+ Add</button>
            </div>
            {meds.map((med, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                <input className="input" placeholder="Medicine" value={med.name} onChange={e => { const n = [...meds]; n[i].name = e.target.value; setMeds(n); }} />
                <input className="input" placeholder="Dosage" value={med.dosage} onChange={e => { const n = [...meds]; n[i].dosage = e.target.value; setMeds(n); }} />
                <input className="input" placeholder="Frequency" value={med.frequency} onChange={e => { const n = [...meds]; n[i].frequency = e.target.value; setMeds(n); }} />
                <button type="button" className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => setMeds(m => m.filter((_, j) => j !== i))}><X size={14} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label className="input-label">Duration</label><input name="duration" className="input" defaultValue="7 days" required /></div>
            <div><label className="input-label">Notes</label><input name="notes" className="input" /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-blue">Confirm Prescription</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DoctorPrescriptions() {
  const { user } = useAuth();
  const { data: prescriptions, loading, refetch } = useData(
    () => user?.id ? getPrescriptions({ doctor_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );
  const [showModal, setShowModal] = useState(false);

  const handleDownload = (p: any) => {
    const text = `TakeCare HMS - Prescription\n\nPatient: ${p.patient?.full_name}\nDoctor: ${user?.name}\nDate: ${p.date}\nDuration: ${p.duration}\n\nMedicines:\n${Array.isArray(p.medicines) ? p.medicines.map((m: any) => `- ${m.name} (${m.dosage}, ${m.frequency})`).join('\n') : 'N/A'}\n\nNotes: ${p.notes ?? 'None'}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prescription_${p.patient?.full_name ?? 'Patient'}_${p.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>;
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Prescriptions</h1>
        <button className="btn btn-blue" onClick={() => setShowModal(true)}>+ New Prescription</button>
      </div>

      {(prescriptions ?? []).length === 0 ? (
        <EmptyState title="No prescriptions" subtitle="Create your first prescription." />
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Date</th><th>Medicines</th><th>Duration</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {(prescriptions ?? []).map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{p.patient?.full_name ?? '—'}</td>
                  <td>{p.date}</td>
                  <td>{Array.isArray(p.medicines) ? p.medicines.map((m: { name: string }) => m.name).join(', ') : '—'}</td>
                  <td>{p.duration}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td><button className="btn-icon" onClick={() => handleDownload(p)} title="Download"><Download size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <PrescriptionModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); refetch(); }} />}
    </div>
  );
}
