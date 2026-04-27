import { Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getPrescriptions } from '../../lib/dataService';

export function PatientPrescriptions() {
  const { user } = useAuth();
  const { data: prescriptions, loading } = useData(
    () => user?.id ? getPrescriptions({ patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  const handleDownload = (p: any) => {
    const text = `TakeCare HMS - Prescription\n\nPatient: ${user?.name}\nDoctor: ${p.doctor?.full_name}\nDate: ${p.date}\nDuration: ${p.duration}\n\nMedicines:\n${Array.isArray(p.medicines) ? p.medicines.map((m: any) => `- ${m.name} (${m.dosage}, ${m.frequency})`).join('\n') : 'N/A'}\n\nNotes: ${p.notes ?? 'None'}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prescription_${p.date}.txt`;
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
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>My Prescriptions</h1>
      {(prescriptions ?? []).length === 0 ? (
        <EmptyState title="No prescriptions" subtitle="Your prescriptions will appear here." />
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Doctor</th><th>Date</th><th>Medicines</th><th>Duration</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {(prescriptions ?? []).map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{p.doctor?.full_name ?? '—'}</td>
                  <td>{p.date}</td>
                  <td>{Array.isArray(p.medicines) ? p.medicines.map((m: {name:string}) => m.name).join(', ') : '—'}</td>
                  <td>{p.duration}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>
                    <button className="btn-icon" onClick={() => handleDownload(p)} title="Download Prescription"><Download size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
