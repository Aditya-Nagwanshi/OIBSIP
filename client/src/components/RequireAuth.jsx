import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './ui/PageLoader';

export default function RequireAuth({ children, admin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session" />;

  if (!isAuthenticated) {
    const loginPath = admin ? '/admin/login' : `/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
    return <Navigate to={loginPath} replace />;
  }

  if (admin && !isAdmin) return <Navigate to="/admin/login" replace />;

  return children;
}
