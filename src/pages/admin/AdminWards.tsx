import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useData, LoadingState } from '../../hooks/useData';
import { getWards, createWard, updateWard } from '../../lib/dataService';
import type { Ward } from '../../lib/database.types';

export function AdminWards() {
  const { data: wards, loading, refetch } = useData(() => getWards(), []);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await createWard({
        name: fd.get('name') as string,
        floor: fd.get('floor') as string,
        total_beds: Number(fd.get('totalBeds')),
        occupied_beds: 0,
        ward_type: fd.get('wardType') as string,
      });
      setAddModal(false);
      setSuccessMsg('Ward added successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWard) return;
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await updateWard(selectedWard.id, {
        name: fd.get('name') as string,
        floor: fd.get('floor') as string,
        total_beds: Number(fd.get('totalBeds')),
        ward_type: fd.get('wardType') as string,
      });
      setEditModal(false);
      setSuccessMsg('Ward updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) {
      setSuccessMsg(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Wards</h1>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>Add Ward</button>
      </div>

      {successMsg && (
        <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {(wards ?? []).map(w => {
          const pct = w.total_beds > 0 ? Math.round(w.occupied_beds / w.total_beds * 100) : 0;
          const fill = pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : '#16A34A';
          return (
            <div key={w.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: '#A3A3A3' }}>{w.floor}</div>
                </div>
                <span className={`badge ${pct >= 90 ? 'badge-red' : pct >= 70 ? 'badge-amber' : 'badge-green'}`}>{w.ward_type}</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: '#525252' }}>{w.occupied_beds} / {w.total_beds} beds</span>
                  <span style={{ fontWeight: 600, color: fill }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: '#F5F5F5', borderRadius: 9999 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: fill, borderRadius: 9999, transition: 'width 0.6s' }} />
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setSelectedWard(w); setEditModal(true); }}>Manage</button>
            </div>
          );
        })}
      </div>

      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>Add New Ward</div>
              <button className="btn-ghost" onClick={() => setAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="input-label">Ward Name</label><input name="name" className="input" required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label className="input-label">Floor</label><input name="floor" className="input" defaultValue="Floor 1" required /></div>
                <div><label className="input-label">Total Beds</label><input name="totalBeds" type="number" className="input" required /></div>
              </div>
              <div><label className="input-label">Ward Type</label>
                <select name="wardType" className="input" required>
                  <option>General</option><option>Specialized</option><option>Critical Care</option><option>Surgical</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Ward</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal && selectedWard && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>Edit Ward</div>
              <button className="btn-ghost" onClick={() => setEditModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label className="input-label">Ward Name</label><input name="name" className="input" defaultValue={selectedWard.name} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label className="input-label">Floor</label><input name="floor" className="input" defaultValue={selectedWard.floor} required /></div>
                <div><label className="input-label">Total Beds</label><input name="totalBeds" type="number" className="input" defaultValue={selectedWard.total_beds} required /></div>
              </div>
              <div><label className="input-label">Ward Type</label>
                <select name="wardType" className="input" defaultValue={selectedWard.ward_type} required>
                  <option>General</option><option>Specialized</option><option>Critical Care</option><option>Surgical</option>
                </select>
              </div>
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
