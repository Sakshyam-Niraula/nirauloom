import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {CalendarDays,Flag,Medal,Sparkles,CheckCircle2,ArrowRight} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {supabase,isSupabaseConfigured} from '../lib/supabase';

type Challenge={id:string;title:string;description:string;start_date:string;end_date:string;status:'upcoming'|'active'|'completed';winner_user_id:string|null};
type Participant={challenge_id:string;user_id:string;joined_at:string};
type Project={id:string;name:string;created_at:string;status:string};
type Creator={id:string;username:string;display_name:string};
const dateFmt=(s:string)=>new Date(s+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
function esc(s:string){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));}
function certificate(name:string,challengeTitle:string){
 const w=window.open('','_blank','width=900,height=700');if(!w)return;
 w.document.write('<!doctype html><html><head><title>Challenge Certificate</title><style>body{margin:0;background:#e9e0cf;font-family:Georgia,serif;color:#173f35}.page{margin:28px;border:8px double #94723b;padding:70px 40px;text-align:center;background:#f7f2e7}.label{letter-spacing:5px;font-size:14px}.name{font-size:46px;margin:32px 0}.subtitle{font-size:24px;line-height:1.5}.foot{margin-top:65px;font-size:14px}</style></head><body><div class="page"><p class="label">NIRAULOOM COMMUNITY CHALLENGE</p><h1>Certificate of Completion</h1><p class="subtitle">This certificate recognizes</p><h2 class="name">'+esc(name)+'</h2><p class="subtitle">for completing the <strong>'+esc(challengeTitle)+'</strong><br/>and publishing an approved project on NIRAULOOM.</p><div class="foot">Keep creating. Keep building. Keep inspiring.</div></div><script>window.onload=()=>window.print()</script></body></html>');
 w.document.close();
}
export const CreatorChallengePage:React.FC=()=>{
 const {user}=useAuth();
 const [challenge,setChallenge]=useState<Challenge|null>(null);
 const [participant,setParticipant]=useState<Participant|null>(null);
 const [projects,setProjects]=useState<Project[]>([]);
 const [participants,setParticipants]=useState<Array<{user_id:string;joined_at:string;creator:Creator}>>([]);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[msg,setMsg]=useState('');
 const [adminStart,setAdminStart]=useState(''),[adminEnd,setAdminEnd]=useState(''),[adminStatus,setAdminStatus]=useState<'upcoming'|'active'|'completed'>('upcoming');
 const [winner,setWinner]=useState(''),[title,setTitle]=useState('NIRAULOOM 30 Days Creator Challenge');
 const [description,setDescription]=useState('Create, build, experiment, and publish a project during the 30-day challenge. Progress is measured through approved work—not account creation.');
 async function load(){
  if(!supabase||!isSupabaseConfigured){setLoading(false);return;}
  const {data}=await supabase.from('creator_challenges').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();
  const c=(data||null) as Challenge|null;setChallenge(c);
  if(c){setTitle(c.title);setDescription(c.description);setAdminStart(c.start_date);setAdminEnd(c.end_date);setAdminStatus(c.status);setWinner(c.winner_user_id||'');
   if(user?.id){const {data:p}=await supabase.from('creator_challenge_participants').select('*').eq('challenge_id',c.id).eq('user_id',user.id).maybeSingle();setParticipant(p as Participant|null);
    const {data:proj}=await supabase.from('creations').select('id,name,created_at,status').eq('creator_id',user.id).eq('status','approved').gte('created_at',c.start_date+'T00:00:00').lte('created_at',c.end_date+'T23:59:59');setProjects((proj||[]) as Project[]);
   }
   if(user?.is_admin){const {data:parts}=await supabase.from('creator_challenge_participants').select('user_id,joined_at,creator:profiles(id,username,display_name)').eq('challenge_id',c.id).order('joined_at');setParticipants((parts||[]) as any);}
  }
  setLoading(false);
 }
 useEffect(()=>{void load();},[user?.id]);
 const join=async()=>{if(!user||!supabase||!challenge)return;setBusy(true);setMsg('');const {error}=await supabase.from('creator_challenge_participants').insert({challenge_id:challenge.id,user_id:user.id});if(error&&error.code!=='23505')setMsg('Could not join—please try again.');else{setMsg('You are registered for the challenge!');await load();}setBusy(false);};
 const saveAdmin=async()=>{if(!supabase||!user?.is_admin||!adminStart||!adminEnd||adminEnd<adminStart){setMsg('Admin: choose valid dates before saving.');return;}setBusy(true);setMsg('');
 const row={title:title.trim(),description:description.trim(),start_date:adminStart,end_date:adminEnd,status:adminStatus,winner_user_id:winner||null,created_by:user.id};
 const q=challenge?await supabase.from('creator_challenges').update(row).eq('id',challenge.id).select().single():await supabase.from('creator_challenges').insert(row).select().single();
 if(q.error){setMsg('Save failed. Please retry.');}else{setMsg('Challenge settings saved.');await load();}setBusy(false);
 };
 const qualified=projects.some(p=>p.created_at>=challenge?.start_date+'T00:00:00'&&p.created_at<=challenge?.end_date+'T23:59:59');
 const days=challenge?Math.max(0,Math.ceil((new Date(challenge.end_date+'T23:59:59').getTime()-Date.now())/86400000)):30;
 return <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
 <header className="rounded-3xl border border-sand-200/15 bg-gradient-to-br from-forest-900 via-forest-950 to-forest-900 p-8 sm:p-12"><p className="text-xs uppercase tracking-[.2em] text-lime-300 flex items-center gap-2"><Sparkles size={14}/>Community challenge</p><h1 className="text-4xl sm:text-6xl font-extrabold text-sand-100 mt-4">30 Days.<br/><span className="text-lime-300">One Creation.</span></h1><p className="max-w-2xl text-sand-300/80 mt-4 leading-7">A month to turn an idea into something real. Join the challenge, publish an approved project, and celebrate what you built.</p></header>
 {loading?<p className="text-center py-8 text-sand-300">Loading challenge…</p>:!challenge?<section className="rounded-2xl border border-sand-200/15 p-8 text-center text-sand-300"><h2 className="text-xl text-sand-100 font-bold">The challenge is being prepared</h2><p className="mt-2 text-sm">The dates and details will be announced soon.</p></section>:<section className="grid md:grid-cols-3 gap-4"><div className="md:col-span-2 rounded-2xl border border-sand-200/15 bg-forest-900/45 p-6 space-y-3"><h2 className="text-xl font-bold text-sand-100">{challenge.title}</h2><p className="text-sm text-sand-300/80">{challenge.description}</p><div className="flex items-center gap-2 text-xs text-sand-300"><CalendarDays size={14}/>{dateFmt(challenge.start_date)} to {dateFmt(challenge.end_date)}</div>
 {challenge.status==='active'&&user&&!participant&&<button disabled={busy} onClick={()=>void join()} className="mt-3 rounded-xl bg-lime-300 text-forest-950 px-4 py-2.5 text-sm font-bold disabled:opacity-50">{busy?'Joining…':'Join the Challenge'}</button>}
 {challenge.status==='active'&&!user&&<Link to="/auth?mode=signup" className="inline-flex mt-3 rounded-xl bg-lime-300 text-forest-950 px-4 py-2.5 text-sm font-bold">Create an account to join</Link>}
 {participant&&<div className="rounded-xl border border-lime-300/20 bg-lime-300/5 p-3 text-sm text-lime-200"><CheckCircle2 className="inline w-4 h-4 mr-1"/>You joined this challenge.</div>}
 {qualified&&participant&&<div className="rounded-xl border border-lime-300/20 bg-lime-300/5 p-4"><p className="text-sm font-semibold text-lime-200">Completion requirement met!</p><p className="text-xs text-sand-300 mt-1">You have an approved project published during the challenge window.</p><button onClick={()=>certificate(user?.display_name||user?.username||'Creator',challenge.title)} className="mt-3 rounded-lg bg-sand-200 text-forest-950 px-3 py-2 text-xs font-bold">Print / Save Completion Certificate</button></div>}
 {participant&&!qualified&&<p className="text-xs text-sand-300/60">Publish at least one project and get it approved within the challenge dates to earn your completion certificate.</p>}
 </div><aside className="rounded-2xl border border-sand-200/15 bg-forest-900/40 p-6 space-y-4"><h3 className="font-bold text-sand-100 flex items-center gap-2"><Flag size={16}/>How to complete</h3><ol className="text-sm text-sand-300/75 list-decimal pl-5 space-y-2"><li>Join the challenge</li><li>Build your project</li><li>Submit it to NIRAULOOM</li><li>Get approved during challenge dates</li></ol><div className="border-t border-sand-200/10 pt-4"><p className="font-semibold text-sand-100 flex gap-2 items-center"><Medal size={16} className="text-lime-300"/>Rewards</p><ul className="text-xs text-sand-300/70 space-y-2 mt-2"><li>Completion certificate</li><li>Challenge completion badge</li><li>Creator spotlight consideration</li><li>Winner recognition for standout work</li></ul></div><Link to="/submit" className="inline-flex items-center gap-2 text-lime-300 text-sm">Submit a project <ArrowRight size={15}/></Link><p className="text-xs text-sand-300/55">Remaining: {days} day{days===1?'':'s'}</p></aside></section>}
 {user?.is_admin&&<section className="rounded-2xl border border-violet-300/20 bg-violet-950/20 p-5 space-y-4"><h2 className="text-lg font-bold text-sand-100">Challenge Admin</h2><div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-sand-300">Title<input value={title} onChange={e=>setTitle(e.target.value)} className="block mt-1 w-full rounded-lg bg-forest-950 border border-sand-200/15 p-2 text-sand-100"/></label><label className="text-xs text-sand-300">Status<select value={adminStatus} onChange={e=>setAdminStatus(e.target.value as any)} className="block mt-1 w-full rounded-lg bg-forest-950 border border-sand-200/15 p-2 text-sand-100"><option value="upcoming">Upcoming</option><option value="active">Active (open enrollment)</option><option value="completed">Completed</option></select></label><label className="text-xs text-sand-300">Start<input type="date" value={adminStart} onChange={e=>setAdminStart(e.target.value)} className="block mt-1 w-full rounded-lg bg-forest-950 border border-sand-200/15 p-2 text-sand-100"/></label><label className="text-xs text-sand-300">End<input type="date" value={adminEnd} onChange={e=>setAdminEnd(e.target.value)} className="block mt-1 w-full rounded-lg bg-forest-950 border border-sand-200/15 p-2 text-sand-100"/></label><label className="text-xs text-sand-300 sm:col-span-2">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} className="block mt-1 w-full rounded-lg bg-forest-950 border border-sand-200/15 p-2 text-sand-100"/></label><label className="text-xs text-sand-300 sm:col-span-2">Winner<select value={winner} onChange={e=>setWinner(e.target.value)} className="block mt-1 w-full rounded-lg bg-forest-950 border border-sand-200/15 p-2 text-sand-100"><option value="">No winner selected</option>{participants.map(p=><option key={p.user_id} value={p.user_id}>{p.creator?.display_name||p.creator?.username}</option>)}</select></label></div><div className="flex flex-wrap gap-2"><button onClick={()=>void saveAdmin()} disabled={busy} className="rounded-xl bg-violet-500 text-white px-4 py-2 text-sm font-bold">{busy?'Saving…':'Save challenge settings'}</button><span className="text-xs text-sand-300/60 self-center">Selecting a winner is manual; choose after reviewing participants’ projects.</span></div>{msg&&<p className="text-sm text-sand-200">{msg}</p>}<div className="text-xs text-sand-300/60">Registered creators: {participants.length}</div></section>}
 {msg&&!user?.is_admin&&<p className="text-sm text-sand-200">{msg}</p>}
 </main>;
};
