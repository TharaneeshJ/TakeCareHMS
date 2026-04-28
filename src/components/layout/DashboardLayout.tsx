import { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, ChevronDown, LogOut, User } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const pageTitles: Record<string, string> = {
  '/admin/dashboard':   'Dashboard',
  '/admin/patients':    'Patients',
  '/admin/doctors':     'Doctors',
  '/admin/wards':       'Wards',
  '/admin/lab':         'Laboratory',
  '/admin/pharmacy':    'Pharmacy',
  '/admin/billing':     'Billing',
  '/admin/appointments':'Appointments',
  '/admin/reports':     'Reports',
  '/admin/settings':    'Settings',
  '/doctor/dashboard':  'My Dashboard',
  '/doctor/patients':   'My Patients',
  '/doctor/appointments':'Appointments',
  '/doctor/prescriptions':'Prescriptions',
  '/doctor/lab-orders': 'Lab Orders',
  '/doctor/ward-rounds':'Ward Rounds',
  '/doctor/messages':   'Messages',
  '/doctor/profile':    'My Profile',
  '/doctor/video-sessions': 'Video Consultations',
  '/patient/dashboard': 'Dashboard',
  '/patient/appointments':'Appointments',
  '/patient/video-sessions': 'Video Consultations',
  '/patient/records':   'Medical Records',
  '/patient/prescriptions':'Prescriptions',
  '/patient/lab-reports':'Lab Reports',
  '/patient/bills':     'Bills & Payments',
  '/patient/profile':   'My Profile',
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const pageTitle = pageTitles[location.pathname] ?? 'TakeCare HMS';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          {/* Left — hamburger + page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(v => !v)}
            >
              <Menu size={16} strokeWidth={1.5} />
            </button>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              {pageTitle}
            </span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search */}
            <div className="topbar-search" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} strokeWidth={1.5} style={{ position: 'absolute', left: 10, color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input
                className="input"
                placeholder="Search…"
                style={{ width: 180, height: 36, paddingLeft: 32, fontSize: 13 }}
              />
            </div>

            {/* Bell */}
            <button className="btn-icon" style={{ position: 'relative' }}>
              <Bell size={16} strokeWidth={1.5} />
              <span style={{
                position: 'absolute', top: 8, right: 8,
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--red)', border: '1.5px solid #fff',
              }} />
            </button>

            {/* Avatar Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#F5F5F5', color: '#525252',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 600,
                }}>
                  {user?.initials}
                </div>
                <ChevronDown size={14} strokeWidth={1.5} style={{ color: 'var(--text-3)' }} />
              </div>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                  width: 200, background: '#fff', borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #E5E5E5',
                  zIndex: 50, padding: '8px'
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E5E5', marginBottom: '4px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: '#737373', textTransform: 'capitalize' }}>{user?.role}</div>
                  </div>
                  <div 
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#525252', borderRadius: 4 }}
                    onClick={() => { setDropdownOpen(false); navigate(`/${user?.role}/profile`); }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <User size={14} /> My Profile
                  </div>
                  <div 
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#DC2626', borderRadius: 4 }}
                    onClick={handleLogout}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} /> Sign out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
