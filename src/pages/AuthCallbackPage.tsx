import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(() => {
        const requested = new URLSearchParams(location.search).get('redirect');
        const safe = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard';
        navigate(safe, { replace: true });
      });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, location.search]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-3">
      <Loader2 className="w-8 h-8 text-sand-200 animate-spin" />
      <p className="text-xs text-sand-300">Completing authentication handshake...</p>
    </div>
  );
};
