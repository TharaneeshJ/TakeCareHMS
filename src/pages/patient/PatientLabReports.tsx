import { Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getLabReports } from '../../lib/dataService';

export function PatientLabReports() {
  const { user } = useAuth();
  const { data: reports, loading } = useData(
    () => user?.id ? getLabReports({ patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );

  const handleDownload = (r: any) => {
    const text = `TakeCare HMS - Lab Result\n\nPatient: ${user?.name}\nDate: ${r.date}\nTest: ${r.test_name}\nOrdered By: ${r.doctor?.full_name ?? 'Doctor'}\nStatus: ${r.status}\nResult: ${r.result ?? 'Pending'}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabResult_${r.test_name}_${r.date}.txt`;
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
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Lab Reports</h1>
      {(reports ?? []).length === 0 ? (
        <EmptyState title="No lab reports" subtitle="Your lab results will appear here." />
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Test</th><th>Date</th><th>Ordered By</th><th>Result</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {(reports ?? []).map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{r.test_name}</td>
                  <td>{r.date}</td>
                  <td>{r.doctor?.full_name ?? '—'}</td>
                  <td>{r.result ?? 'Pending'}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    {r.status !== 'pending' && (
                      <button className="btn-icon" onClick={() => handleDownload(r)} title="Download Result"><Download size={16} /></button>
                    )}
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
