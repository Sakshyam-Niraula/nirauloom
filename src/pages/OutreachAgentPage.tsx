import React, { useEffect, useState } from "react";
import { Activity, Bot, Mail, PauseCircle, Save, Search, ShieldCheck, Sparkles, Link2, Unlink } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

type Settings = {
  target_description: string;
  minimum_fit_score: number;
  daily_limit: number;
  tone: string;
  max_email_words: number;
};

type Lead = {
  id: string;
  source: string;
  title: string;
  url: string;
  author: string;
  fitScore: number;
  why: string;
  draft: string;
};

const DEFAULTS: Settings = {
  target_description: "Independent creators, indie makers, student builders, and early-stage founders with a real project or product who may benefit from discovery.",
  minimum_fit_score: 75,
  daily_limit: 5,
  tone: "Friendly, concise, specific, and respectful. Never pushy or exaggerated.",
  max_email_words: 120,
};

const inputClass = "w-full rounded-xl bg-forest-950 border border-sand-200/15 text-sand-100 text-sm p-3 focus:outline-none focus:border-electric-400";
const labelClass = "block text-xs font-semibold text-sand-200 mb-2";

export const OutreachAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastRun, setLastRun] = useState("");
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; email?: string | null; configured?: boolean }>({ connected: false, configured: false });
  const [connectingGmail, setConnectingGmail] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !user?.id) { setLoadingSettings(false); return; }
      const { data, error: loadError } = await supabase
        .from("outreach_agent_settings")
        .select("target_description,minimum_fit_score,daily_limit,tone,max_email_words")
        .eq("admin_user_id", user.id)
        .maybeSingle();
      if (loadError) setError("Could not load saved agent instructions. Apply the database migration first.");
      if (data) setSettings({ ...DEFAULTS, ...data });
      setLoadingSettings(false);
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailResult = params.get("gmail");
    if (gmailResult) {
      const messages: Record<string, string> = {
        connected: "Gmail connected successfully.",
        wrong_account: "Please authorize with hello.nirauloom@gmail.com, not another Google account.",
        cancelled: "Google authorization was cancelled.",
        invalid_state: "Authorization expired or could not be verified. Please try again.",
        token_error: "Google did not return a refresh token. Try connecting again and approve access.",
      };
      setNotice(messages[gmailResult] || "Gmail connection could not be completed.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    const loadStatus = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const response = await fetch("/api/gmail/status", { headers: { Authorization: `Bearer ${session.access_token}`, "X-Supabase-Anon-Key": import.meta.env.VITE_SUPABASE_ANON_KEY } });
      if (response.ok) setGmailStatus(await response.json());
    };
    loadStatus();
  }, []);

  const connectGmail = async () => {
    if (!supabase) { setError("Supabase is not configured."); return; }
    setConnectingGmail(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/gmail/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY }),
      });
      const result = await response.json();
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error || "Could not start Gmail authorization.");
      window.location.assign(result.authorizationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect Gmail.");
      setConnectingGmail(false);
    }
  };

  const saveSettings = async () => {
    if (!supabase || !user?.id) { setError("Please sign in with the live admin account."); return; }
    setSaving(true); setError(""); setNotice("");
    const { error: saveError } = await supabase.from("outreach_agent_settings").upsert({
      admin_user_id: user.id,
      ...settings,
      enabled: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "admin_user_id" });
    if (saveError) setError(saveError.message);
    else setNotice("Your permanent outreach instructions have been saved. Sending remains paused until an email provider is connected and verified.");
    setSaving(false);
  };

  const runResearch = async () => {
    if (!supabase) { setError("Supabase is not configured."); return; }
    setRunning(true); setError(""); setNotice(""); setLeads([]);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/growth-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Research could not be completed.");
      const candidates = (result.opportunities || []).filter((item: Lead) => Number(item.fitScore) >= settings.minimum_fit_score);
      setLeads(candidates);
      setLastRun(new Date().toLocaleString());
      setNotice(`Research complete. ${candidates.length} candidate(s) met your minimum fit score. No emails were sent.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research failed.");
    } finally {
      setRunning(false);
    }
  };

  const update = <K extends keyof Settings,>(key: K, value: Settings[K]) =>
    setSettings(current => ({ ...current, [key]: value }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-electric-300 text-xs font-bold uppercase tracking-wider"><Bot className="w-4 h-4" /> Nirauloom Intelligence</div>
          <h1 className="text-3xl font-extrabold text-sand-100 mt-2">Autonomous Outreach</h1>
          <p className="text-sm text-sand-300/70 mt-2 max-w-2xl">Set your instructions once. The agent uses them to identify relevant makers and prepare personalized outreach. Sending is currently locked until a verified sender is connected.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200"><PauseCircle className="w-4 h-4" /> Sending paused</span>
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-4"><p className="text-xs text-sand-300/60">Research sources</p><p className="text-lg font-bold text-sand-100 mt-1">Hacker News + DEV</p></div>
        <div className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-4"><p className="text-xs text-sand-300/60">Daily sending ceiling</p><p className="text-lg font-bold text-sand-100 mt-1">{settings.daily_limit} emails</p></div>
        <div className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-4"><p className="text-xs text-sand-300/60">Current run</p><p className="text-lg font-bold text-sand-100 mt-1">{leads.length} qualified leads</p></div>
      </div>

      <section className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-300" /><h2 className="text-lg font-bold text-sand-100">Standing instructions</h2></div>
        {loadingSettings ? <p className="text-sm text-sand-300/60">Loading saved instructions…</p> : <>
          <div><label className={labelClass}>Who should the agent look for?</label><textarea className={inputClass} rows={4} value={settings.target_description} onChange={e => update("target_description", e.target.value)} maxLength={1200} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Minimum fit score ({settings.minimum_fit_score}/100)</label><input className={inputClass} type="number" min={50} max={100} value={settings.minimum_fit_score} onChange={e => update("minimum_fit_score", Math.max(50, Math.min(100, Number(e.target.value))))} /></div>
            <div><label className={labelClass}>Daily email ceiling (max 5)</label><input className={inputClass} type="number" min={1} max={5} value={settings.daily_limit} onChange={e => update("daily_limit", Math.max(1, Math.min(5, Number(e.target.value))))} /></div>
          </div>
          <div><label className={labelClass}>Writing style and tone</label><textarea className={inputClass} rows={3} value={settings.tone} onChange={e => update("tone", e.target.value)} maxLength={500} /></div>
          <div><label className={labelClass}>Maximum email length (words)</label><input className={inputClass} type="number" min={60} max={150} value={settings.max_email_words} onChange={e => update("max_email_words", Math.max(60, Math.min(150, Number(e.target.value))))} /></div>
          <div className="flex flex-wrap items-center gap-3"><button onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-electric-600 hover:bg-electric-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="w-4 h-4" />{saving ? "Saving…" : "Save instructions"}</button><span className="text-xs text-sand-300/50">Saved per admin account</span></div>
        </>}
      </section>

      <section className="rounded-2xl border border-sand-200/10 bg-forest-900/30 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div><h2 className="text-lg font-bold text-sand-100">Research and draft</h2><p className="text-xs text-sand-300/60 mt-1">Find recent public maker activity and prepare personalized drafts using the current Growth Scout research feed.</p></div>
          <button onClick={runResearch} disabled={running} className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-600 border border-sand-200/20 px-4 py-2.5 text-sm font-semibold text-sand-100 disabled:opacity-50">{running ? <Activity className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}{running ? "Researching…" : "Run research"}</button>
        </div>
        {lastRun && <p className="text-[11px] text-sand-300/45">Last run: {lastRun}</p>}
        {error && <p className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {notice && <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
        {leads.map(lead => <article key={lead.id} className="rounded-xl border border-sand-200/10 bg-forest-950/60 p-4 space-y-2">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-sand-300/50">{lead.source} · {lead.author}</p><h3 className="font-semibold text-sand-100 mt-1">{lead.title}</h3></div><span className="rounded-lg bg-forest-800 px-2 py-1 text-xs font-bold text-emerald-300">{lead.fitScore}/100</span></div>
          <p className="text-xs text-sand-300/70">{lead.why}</p><a className="text-xs text-electric-300 underline" href={lead.url} target="_blank" rel="noreferrer">Open source</a>
          <details className="pt-2"><summary className="cursor-pointer text-xs font-semibold text-sand-200">View generated draft</summary><p className="mt-3 whitespace-pre-wrap text-sm text-sand-200/80">{lead.draft}</p></details>
          <p className="text-[11px] text-amber-200/80">No verified public contact email was supplied by this feed. This candidate cannot be emailed automatically.</p>
        </article>)}
        {!leads.length && !running && <div className="rounded-xl border border-dashed border-sand-200/15 p-8 text-center"><Sparkles className="w-8 h-8 text-sand-300/35 mx-auto mb-2" /><p className="text-sm text-sand-300/60">Run research to see matching creators and draft examples here.</p></div>}
      </section>

      <section className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sand-100 font-semibold"><Mail className="w-4 h-4" /> Gmail sender connection</div>
        {gmailStatus.connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-semibold text-emerald-300">Connected</p><p className="text-xs text-sand-300/70">{gmailStatus.email}</p></div>
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 px-3 py-2 text-xs text-emerald-200"><Link2 className="w-4 h-4" /> Authorized</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-sand-200/75">Connect the dedicated Nirauloom Gmail account. Google will ask you to sign in and grant the Gmail sending permission.</p>
            <button onClick={connectGmail} disabled={connectingGmail || gmailStatus.configured === false} className="inline-flex items-center gap-2 rounded-xl bg-electric-600 hover:bg-electric-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Link2 className="w-4 h-4" />{connectingGmail ? "Opening Google…" : "Connect Gmail"}</button>
            {gmailStatus.configured === false && <p className="text-xs text-amber-200/80">Server setup is not complete yet. Add the Cloudflare secrets listed in the setup instructions before connecting.</p>}
          </>
        )}
        <p className="text-xs text-sand-300/55">Connecting Gmail does not enable automatic sending. Outreach remains paused until sending safeguards and a test workflow are implemented.</p>
        <p className="text-xs text-sand-300/55">Only use contact addresses explicitly published for project/business enquiries; respect opt-outs; identify Nirauloom honestly; never guess addresses or send repeated follow-ups.</p>
      </section>
    </div>
  );
};
