import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, BedDouble, FlaskConical,
  Pill, ReceiptText, Calendar, BarChart2, Settings, LogOut,
  FileText, ClipboardList, MessageSquare, User, Video
} from 'lucide-react';
import { useAuth, type Role } from '../../contexts/AuthContext';
import { Logo } from '../Logo';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
}

const adminNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/admin/dashboard' },
  { icon: Users,           label: 'Patients',     to: '/admin/patients' },
  { icon: UserCheck,       label: 'Doctors',      to: '/admin/doctors' },
  { icon: BedDouble,       label: 'Wards',        to: '/admin/wards' },
  { icon: FlaskConical,    label: 'Lab',          to: '/admin/lab' },
  { icon: Pill,            label: 'Pharmacy',     to: '/admin/pharmacy' },
  { icon: ReceiptText,     label: 'Billing',      to: '/admin/billing' },
  { icon: Calendar,        label: 'Appointments', to: '/admin/appointments' },
  { icon: BarChart2,       label: 'Reports',      to: '/admin/reports' },
  { icon: Settings,        label: 'Settings',     to: '/admin/settings' },
];

const doctorNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'My Dashboard',  to: '/doctor/dashboard' },
  { icon: Users,           label: 'My Patients',   to: '/doctor/patients' },
  { icon: Calendar,        label: 'Appointments',  to: '/doctor/appointments' },
  { icon: Video,           label: 'Video Sessions',to: '/doctor/video-sessions' },
  { icon: FileText,        label: 'Prescriptions', to: '/doctor/prescriptions' },
  { icon: FlaskConical,    label: 'Lab Orders',    to: '/doctor/lab-orders' },
  { icon: ClipboardList,   label: 'Ward Rounds',   to: '/doctor/ward-rounds' },
  { icon: MessageSquare,   label: 'Messages',      to: '/doctor/messages' },
  { icon: User,            label: 'My Profile',    to: '/doctor/profile' },
];

const patientNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/patient/dashboard' },
  { icon: Calendar,        label: 'Appointments',  to: '/patient/appointments' },
  { icon: Video,           label: 'Video Consults',to: '/patient/video-sessions' },
  { icon: FileText,        label: 'My Records',    to: '/patient/records' },
  { icon: Pill,            label: 'Prescriptions', to: '/patient/prescriptions' },
  { icon: FlaskConical,    label: 'Lab Reports',   to: '/patient/lab-reports' },
  { icon: ReceiptText,     label: 'Bills',         to: '/patient/bills' },
  { icon: User,            label: 'My Profile',    to: '/patient/profile' },
];

const roleNav: Record<Role, NavItem[]> = {
  admin: adminNav,
  doctor: doctorNav,
  patient: patientNav,
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'admin';
  const items = roleNav[role];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="mobile-overlay"
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 39, backdropFilter: 'blur(2px)' }}
        />
      )}

      <aside
        className={`sidebar${open ? ' open' : ''}`}
        style={{ transform: undefined }} // handled by CSS
      >
        {/* Logo */}
        <div style={{ padding: '20px 20px 0' }}>
          <Logo size={16} fontSize={15} />
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          <div className="nav-section-label">MAIN</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {items.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item nav-${role}${isActive ? ' active' : ''}`
                }
              >
                <Icon size={16} strokeWidth={1.5} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User row */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#F5F5F5', color: '#525252',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600, flexShrink: 0,
          }}>
            {user?.initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-3)', textTransform: 'capitalize' }}>
              {role}
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={handleLogout}
            title="Sign out"
            style={{ width: 32, height: 32 }}
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </>
  );
}
