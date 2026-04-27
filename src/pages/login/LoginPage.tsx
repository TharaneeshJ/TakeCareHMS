import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Stethoscope, User, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../contexts/AuthContext';

type RoleId = 'admin' | 'doctor' | 'patient';

const config: Record<RoleId, {
  icon: React.ElementType; label: string; tagline: string;
  color: string; btnClass: string;
  bullets: string[];
}> = {
  admin: {
    icon: Shield, label: 'Administrator', tagline: 'Full control over your hospital ecosystem.',
    color: '#0A0A0A', btnClass: 'btn-primary',
    bullets: ['Full system control', 'Staff management', 'Reports & analytics'],
  },
  doctor: {
    icon: Stethoscope, label: 'Doctor', tagline: 'Your patients and schedule, at a glance.',
    color: '#2563EB', btnClass: 'btn-blue',
    bullets: ['Patient records & EMR', 'Appointment calendar', 'Prescriptions & lab orders'],
  },
  patient: {
    icon: User, label: 'Patient', tagline: 'Your health journey, all in one place.',
    color: '#16A34A', btnClass: 'btn-green',
    bullets: ['Book appointments', 'View lab reports', 'Medical history'],
  },
};

export function LoginPage() {
  const { role } = useParams<{ role: string }>();
  const roleId = (role as RoleId) ?? 'admin';
  const cfg = config[roleId] ?? config.admin;
  const Icon = cfg.icon;
  const nav = useNavigate();
  const { login, signup } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const redirects: Record<RoleId, string> = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    patient: '/patient/dashboard',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isSignup) {
        if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
        const { error: signupErr } = await signup(email, pass, fullName, roleId);
        if (signupErr) { setError(signupErr); setLoading(false); return; }
        setSuccessMsg('Account created! Check your email to verify, then sign in.');
        setIsSignup(false);
        setLoading(false);
        return;
      }

      const { error: loginErr } = await login(email, pass);
      if (loginErr) { setError(loginErr); setLoading(false); return; }
      nav(redirects[roleId]);
    } catch {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif' }}>
      {/* Left dark panel */}
      <div style={{ width: '45%', background: '#0A0A0A', display: 'flex', flexDirection: 'column', padding: '40px 48px' }}>
        <Logo dark size={18} fontSize={16} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: '#111111', border: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon size={32} strokeWidth={1.5} color={cfg.color} />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.025em', marginBottom: 8 }}>{cfg.label}</h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: '#A3A3A3', marginBottom: 40 }}>{cfg.tagline}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left', width: '100%', maxWidth: 260 }}>
            {cfg.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#111111', border: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} strokeWidth={2} color="#16A34A" />
                </div>
                <span style={{ fontSize: 13, color: '#A3A3A3' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.025em', marginBottom: 6 }}>
            {isSignup ? 'Create account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 14, color: '#A3A3A3', marginBottom: 32 }}>
            {isSignup ? `Register as a ${cfg.label}.` : `Sign in to your ${cfg.label} account.`}
          </p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#FEF2F2', color: '#DC2626', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
              <Check size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isSignup && (
              <div>
                <label className="input-label">Full Name</label>
                <input className="input" type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="input-label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="input-label" style={{ margin: 0 }}>Password</label>
                {!isSignup && (
                  <button type="button" className="btn-ghost" style={{ fontSize: 12 }}>Forgot password?</button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input className="input" type={show ? 'text' : 'password'} placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required minLength={6} style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A3', display: 'flex', padding: 0 }}>
                  {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            <button type="submit" className={`btn ${cfg.btnClass}`} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? `Create ${cfg.label} Account` : `Sign in as ${cfg.label}`)}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E5E5E5' }} />
            <span style={{ fontSize: 12, color: '#A3A3A3' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#E5E5E5' }} />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); }}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>

          <button type="button" className="btn-ghost" style={{ marginTop: 20, fontSize: 13, display: 'block' }} onClick={() => nav('/login')}>
            ← Change role
          </button>
        </div>
      </div>
    </div>
  );
}
