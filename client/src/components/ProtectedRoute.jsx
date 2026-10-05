import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const staffRole = user.restaurants?.[0]?.role;

  // If user is kitchen staff, strictly prevent access to admin portal
  if (staffRole === 'KITCHEN' && allowedRoles && !allowedRoles.includes('KITCHEN')) {
    return <Navigate to="/kitchen" replace />;
  }

  return children;
}
