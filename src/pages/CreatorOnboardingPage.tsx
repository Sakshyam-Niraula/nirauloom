import React, { useState } from "react";
import { Sparkles, ClipboardList, ExternalLink } from "lucide-react";

type Draft = { name: string; tagline: string; description: string; category: string; tags: string[]; pricing_type: string };

export const CreatorOnboardingPage: React.FC = () => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const generate = async () => {
    setError(""); setNote(""); setDraft(null);
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { setError("Enter a valid project URL, including https://."); return; }
    if (!["https:", "http:"].includes(parsed.protocol)) { setError("Only public website URLs are supported."); return; }
    if (!name.trim() || details.trim().length < 30) { setError("Add a project name and at least 30 characters describing what it does."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: "You are Nirauloom's creator onboarding assistant. Create an accurate draft listing only from supplied information. Do not invent features, users, claims, pricing or metrics. If information is missing, use cautious wording. Return JSON only with name, tagline (max 12 words), description (50-90 words), category (one of AI & Machine Learning, Developer Tools, Design & Creative, Productivity, Education, Gaming, Healthcare, E-commerce, Other), tags (3-5 short strings), pricing_type (Free, Freemium, Paid, Open Source, Contact).",
          prompt: JSON.stringify({ projectUrl: parsed.href, projectName: name.trim(), creatorProvidedDescription: details.trim() })
        })
      });
      const data = await response.json();
      if (!response.ok || !data.text) throw new Error(data.error || "AI drafting is unavailable. Check the server Gemini configuration.");
      const raw = String(data.text).replace(/^\u0060\u0060\u0060(?:json)?/i, "").replace(/\u0060\u0060\u0060$/,"").trim();
      const result = JSON.parse(raw) as Draft;
      if (!result.name || !result.tagline || !result.description) throw new Error("The AI response was incomplete. Please try again.");
      setDraft(result);
      setNote("Draft generated from the information you supplied. Verify every field against the live project before submitting.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create the listing draft."); }
    finally { setLoading(false); }
  };

  return <div className="max-w-4xl mx-auto space-y-6">
    <div><div className="text-xs uppercase tracking-wider text-electric-300 font-bold">Nirauloom Intelligence</div><h2 className="text-2xl font-extrabold text-sand-100 mt-2">Creator Onboarding</h2><p className="text-sm text-sand-300/70 mt-2">Turn a creator-provided project URL and description into a suggested listing. Nothing is submitted automatically.</p></div>
    <div className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-5 space-y-4">
      <div><label className="block text-xs text-sand-200 mb-1">Public project URL</label><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://yourproject.com" className="w-full rounded-lg bg-forest-950 border border-sand-200/15 p-3 text-sm text-sand-100"/></div>
      <div><label className="block text-xs text-sand-200 mb-1">Project name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Project name" className="w-full rounded-lg bg-forest-950 border border-sand-200/15 p-3 text-sm text-sand-100"/></div>
      <div><label className="block text-xs text-sand-200 mb-1">What does it do? (creator-provided details)</label><textarea value={details} onChange={e=>setDetails(e.target.value)} rows={4} placeholder="Describe the product, who it helps, key features, and pricing if known." className="w-full rounded-lg bg-forest-950 border border-sand-200/15 p-3 text-sm text-sand-100"/></div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-sand-100 disabled:opacity-50"><Sparkles className="w-4 h-4"/>{loading ? "Preparing listing..." : "Generate listing draft"}</button>
    </div>
    {note && <p className="text-xs text-emerald-300">{note}</p>}
    {draft && <div className="rounded-2xl border border-emerald-400/20 bg-forest-900/40 p-5 space-y-3"><div className="flex items-center gap-2 text-emerald-300 text-xs font-bold"><ClipboardList className="w-4 h-4"/> SUGGESTED LISTING</div><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} className="w-full bg-forest-950 border border-sand-200/15 rounded-lg p-3 text-lg font-bold text-sand-100"/><input value={draft.tagline} onChange={e=>setDraft({...draft,tagline:e.target.value})} className="w-full bg-forest-950 border border-sand-200/15 rounded-lg p-3 text-sm text-sand-100"/><textarea value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} rows={4} className="w-full bg-forest-950 border border-sand-200/15 rounded-lg p-3 text-sm text-sand-100"/><div className="text-xs text-sand-300/70">Category: {draft.category} · Pricing: {draft.pricing_type}</div><div className="flex flex-wrap gap-2">{draft.tags?.map(tag=><span key={tag} className="rounded-full bg-forest-800 px-3 py-1 text-xs text-sand-200">{tag}</span>)}</div><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-electric-300 underline">Verify project <ExternalLink className="w-3 h-3"/></a><p className="text-xs text-amber-300">This is a draft only. Review it and use the normal submission process to publish it.</p></div>}
  </div>;
};
