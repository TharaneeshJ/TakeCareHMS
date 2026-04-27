import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useData, LoadingState } from '../../hooks/useData';
import { getHospitalSettings, updateHospitalSettings } from '../../lib/dataService';

export function AdminSettings() {
  const { data: settings, loading } = useData(() => getHospitalSettings(), []);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.id) return;
    setSaving(true);
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await updateHospitalSettings(settings.id, {
        hospital_name: fd.get('hospitalName') as string,
        address: fd.get('address') as string,
        email: fd.get('email') as string,
        phone: fd.get('phone') as string,
        currency: fd.get('currency') as string,
        timezone: fd.get('timezone') as string,
        date_format: fd.get('dateFormat') as string,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em' }}>Settings</h1>

      {success && (
        <div style={{ padding: 16, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <CheckCircle2 size={18} /> Settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 20 }}>Hospital Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label className="input-label">Hospital Name</label><input name="hospitalName" className="input" defaultValue={settings?.hospital_name ?? ''} /></div>
            <div><label className="input-label">Address</label><input name="address" className="input" defaultValue={settings?.address ?? ''} /></div>
            <div><label className="input-label">Contact Email</label><input name="email" type="email" className="input" defaultValue={settings?.email ?? ''} /></div>
            <div><label className="input-label">Phone</label><input name="phone" type="tel" className="input" defaultValue={settings?.phone ?? ''} /></div>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 20 }}>System Preferences</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label className="input-label">Currency</label><input name="currency" className="input" defaultValue={settings?.currency ?? 'INR'} /></div>
            <div><label className="input-label">Time Zone</label><input name="timezone" className="input" defaultValue={settings?.timezone ?? 'Asia/Kolkata'} /></div>
            <div><label className="input-label">Date Format</label><input name="dateFormat" className="input" defaultValue={settings?.date_format ?? 'YYYY-MM-DD'} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </form>
    </div>
  );
}
