import { useState } from 'react';
import { DollarSign, Download, CreditCard, Receipt, X, CheckCircle2 } from 'lucide-react';
import { useData, LoadingState } from '../../hooks/useData';
import { getInvoices, createInvoice } from '../../lib/dataService';
import { getAllPatients } from '../../lib/dataService';

export function AdminBilling() {
  const { data: invoices, loading, refetch } = useData(() => getInvoices(), []);
  const { data: patients } = useData(() => getAllPatients(), []);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const totalBilled = (invoices ?? []).reduce((a, b) => a + b.amount, 0);
  const collected = (invoices ?? []).filter(i => i.status === 'paid').reduce((a, b) => a + b.amount, 0);
  const pending = (invoices ?? []).filter(i => i.status === 'pending' || i.status === 'overdue').reduce((a, b) => a + b.amount, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await createInvoice({
        patient_id: fd.get('patientId') as string,
        description: fd.get('description') as string,
        amount: Number(fd.get('amount')),
        insurance_provider: (fd.get('insurance') as string) || null,
        date: new Date().toISOString().split('T')[0],
      });
      setInvoiceModal(false);
      setSuccessMsg('Invoice generated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleDownload = (invoice: any) => {
    const text = `TakeCare HMS - Invoice\n\nInvoice ID: ${invoice.invoice_number ?? invoice.id}\nDate: ${invoice.date}\nPatient: ${invoice.patient?.full_name ?? 'Unknown'}\nAmount: ₹${invoice.amount}\nStatus: ${invoice.status.toUpperCase()}\nInsurance: ${invoice.insurance_provider ?? 'None'}\nDescription: ${invoice.description ?? 'Consultation'}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoice_number ?? invoice.id}.txt`;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Billing</h1>
        <button className="btn btn-primary" onClick={() => setInvoiceModal(true)}>New Invoice</button>
      </div>

      {successMsg && (
        <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="icon-box" style={{ background: '#F0FDF4' }}><DollarSign size={18} color="#16A34A" /></div>
          <div><div className="stat-number">₹{(totalBilled / 100000).toFixed(2)}L</div><div className="stat-label">Total Billed</div></div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="icon-box" style={{ background: '#EFF6FF' }}><CreditCard size={18} color="#2563EB" /></div>
          <div><div className="stat-number">₹{(collected / 100000).toFixed(2)}L</div><div className="stat-label">Collected</div></div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, border: pending > 0 ? '1.5px solid var(--red)' : '' }}>
          <div className="icon-box" style={{ background: '#FEF2F2' }}><Receipt size={18} color="#DC2626" /></div>
          <div><div className="stat-number" style={{ color: 'var(--red)' }}>₹{(pending / 100000).toFixed(2)}L</div><div className="stat-label">Pending</div></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Patient</th><th>Date</th><th>Amount</th><th>Insurance</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {(invoices ?? []).map(i => (
              <tr key={i.id}>
                <td style={{ fontWeight: 500, color: '#0A0A0A' }}>{i.patient?.full_name ?? '—'}</td>
                <td>{i.date}</td>
                <td>₹{i.amount.toLocaleString()}</td>
                <td>{i.insurance_provider ?? 'Self Pay'}</td>
                <td>{statusBadge(i.status)}</td>
                <td><button className="btn-icon" onClick={() => handleDownload(i)}><Download size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoiceModal && (
        <div className="modal-overlay" onClick={() => setInvoiceModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Create New Invoice</div>
              <button className="btn-ghost" onClick={() => setInvoiceModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="input-label">Patient</label>
                <select name="patientId" className="input" required>
                  <option value="">Select patient...</option>
                  {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div><label className="input-label">Description</label><input name="description" className="input" required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label className="input-label">Amount (₹)</label><input name="amount" type="number" className="input" required /></div>
                <div><label className="input-label">Insurance</label><input name="insurance" className="input" placeholder="None" /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setInvoiceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
