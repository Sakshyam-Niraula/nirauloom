import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Sparkles, ExternalLink, Star } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Creator = { id: string; username: string; display_name: string; avatar_url: string | null };
type Project = { id: string; name: string; slug: string; tagline: string | null; description: string; website_url: string | null; logo_url: string | null; creator: Creator };
type Entry = { id: string; position: number; recognition_note: string; creation: Project };
type Edition = { id: string; title: string; start_date: string; end_date: string; status: 'published'|'archived'; entries: Entry[] };
const dateLabel = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});

export const SpotlightPage: React.FC = () => {
  const [editions,setEditions] = useState<Edition[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => { const run=async()=>{
    if(!supabase||!isSupabaseConfigured){setError('Spotlight needs the live database connection.');setLoading(false);return;}
    const {data,error:e}=await supabase.from('spotlight_editions').select('id,title,start_date,end_date,status,entries:spotlight_entries(id,position,recognition_note,creation:creations(id,name,slug,tagline,description,website_url,logo_url,creator:profiles(id,username,display_name,avatar_url)))').in('status',['published','archived']).order('start_date',{ascending:false});
    if(e)setError('Spotlight editions could not be loaded.'); else setEditions((data||[]) as unknown as Edition[]);
    setLoading(false);
  };void run();},[]);
  const current=editions.find(e=>e.status==='published');
  const archive=editions.filter(e=>e.status==='archived');
  const editionCard=(edition:Edition)=><section key={edition.id} className="space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[.2em] text-lime-300">{edition.status==='published'?'This week':'Past spotlight'}</p><h2 className="text-2xl font-bold text-sand-100">{edition.title}</h2></div><p className="text-xs text-sand-300/70 flex items-center gap-2"><CalendarDays size={14}/>{dateLabel(edition.start_date)} – {dateLabel(edition.end_date)}</p></header>
    <div className="grid md:grid-cols-3 gap-4">{edition.entries.sort((a,b)=>a.position-b.position).map(entry=><article key={entry.id} className="rounded-2xl border border-sand-200/15 bg-forest-900/50 overflow-hidden">
      <div className="p-5 space-y-4"><div className="flex items-center gap-3"><img src={entry.creation.creator.avatar_url||'https://api.dicebear.com/7.x/identicon/svg?seed='+encodeURIComponent(entry.creation.creator.username)} alt="" className="w-11 h-11 rounded-full object-cover"/><div><Link className="font-semibold text-sand-100 hover:text-lime-300" to={'/creators/'+entry.creation.creator.username}>{entry.creation.creator.display_name}</Link><p className="text-xs text-sand-300/60">@{entry.creation.creator.username}</p></div></div>
      {entry.creation.logo_url&&<img src={entry.creation.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover"/>}
      <div><h3 className="text-lg font-bold text-sand-100">{entry.creation.name}</h3><p className="text-sm text-sand-300/80">{entry.creation.tagline}</p></div>
      <p className="text-sm text-sand-300/70 line-clamp-4">{entry.creation.description}</p>
      {entry.recognition_note&&<div className="rounded-lg bg-forest-800/60 border border-sand-200/10 p-3 text-xs text-sand-200"><Star size={13} className="inline mr-1 text-lime-300"/>{entry.recognition_note}</div>}
      <div className="flex flex-wrap gap-3 text-xs"><Link to={'/creations/'+entry.creation.slug} className="text-lime-300 inline-flex items-center gap-1">View project <ExternalLink size={13}/></Link><Link to={'/creators/'+entry.creation.creator.username} className="text-sand-300 hover:text-sand-100">Creator profile ↗</Link>{entry.creation.website_url&&<a href={entry.creation.website_url} target="_blank" rel="noreferrer" className="text-sand-300 hover:text-sand-100">Website ↗</a>}</div>
      </div></article>)}</div></section>;
  return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
    <header className="relative overflow-hidden rounded-3xl border border-sand-200/15 bg-gradient-to-br from-forest-900 via-forest-950 to-forest-900 p-7 sm:p-12"><div className="absolute -right-16 -top-20 w-72 h-72 rounded-full border border-sand-200/10 pointer-events-none"/><p className="text-xs uppercase tracking-[.22em] text-lime-300 flex items-center gap-2"><Sparkles size={15}/>Community recognition</p><h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-sand-100 mt-4">Weekly Creator<br/><span className="text-lime-300">Spotlight.</span></h1><p className="max-w-xl text-sm sm:text-base leading-7 text-sand-300/80 mt-5">Three creators. Their projects. The work and milestones worth celebrating. Every week, we make room for the people building things.</p></header>
    {loading?<p className="py-16 text-center text-sand-300/70">Loading spotlight…</p>:error?<div className="rounded-xl border border-rose-400/20 p-5 text-rose-200 text-sm">{error}</div>:current?editionCard(current):<div className="rounded-2xl border border-dashed border-sand-200/20 p-12 text-center"><h2 className="text-xl font-bold text-sand-100">The first spotlight is coming soon</h2><p className="text-sm text-sand-300/70 mt-2">Our community team is choosing creators whose work deserves to be discovered.</p></div>}
    {archive.length>0&&<div className="space-y-8 pt-6 border-t border-sand-200/10"><h2 className="text-2xl font-bold text-sand-100">Past Spotlights</h2>{archive.map(edition=>editionCard(edition))}</div>}
  </main>;
};
