import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Shield,
  Loader2
} from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { GithubIcon } from '../components/brand/SocialIcons';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const AuthPage: React.FC = () => {
  const { signInWithPassword, signUp, signInWithOAuth, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithPassword(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          navigate('/dashboard');
        }
      } else if (mode === 'signup') {
        const res = await signUp(email, password, username, displayName);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(res.message || 'Account created successfully!');
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(res.message || 'Check your email for the reset link.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMsg('');
    setLoading(true);
    const res = await signInWithOAuth(provider);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Logo variant="horizontal" theme="dark" size="lg" className="justify-center" />
          <h2 className="text-xl font-bold text-sand-100 font-sans pt-2">
            {mode === 'signin' && 'Welcome to NIRAULOOM'}
            {mode === 'signup' && 'Join the Creator Registry'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-xs text-sand-300/70">
            {mode === 'signin' && 'Sign in to submit, bookmark, and organize digital creations.'}
            {mode === 'signup' && 'Create your creator identity to share and curate platforms.'}
            {mode === 'forgot' && 'Enter your verified email to receive instructions.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl bg-forest-900/60 border border-sand-200/20 p-6 sm:p-8 backdrop-blur-xl shadow-glass space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-forest-950 p-1 border border-sand-200/10 text-xs">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                mode === 'signin' ? 'bg-forest-800 text-sand-100 shadow-sm' : 'text-sand-300/70 hover:text-sand-100'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                mode === 'signup' ? 'bg-forest-800 text-sand-100 shadow-sm' : 'text-sand-300/70 hover:text-sand-100'
              }`}
            >
              Register
            </button>
          </div>

          {/* Social OAuth Buttons */}
          {mode !== 'forgot' && (
            <div className="space-y-2.5">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-sand-50 text-slate-800 text-xs font-semibold shadow-sm transition-all border border-sand-200/20"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* GitHub Button */}
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-forest-950 hover:bg-forest-900 text-sand-100 text-xs font-semibold transition-all border border-sand-200/20"
              >
                <GithubIcon className="w-4 h-4" />
                <span>Continue with GitHub</span>
              </button>

              <div className="relative py-2 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sand-200/10"></div></div>
                <span className="relative bg-forest-900 px-3 text-[11px] text-sand-300/50 uppercase">Or with email</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-sand-200 mb-1">Username *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/40" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. creative_coder"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-10 pr-3 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sand-200 mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/40" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-sand-200">Password *</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-electric-400 hover:text-electric-300"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/40" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/30 transition-all hover:shadow-glow-forest disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {mode === 'signin' && 'Sign In to Account'}
                {mode === 'signup' && 'Create Creator Account'}
                {mode === 'forgot' && 'Send Password Reset'}
              </span>
            </button>
          </form>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs text-sand-300 hover:text-sand-100"
              >
                ← Back to sign in
              </button>
            </div>
          )}
        </div>

        {/* Integration Status & Instructions Box */}
        <div className="rounded-2xl bg-forest-950/60 border border-sand-200/10 p-4 text-xs text-sand-300/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-sand-200">
              <Shield className="w-3.5 h-3.5 text-sand-300" />
              Auth Integration Setup Status
            </span>
            <button
              onClick={() => setShowConfigGuide(!showConfigGuide)}
              className="text-electric-400 hover:underline text-[11px]"
            >
              {showConfigGuide ? 'Hide Guide' : 'OAuth Setup Guide'}
            </button>
          </div>

          <p className="text-[11px] leading-relaxed">
            {isSupabaseConfigured
              ? 'Connected to live Supabase Auth instance. Session tokens persist across refreshes.'
              : 'Local preview mode active. You can sign in using any email or switch test personas anytime.'}
          </p>

          {showConfigGuide && (
            <div className="mt-2 pt-2 border-t border-sand-200/10 text-[11px] space-y-2">
              <p className="font-semibold text-sand-100">To enable live Google & GitHub OAuth:</p>
              <ol className="list-decimal pl-4 space-y-1 text-sand-300/80">
                <li>Create a project in your Supabase dashboard.</li>
                <li>Go to <strong>Authentication &gt; Providers</strong>.</li>
                <li>Enable <strong>Google</strong>: add Google Cloud OAuth Client ID and Secret (authorized redirect: <code className="text-sand-100">https://&lt;your-ref&gt;.supabase.co/auth/v1/callback</code>).</li>
                <li>Enable <strong>GitHub</strong>: add GitHub OAuth App ID and Secret.</li>
                <li>Set <code className="text-sand-100">VITE_SUPABASE_URL</code> and <code className="text-sand-100">VITE_SUPABASE_ANON_KEY</code> in <code className="text-sand-100">.env</code>.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
