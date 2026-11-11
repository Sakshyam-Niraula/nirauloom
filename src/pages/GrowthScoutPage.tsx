import React, { useState } from "react";
import { Copy, ExternalLink, Radar, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

type ScoutItem = {
  id: string;
  source: string;
  title: string;
  url: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  engagement: number;
  fitScore: number;
  why: string;
  draft: string;
};

export const GrowthScoutPage: React.FC = () => {
  const [items, setItems] = useState<ScoutItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);

  const runScout = async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    setError("");
    setNote("");
    setItems([]);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/growth-scout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Growth Scout request failed.");
      setItems(data.opportunities || []);
      setAiEnabled(Boolean(data.aiEnabled));
      setNote(data.note || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError("Clipboard access failed. Select and copy the draft manually.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-electric-300 text-xs font-bold uppercase tracking-wider">
            <Radar className="w-4 h-4" /> Nirauloom Intelligence
          </div>
          <h1 className="text-3xl font-extrabold text-sand-100 mt-2">Growth Scout</h1>
          <p className="text-sm text-sand-300/70 mt-2 max-w-2xl">
            Discover public project launches, assess creator fit, and prepare thoughtful invitations. Nothing is sent automatically.
          </p>
        </div>
        <button
          onClick={runScout}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-forest-700 hover:bg-forest-600 border border-sand-200/20 text-sand-100 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Researching public sources..." : "Run Growth Scout"}
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-4">
          <p className="text-xs text-sand-300/60">Sources</p>
          <p className="text-lg font-bold text-sand-100 mt-1">Hacker News + DEV</p>
        </div>
        <div className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-4">
          <p className="text-xs text-sand-300/60">Operating mode</p>
          <p className="text-lg font-bold text-sand-100 mt-1">Review before action</p>
        </div>
        <div className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-4">
          <p className="text-xs text-sand-300/60">AI analysis</p>
          <p className="text-lg font-bold text-sand-100 mt-1">{aiEnabled ? "Gemini enabled" : "Fallback / not run"}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-sand-200/10 bg-forest-900/30 p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
        <p className="text-xs text-sand-200/80">
          This tool only reads public launch posts. It does not collect private contact details, send messages, publish content, or modify creator accounts. Always open the source and decide whether an invitation is appropriate.
        </p>
      </div>

      {error && <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-200 p-3 text-sm">{error}</div>}
      {note && <p className="text-xs text-sand-300/70">{note}</p>}

      {!items.length && !loading && !error && (
        <div className="rounded-2xl border border-dashed border-sand-200/20 p-12 text-center">
          <Radar className="w-10 h-10 text-sand-300/40 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-sand-100">Ready to find your next creators</h2>
          <p className="text-sm text-sand-300/60 mt-2">Run the scout to search recent public project launches and creator discussions.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-sand-300/60">
                  <span>{item.source}</span><span>•</span><span>By {item.author}</span>
                </div>
                <h2 className="text-base font-bold text-sand-100 mt-2">{item.title}</h2>
                {item.excerpt && <p className="text-sm text-sand-300/70 mt-2">{item.excerpt}</p>}
              </div>
              <div className="shrink-0 rounded-xl bg-forest-800 border border-sand-200/10 px-3 py-2 text-center">
                <p className="text-xl font-extrabold text-sand-100">{item.fitScore}</p>
                <p className="text-[10px] text-sand-300/60">Fit score</p>
              </div>
            </div>
            <p className="text-xs text-sand-200/80"><strong>Why it surfaced:</strong> {item.why}</p>
            <div className="flex flex-wrap gap-3">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-electric-300 hover:underline">
                Open original source <ExternalLink className="w-3 h-3" />
              </a>
              <button onClick={() => setSelectedDraft(selectedDraft === item.id ? null : item.id)} className="text-xs text-sand-200 hover:text-white underline underline-offset-4">
                {selectedDraft === item.id ? "Hide invitation draft" : "Review invitation draft"}
              </button>
            </div>
            {selectedDraft === item.id && (
              <div className="space-y-2 border-t border-sand-200/10 pt-4">
                <label className="block text-xs font-semibold text-sand-200">Draft — edit before using</label>
                <textarea
                  value={item.draft}
                  onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, draft: event.target.value } : entry))}
                  rows={5}
                  className="w-full rounded-xl bg-forest-950 border border-sand-200/15 text-sand-100 text-sm p-3 focus:outline-none focus:border-electric-400"
                />
                <button onClick={() => copyText(item.draft)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-forest-700 hover:bg-forest-600 text-xs font-semibold text-sand-100">
                  <Copy className="w-3.5 h-3.5" /> Copy draft
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
