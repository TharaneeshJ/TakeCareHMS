import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type Role } from '../contexts/AuthContext';

interface Props { allowedRoles: Role[]; }

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isAuthenticated, loading } = useAuth();

  // Show nothing while checking session
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: '"DM Sans", sans-serif',
        color: '#A3A3A3', fontSize: 14,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, border: '3px solid #E5E5E5',
            borderTopColor: '#16A34A', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user!.role)) {
    const redirects: Record<Role, string> = {
      admin: '/admin/dashboard',
      doctor: '/doctor/dashboard',
      patient: '/patient/dashboard',
    };
    return <Navigate to={redirects[user!.role]} replace />;
  }

  return <Outlet />;
}
