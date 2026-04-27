import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useData, LoadingState, EmptyState } from '../../hooks/useData';
import { getWards, updateWard } from '../../lib/dataService';

export function DoctorWardRounds() {
  const { data: wards, loading, refetch } = useData(() => getWards(), []);
  const [editModal, setEditModal] = useState(false);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWard) return;
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await updateWard(selectedWard.id, { occupied_beds: Number(fd.get('occupiedBeds')) });
      setEditModal(false);
      setSuccessMsg('Ward capacity updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Ward Rounds</h1>

      {successMsg && (
        <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {(wards ?? []).length === 0 ? (
        <EmptyState title="No wards" subtitle="Wards will appear here." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {(wards ?? []).map(w => {
            const pct = w.total_beds > 0 ? Math.round(w.occupied_beds / w.total_beds * 100) : 0;
            return (
              <div key={w.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: '#A3A3A3' }}>{w.floor}</div>
                  </div>
                  <span className={`badge ${pct >= 90 ? 'badge-red' : 'badge-green'}`}>{w.occupied_beds}/{w.total_beds}</span>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setSelectedWard(w); setEditModal(true); }}>Update Beds</button>
              </div>
            );
          })}
        </div>
      )}

      {editModal && selectedWard && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Update Ward: {selectedWard.name}</div>
              <button className="btn-ghost" onClick={() => setEditModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="input-label">Total Beds</label><input className="input" value={selectedWard.total_beds} disabled /></div>
              <div><label className="input-label">Occupied Beds</label><input name="occupiedBeds" type="number" className="input" defaultValue={selectedWard.occupied_beds} max={selectedWard.total_beds} min={0} required /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
