import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/**
 * Protects a route by role.
 * @param {string} role - 'student' | 'admin'
 * @param {string} redirectTo - where to send unauthenticated users
 */
const ProtectedRoute = ({ children, role, redirectTo }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo || (role === 'admin' ? '/admin/login' : '/')} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
