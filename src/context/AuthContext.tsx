import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';
import { SEED_PROFILES } from '../data/seedData';

interface AuthContextType {
  user: Profile | null;
  session: unknown;
  loading: boolean;
  isLiveSupabase: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, username: string, displayName: string) => Promise<{ error?: string; message?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  switchDemoUser: (profileId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'nirauloom_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // If Supabase is configured, start strictly with null and wait for real session
  // If in preview mode, load from localStorage or default to Elena
  const [user, setUser] = useState<Profile | null>(() => {
    if (isSupabaseConfigured) {
      return null;
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return SEED_PROFILES[0];
      }
    }
    return SEED_PROFILES[0];
  });

  const [session, setSession] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch initial live session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      // 2. Subscribe to auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSupabaseProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUser(data);
      } else {
        // Fallback profile if profile row wasn't created yet by trigger
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const fallbackProfile: Profile = {
            id: authData.user.id,
            username: authData.user.email?.split('@')[0] || 'creator',
            display_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Creator',
            avatar_url: authData.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authData.user.id}`,
            is_admin: false,
            created_at: new Date().toISOString(),
          };
          setUser(fallbackProfile);
        }
      }
    } catch (e) {
      console.warn('Could not fetch Supabase profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async (email: string, pass: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: error.message };
      return {};
    }

    // Local simulated auth (preview mode only)
    const matched = SEED_PROFILES.find(p => p.username.toLowerCase() === email.toLowerCase() || p.id === email) || {
      id: `user-${Date.now()}`,
      username: email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'explorer',
      display_name: email.split('@')[0] || 'Digital Explorer',
      bio: 'Digital explorer discovering the internet through NIRAULOOM.',
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`,
      is_admin: email.includes('admin'),
      created_at: new Date().toISOString(),
    };

    setUser(matched);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(matched));
    return {};
  };

  const signUp = async (email: string, pass: string, username: string, displayName: string): Promise<{ error?: string; message?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            username,
            full_name: displayName,
          }
        }
      });
      if (error) return { error: error.message };
      return { message: 'Confirmation link sent to your email address.' };
    }

    const newUser: Profile = {
      id: `user-${Date.now()}`,
      username: username || email.split('@')[0],
      display_name: displayName || username || 'Creator',
      bio: 'New creator on NIRAULOOM.',
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      is_admin: false,
      created_at: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    return { message: 'Account successfully registered and active!' };
  };

  const signInWithOAuth = async (provider: 'google' | 'github'): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) return { error: error.message };
      return {};
    }

    return {
      error: `Live ${provider.toUpperCase()} OAuth requires configuring client ID and secret in your Supabase dashboard.`
    };
  };

  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) return { error: error.message };
      return { message: 'Password recovery email sent.' };
    }
    return { message: 'Password recovery link has been simulated. In live mode with Supabase credentials, an email will be dispatched.' };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };

    // Disallow elevating is_admin on client side
    const safeUpdates = { ...updates };
    delete safeUpdates.is_admin;

    const updated = { ...user, ...safeUpdates };
    setUser(updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.id);
      if (error) return { error: error.message };
    } else {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
    }

    return {};
  };

  /**
   * Test persona switching: STRICTLY prohibited when Supabase is configured!
   * Only active during local sandbox evaluation.
   */
  const switchDemoUser = (profileId: string) => {
    if (isSupabaseConfigured) {
      console.warn('Test persona switching is disabled when live Supabase authentication is active.');
      return;
    }
    const found = SEED_PROFILES.find(p => p.id === profileId);
    if (found) {
      setUser(found);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(found));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isLiveSupabase: isSupabaseConfigured,
        signInWithPassword,
        signUp,
        signInWithOAuth,
        resetPassword,
        signOut,
        updateProfile,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
