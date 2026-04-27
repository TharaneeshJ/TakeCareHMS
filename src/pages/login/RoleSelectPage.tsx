import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Stethoscope, User, ArrowRight } from 'lucide-react';
import { Logo } from '../../components/Logo';

type Role = 'admin' | 'doctor' | 'patient';

const roles = [
  { id: 'admin' as Role, icon: Shield, label: 'Administrator', desc: 'Full system access, staff management and reporting.', iconBg: '#FAFAFA', iconColor: '#0A0A0A', accent: '#0A0A0A' },
  { id: 'doctor' as Role, icon: Stethoscope, label: 'Doctor', desc: 'Patient records, appointments and prescriptions.', iconBg: '#EFF6FF', iconColor: '#2563EB', accent: '#2563EB' },
  { id: 'patient' as Role, icon: User, label: 'Patient', desc: 'Book appointments, view reports and bills.', iconBg: '#F0FDF4', iconColor: '#16A34A', accent: '#16A34A' },
];

export function RoleSelectPage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const nav = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 40 }}><Logo size={22} fontSize={19} /></div>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em', marginBottom: 8 }}>Who are you?</h1>
        <p style={{ fontSize: 14, color: '#A3A3A3' }}>Select your role to continue to the login screen.</p>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        {roles.map(({ id, icon: Icon, label, desc, iconBg, iconColor, accent }) => {
          const active = selected === id;
          return (
            <div key={id} onClick={() => setSelected(id)}
              style={{ background: '#FFFFFF', border: active ? `1.5px solid ${accent}` : '1px solid #E5E5E5', boxShadow: active ? `0 8px 32px ${accent}1A` : 'none', borderRadius: 14, padding: 32, width: 220, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', transform: active ? 'translateY(-2px)' : 'none' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon size={26} strokeWidth={1.5} color={iconColor} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 13, color: '#A3A3A3', lineHeight: 1.5 }}>{desc}</div>
            </div>
          );
        })}
      </div>
      <button className="btn btn-primary" disabled={!selected} onClick={() => selected && nav(`/login/${selected}`)} style={{ width: 240, justifyContent: 'center' }}>
        Continue <ArrowRight size={15} strokeWidth={1.5} />
      </button>
      <a href="/" style={{ marginTop: 20, fontSize: 13, color: '#A3A3A3', textDecoration: 'none', transition: 'color 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#0A0A0A')}
        onMouseLeave={e => (e.currentTarget.style.color = '#A3A3A3')}>← Back to home</a>
    </div>
  );
}
