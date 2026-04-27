import { useState } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getInvoices, updateInvoice } from '../../lib/dataService';

export function PatientBills() {
  const { user } = useAuth();
  const { data: invoices, loading, refetch } = useData(
    () => user?.id ? getInvoices({ patient_id: user.id }) : Promise.resolve([]),
    [user?.id]
  );
  const [successMsg, setSuccessMsg] = useState('');

  const handlePay = async (id: string) => {
    try {
      await updateInvoice(id, { status: 'paid', payment_method: 'Online', paid_at: new Date().toISOString() });
      setSuccessMsg('Payment successful!');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) { console.error(err); }
  };

  const handleDownload = (i: any) => {
    const text = `TakeCare HMS - Payment Receipt\n\nReceipt No: ${i.invoice_number ?? i.id}\nDate: ${i.paid_at ? new Date(i.paid_at).toLocaleString() : i.date}\nDescription: ${i.description}\nAmount Paid: ₹${i.amount}\nPayment Method: ${i.payment_method ?? 'Online'}\nStatus: ${i.status.toUpperCase()}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${i.invoice_number ?? i.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { paid: 'badge-green', pending: 'badge-amber', overdue: 'badge-red' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>;
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>My Bills</h1>
      {successMsg && (
        <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}
      {(invoices ?? []).length === 0 ? (
        <EmptyState title="No bills" subtitle="Your billing history will appear here." />
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Description</th><th>Date</th><th>Amount</th><th>Insurance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {(invoices ?? []).map(i => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{i.description}</td>
                  <td>{i.date}</td>
                  <td>₹{i.amount.toLocaleString()}</td>
                  <td>{i.insurance_provider ?? 'Self Pay'}</td>
                  <td>{statusBadge(i.status)}</td>
                  <td>
                    {i.status !== 'paid' ? (
                      <button className="btn btn-green btn-sm" onClick={() => handlePay(i.id)}>Pay Now</button>
                    ) : (
                      <button className="btn-icon" onClick={() => handleDownload(i)} title="Download Receipt"><Download size={16} /></button>
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
