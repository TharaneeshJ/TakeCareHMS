import { useState } from 'react';
import { X, CheckCircle2, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getLabReports, createLabReport, getAllPatients } from '../../lib/dataService';

export function DoctorLabOrders() {
  const { user } = useAuth();
  const { data: reports, loading, refetch } = useData(
    () => user?.id ? getLabReports({ ordered_by: user.id }) : Promise.resolve([]),
    [user?.id]
  );
  const { data: patients } = useData(() => getAllPatients(), []);
  const [orderModal, setOrderModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await createLabReport({
        patient_id: fd.get('patientId') as string,
        ordered_by: user!.id,
        test_name: fd.get('testName') as string,
        date: new Date().toISOString().split('T')[0],
      });
      setOrderModal(false);
      setSuccessMsg('Lab order created.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) { console.error(err); }
  };

  const handleDownload = (r: any) => {
    const text = `TakeCare HMS - Lab Order\n\nPatient: ${r.patient?.full_name}\nDoctor: ${user?.name}\nDate: ${r.date}\nTest: ${r.test_name}\nStatus: ${r.status}\nResult: ${r.result ?? 'Pending'}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabOrder_${r.test_name}_${r.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: 'badge-blue', normal: 'badge-green', abnormal: 'badge-amber', critical: 'badge-red' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>;
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Lab Orders</h1>
        <button className="btn btn-blue" onClick={() => setOrderModal(true)}>+ New Lab Order</button>
      </div>

      {successMsg && (
        <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {(reports ?? []).length === 0 ? (
        <EmptyState title="No lab orders" subtitle="Order your first lab test." />
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Test</th><th>Date</th><th>Result</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {(reports ?? []).map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{r.patient?.full_name ?? '—'}</td>
                  <td>{r.test_name}</td>
                  <td>{r.date}</td>
                  <td>{r.result ?? 'Pending'}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td><button className="btn-icon" onClick={() => handleDownload(r)} title="Download"><Download size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orderModal && (
        <div className="modal-overlay" onClick={() => setOrderModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>New Lab Order</div>
              <button className="btn-ghost" onClick={() => setOrderModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="input-label">Patient</label>
                <select name="patientId" className="input" required>
                  <option value="">Select patient...</option>
                  {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div><label className="input-label">Test Name</label><input name="testName" className="input" placeholder="CBC, MRI Brain, etc." required /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setOrderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-blue">Order Test</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
