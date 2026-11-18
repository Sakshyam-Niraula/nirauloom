import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const EVENTS = [
  ['homepage_view', 'Homepage views'],
  ['signup_cta_click', 'Signup CTA clicks'],
  ['signup_form_submitted', 'Signup forms submitted'],
  ['signup_email_sent', 'Confirmation emails sent'],
  ['auth_completed', 'Completed sign-ins / registrations'],
  ['project_submission_succeeded', 'Successful project submissions'],
] as const;

export const ConversionAnalyticsPage: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase || !isSupabaseConfigured) {
        setError('Live database is not configured.');
        setLoading(false);
        return;
      }
      const db = supabase;
      if (!db) return;
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const results = await Promise.all(EVENTS.map(async ([event]) => {
        const result = await db.from('conversion_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_name', event)
          .gte('created_at', since);
        return { event, count: result.count || 0, error: result.error };
      }));
      if (!active) return;
      const failed = results.find((item) => item.error);
      if (failed) setError('Could not load funnel events. Confirm you are signed in as an administrator.');
      else setCounts(Object.fromEntries(results.map((item) => [item.event, item.count])));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const homepage = counts.homepage_view || 0;
  const signupClicks = counts.signup_cta_click || 0;
  const signupStarts = counts.signup_form_submitted || 0;
  const completed = counts.auth_completed || 0;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-electric-300">Admin analytics · Last 14 days</p>
        <h1 className="text-3xl font-extrabold text-sand-100 mt-2">Creator conversion funnel</h1>
        <p className="text-sm text-sand-300/70 mt-2">Measure whether visitors move from discovery to joining and publishing.</p>
      </header>
      {loading ? <p className="text-sm text-sand-300/70">Loading funnel data…</p> : error ? <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : (
        <>
          <section className="grid sm:grid-cols-2 gap-3">
            {EVENTS.map(([event, label]) => (
              <div key={event} className="rounded-xl border border-sand-200/15 bg-forest-900/45 p-5">
                <p className="text-2xl font-extrabold text-sand-100 tabular-nums">{counts[event] || 0}</p>
                <p className="text-xs text-sand-300/70 mt-1">{label}</p>
              </div>
            ))}
          </section>
          <section className="rounded-2xl border border-sand-200/15 bg-forest-900/35 p-5 space-y-3">
            <h2 className="font-bold text-sand-100">Funnel rates</h2>
            <p className="text-sm text-sand-300/80">Homepage → signup click: <strong>{homepage ? Math.round(signupClicks / homepage * 100) : 0}%</strong></p>
            <p className="text-sm text-sand-300/80">Signup click → form submitted: <strong>{signupClicks ? Math.round(signupStarts / signupClicks * 100) : 0}%</strong></p>
            <p className="text-sm text-sand-300/80">Signup submitted → auth completed: <strong>{signupStarts ? Math.round(completed / signupStarts * 100) : 0}%</strong></p>
            <p className="text-xs text-sand-300/50">These are event counts, not unique people. Repeat visits and sign-ins can count more than once. New tracking begins after this release.</p>
          </section>
        </>
      )}
    </main>
  );
};
