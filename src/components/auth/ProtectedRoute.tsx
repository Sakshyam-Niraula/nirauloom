import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 space-y-3">
        <Loader2 className="w-8 h-8 text-sand-200 animate-spin" />
        <p className="text-xs text-sand-300">Verifying session permissions...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Requires admin role
  if (adminOnly && !user.is_admin) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-sand-100">Access Restricted</h2>
        <p className="text-xs text-sand-300/70">
          This section requires administrative moderator credentials.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <>{children}</>;
};
