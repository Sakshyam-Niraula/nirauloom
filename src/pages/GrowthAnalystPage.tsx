import React, { useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

type Metrics = { users:number; projects:number; approved:number; pending:number; views:number; appreciations:number; bookmarks:number; updatedAt:string };

export const GrowthAnalystPage: React.FC = () => {
  const [metrics,setMetrics]=useState<Metrics|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [insights,setInsights]=useState<string[]>([]);
  const run=async()=>{
    if(!supabase){setError("Supabase is not configured.");return;}
    setLoading(true);setError("");setInsights([]);
    try{
      const [users,projects,approved,pending]=await Promise.all([
        supabase.from("profiles").select("id",{count:"exact",head:true}),
        supabase.from("creations").select("views_count,appreciations_count,bookmarks_count,status,created_at"),
        supabase.from("creations").select("id",{count:"exact",head:true}).eq("status","approved"),
        supabase.from("creations").select("id",{count:"exact",head:true}).eq("status","pending")
      ]);
      const failure=[users,projects,approved,pending].find(r=>r.error);
      if(failure?.error) throw new Error(failure.error.message);
      const rows=projects.data||[];
      const totalViews=rows.reduce((n,r)=>n+Number(r.views_count||0),0);
      const totalAppreciations=rows.reduce((n,r)=>n+Number(r.appreciations_count||0),0);
      // Use aggregate counters on creations: bookmark rows are private to each user under RLS.
      const totalBookmarks=rows.reduce((n,r)=>n+Number(r.bookmarks_count||0),0);
      const result={users:users.count||0,projects:rows.length,approved:approved.count||0,pending:pending.count||0,views:totalViews,appreciations:totalAppreciations,bookmarks:totalBookmarks,updatedAt:new Date().toISOString()};
      setMetrics(result);
      const tips:string[]=[];
      if(result.users>0 && result.projects===0) tips.push("Accounts are registering but no projects are listed yet. Improve the first-project onboarding and invite early creators.");
      if(result.pending>0) tips.push(`${result.pending} projects are waiting for moderation. Review the queue to avoid creator delays.`);
      if(result.projects>0 && result.views>0 && result.appreciations===0) tips.push("Projects are receiving recorded views but no appreciations. Review project quality, relevance and calls to action.");
      if(result.projects>0 && result.bookmarks===0) tips.push("No bookmarks are recorded yet. Encourage visitors to save projects they want to revisit.");
      if(!tips.length) tips.push("Keep collecting data. These are platform-wide database counters, not a full visitor funnel; connect privacy-conscious page analytics to measure visits and signup conversion.");
      setInsights(tips);
    }catch(e){setError(e instanceof Error?e.message:"Could not load platform metrics.");}
    finally{setLoading(false);}
  };
  return <div className="max-w-4xl mx-auto space-y-6">
    <div><div className="text-xs uppercase tracking-wider text-electric-300 font-bold">Nirauloom Intelligence</div><h2 className="text-2xl font-extrabold text-sand-100 mt-2">Growth Analyst</h2><p className="text-sm text-sand-300/70 mt-2">Read platform-wide database counters and suggest practical improvements. No user records or private messages are exposed.</p></div>
    <button onClick={run} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-sand-100 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>{loading?"Analyzing...":"Analyze platform"}</button>
    {error&&<p className="text-sm text-rose-300">{error}</p>}
    {metrics&&<><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["Registered profiles",metrics.users],["Projects",metrics.projects],["Approved",metrics.approved],["Pending",metrics.pending],["Recorded views",metrics.views],["Appreciations",metrics.appreciations],["Bookmarks",metrics.bookmarks]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-sand-200/10 bg-forest-900/40 p-4"><p className="text-xs text-sand-300/60">{label}</p><p className="text-2xl font-bold text-sand-100 mt-2">{value}</p></div>)}</div><div className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-5 space-y-3"><div className="flex items-center gap-2 text-sand-100 font-bold"><BarChart3 className="w-4 h-4 text-electric-300"/>Suggested actions</div>{insights.map((tip,i)=><p key={i} className="text-sm text-sand-200/80">• {tip}</p>)}<p className="text-[11px] text-sand-300/45">Updated {new Date(metrics.updatedAt).toLocaleString()} · Based on database counters only; no GA or Cloudflare visitor analytics are queried.</p></div></>}
  </div>;
};
