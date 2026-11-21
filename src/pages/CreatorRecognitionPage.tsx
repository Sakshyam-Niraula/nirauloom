import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Crown, Sparkles, Star, Users, Printer, Download, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlatform } from '../context/PlatformContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type WallCreator = {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
};

type BadgeInfo = { name: string; description: string; icon: React.ReactNode; tone: string };

function getCreatorBadges(joinedAt: string, submitted: number, appreciations: number): BadgeInfo[] {
  const badges: BadgeInfo[] = [];
  if (submitted >= 1) badges.push({ name: 'First Build', description: 'Submitted their first project to NIRAULOOM', icon: <Sparkles className="w-4 h-4" />, tone: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-300' });
  if (submitted >= 1 && new Date(joinedAt) <= new Date('2026-12-31T23:59:59Z')) badges.push({ name: 'Early Pioneer', description: 'Joined during NIRAULOOM’s early launch era', icon: <Crown className="w-4 h-4" />, tone: 'border-amber-300/30 bg-amber-500/10 text-amber-300' });
  if (submitted >= 3) badges.push({ name: 'Project Builder', description: 'Submitted 3 or more projects', icon: <Award className="w-4 h-4" />, tone: 'border-sky-300/30 bg-sky-500/10 text-sky-300' });
  if (appreciations >= 5) badges.push({ name: 'Community Favorite', description: 'Projects received 5 or more appreciations', icon: <Star className="w-4 h-4" />, tone: 'border-purple-300/30 bg-purple-500/10 text-purple-300' });
  return badges;
}

const badgeStyles = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold';
function downloadCreatorCertificate(creatorName: string, projectName: string, badgeNames: string[]) {
  const encoder = new TextEncoder();
  const nl = String.fromCharCode(10);
  const safe = (value: string) => value.normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
  const commands: string[] = [];
  const drawText = (value: string, size: number, y: number, font = 'F1', color = '0.09 0.25 0.21') => {
    const label = safe(value);
    const estimatedWidth = label.length * size * (font === 'F2' ? 0.52 : 0.48);
    const x = Math.max(40, (842 - estimatedWidth) / 2);
    commands.push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y} Tm (${label}) Tj ET`);
  };

  commands.push('q 0.965 0.941 0.89 rg 0 0 842 595 re f Q');
  commands.push('0.71 0.54 0.27 RG 4 w 22 22 798 551 re S');
  commands.push('0.71 0.54 0.27 RG 1 w 34 34 774 527 re S');
  commands.push('0.71 0.54 0.27 RG 1 w 54 54 m 788 54 l S');
  drawText('NIRAULOOM', 18, 520, 'F2');
  drawText('CERTIFICATE OF CREATOR RECOGNITION', 13, 476, 'F1', '0.36 0.32 0.24');
  drawText(creatorName, 34, 405, 'F2');
  drawText('In recognition of submitting original work to NIRAULOOM.', 15, 355, 'F1', '0.20 0.25 0.22');
  drawText('PROJECT SUBMITTED', 9, 300, 'F1', '0.45 0.37 0.24');
  drawText(projectName, 17, 272, 'F2');
  if (badgeNames.length) drawText('EARNED RECOGNITION: ' + badgeNames.join('  |  '), 11, 224, 'F1', '0.36 0.32 0.24');
  drawText('Sakshyam Niraula', 16, 91, 'F2');
  drawText('Founder of NIRAULOOM', 11, 69, 'F1', '0.36 0.32 0.24');

  const stream = commands.join(nl);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>',
    `<< /Length ${encoder.encode(stream).length} >>${nl}stream${nl}${stream}${nl}endstream`
  ];

  let pdf = '%PDF-1.4' + nl;
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj${nl}${object}${nl}endobj${nl}`;
  });
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref${nl}0 ${objects.length + 1}${nl}0000000000 65535 f ${nl}`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n ${nl}`;
  });
  pdf += `trailer${nl}<< /Size ${objects.length + 1} /Root 1 0 R >>${nl}startxref${nl}${xrefOffset}${nl}%%EOF${nl}`;

  const blob = new Blob([encoder.encode(pdf)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const filename = creatorName.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'Creator';
  anchor.href = url;
  anchor.download = `NIRAULOOM-Creator-Certificate-${filename}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export const CreatorRewardsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { creations } = usePlatform();
  const [projects, setProjects] = useState<Array<{ id: string; name: string; status: string; appreciations_count: number; created_at: string }>>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      if (!user?.id) return;
      setProjectsLoading(true);
      setLoadError('');
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('creations')
          .select('id,name,status,appreciations_count,created_at')
          .eq('creator_id', user.id)
          .in('status', ['pending', 'approved'])
          .order('created_at', { ascending: true });
        if (!active) return;
        if (error) {
          setLoadError('We could not load your submissions from NIRAULOOM. Please refresh and try again.');
          setProjects([]);
        } else {
          setProjects((data || []) as Array<{ id: string; name: string; status: string; appreciations_count: number; created_at: string }>);
        }
      } else {
        const own = creations.filter((creation) => creation.creator_id === user.id && ['pending', 'approved'].includes(creation.status))
          .map((creation) => ({ id: creation.id, name: creation.name, status: creation.status, appreciations_count: creation.appreciations_count || 0, created_at: creation.created_at }))
          .sort((a, b) => a.created_at.localeCompare(b.created_at));
        if (active) setProjects(own);
      }
      if (active) setProjectsLoading(false);
    }
    void loadProjects();
    return () => { active = false; };
  }, [user?.id, creations, refreshKey]);

  if (authLoading) return <main className="max-w-3xl mx-auto px-4 py-24 text-center text-sand-200"><Loader2 className="w-7 h-7 animate-spin mx-auto mb-3" />Checking your NIRAULOOM account…</main>;

  if (!user) return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <Award className="w-10 h-10 mx-auto text-amber-300" />
      <h1 className="text-3xl font-bold text-sand-100 mt-4">Creator Rewards</h1>
      <p className="text-sand-300/70 mt-2">Sign in to see the projects you submitted, your earned badges, and your certificate.</p>
      <Link to="/auth?redirect=%2Fcreator-rewards" className="inline-flex mt-6 px-5 py-3 rounded-xl bg-sand-200 text-forest-950 font-bold text-sm">Sign in to view rewards</Link>
    </main>
  );

  const submitted = projects.length;
  const approved = projects.filter((project) => project.status === 'approved');
  const totalAppreciations = approved.reduce((sum, project) => sum + (project.appreciations_count || 0), 0);
  const badges = getCreatorBadges(user.created_at || new Date().toISOString(), submitted, totalAppreciations);
  const firstProject = projects[0];
  const nextMilestone = submitted === 0
    ? 'Submit your first project to unlock First Build and your certificate.'
    : submitted < 3
      ? 'Submit ' + (3 - submitted) + ' more project' + (3 - submitted === 1 ? '' : 's') + ' to unlock Project Builder.'
      : 'You have reached Project Builder. Keep creating—your milestones are recorded here.';

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-7">
      <style>{"@media print {@page {size:A4 landscape;margin:10mm} body * {visibility:hidden!important} #nirauloom-creator-certificate,#nirauloom-creator-certificate * {visibility:visible!important} #nirauloom-creator-certificate {display:flex!important;position:fixed!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important;box-sizing:border-box!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}"}</style>
      <div className="creator-rewards-screen space-y-7">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sand-200/10 pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-electric-400 font-bold">Recognition for your work</p>
            <h1 className="text-3xl font-extrabold text-sand-100 mt-2">Creator Rewards</h1>
            <p className="text-sm text-sand-300/70 mt-2 max-w-xl">A record of the projects you have submitted and the milestones you have earned at NIRAULOOM.</p>
          </div>
          <Link to={user.username ? '/creators/' + user.username : '/creators'} className="text-sm font-semibold text-sand-200 hover:text-sand-600 inline-flex items-center gap-2">View public profile <ArrowRight className="w-4 h-4" /></Link>
        </header>

        <section className="rounded-3xl border border-sand-200/15 bg-forest-900/45 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <img src={user.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + user.id} alt="" className="w-20 h-20 rounded-full border border-sand-200/20" />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-sand-300/60">Creator journey</p>
              <h2 className="text-2xl font-bold text-sand-100">{user.display_name}</h2>
              <p className="text-sm text-sand-300/70">@{user.username || 'creator'} · {submitted} submitted {submitted === 1 ? 'project' : 'projects'}</p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl bg-forest-950/60 p-3 text-center min-w-20"><strong className="block text-xl text-sand-100">{submitted}</strong><span className="text-[10px] text-sand-300/60 uppercase">Submitted</span></div>
              <div className="rounded-xl bg-forest-950/60 p-3 text-center min-w-20"><strong className="block text-xl text-sand-100">{totalAppreciations}</strong><span className="text-[10px] text-sand-300/60 uppercase">Appreciations</span></div>
            </div>
          </div>
          {loadError ? (
            <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{loadError}<button onClick={() => setRefreshKey((value) => value + 1)} className="ml-3 underline font-semibold">Try again</button></div>
          ) : projectsLoading ? (
            <div className="mt-6 text-sm text-sand-300/70 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading your submitted projects…</div>
          ) : (
            <div className="mt-6 pt-5 border-t border-sand-200/10">
              <h3 className="font-bold text-sand-100 mb-3">Your earned badges</h3>
              {badges.length > 0 ? <div className="flex flex-wrap gap-2">{badges.map((badge) => <span key={badge.name} className={badgeStyles + ' ' + badge.tone} title={badge.description}>{badge.icon}{badge.name}</span>)}</div> : <p className="text-sm text-sand-300/65">Your first badge is waiting for your first project submission.</p>}
              <p className="text-sm text-sand-300/70 mt-4">{nextMilestone}</p>
            </div>
          )}
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-sand-200/15 bg-forest-900/35 p-5">
            <h3 className="font-bold text-sand-100">Your submissions</h3>
            {projectsLoading ? <p className="mt-3 text-sm text-sand-300/70">Loading…</p> : projects.length ? (
              <ul className="mt-3 space-y-3">{projects.map((project) => (
                <li key={project.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-sand-100 font-medium">{project.name}</span>
                  <span className={'shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ' + (project.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-200')}>{project.status === 'approved' ? 'Published' : 'Under review'}</span>
                </li>
              ))}</ul>
            ) : <p className="mt-3 text-sm text-sand-300/70">No submissions are linked to this account yet. If you submitted with another account, sign in using that account.</p>}
            <Link to="/submit" className="inline-flex items-center gap-2 mt-4 text-sm text-sand-200 font-semibold">Submit another project <ArrowRight className="w-4 h-4" /></Link>
          </article>
          <article className="rounded-2xl border border-sand-200/15 bg-forest-900/35 p-5">
            <h3 className="font-bold text-sand-100">Your certificate</h3>
            <p className="mt-2 text-sm text-sand-300/75">A free certificate becomes available after your first project submission. Pending submissions count; creating an account alone does not earn one.</p>
            {submitted > 0 && !projectsLoading && !loadError ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => downloadCreatorCertificate(user.display_name, firstProject?.name || 'NIRAULOOM project', badges.map((badge) => badge.name))} className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-forest-700"><Download className="w-4 h-4" />Download certificate PDF</button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-sand-300 px-4 py-2.5 text-sm font-semibold text-sand-600"><Printer className="w-4 h-4" />Print certificate</button>
              </div>
            ) : <p className="mt-4 text-xs text-sand-300/60">{projectsLoading ? 'Checking eligibility…' : 'Submit your first project to unlock your certificate.'}</p>}
          </article>
        </section>

        <section className="rounded-2xl border border-dashed border-sand-200/20 p-5">
          <h3 className="font-bold text-sand-100">How rewards work</h3>
          <ul className="mt-2 space-y-1 text-sm text-sand-300/70">
            <li>First Build — 1 submitted project.</li>
            <li>Early Pioneer — submitted at least one project during the launch period.</li>
            <li>Project Builder — 3 submitted projects.</li>
            <li>Community Favorite — 5 appreciations on published projects.</li>
          </ul>
          <Link to="/creator-wall" className="inline-flex items-center gap-2 mt-3 text-sm text-sand-200 font-semibold">Meet the Creator Wall <ArrowRight className="w-4 h-4" /></Link>
        </section>
      </div>

      {submitted > 0 && !projectsLoading && !loadError && (
        <section id="nirauloom-creator-certificate" className="hidden flex-col justify-between overflow-hidden bg-[#f6f0e3] text-[#173f35] border-[10px] border-double border-[#b68b45] p-10 md:p-14 text-center min-h-[185mm]">
          <div className="border border-[#b68b45] p-8 md:p-10 flex-1 flex flex-col justify-center">
            <p className="uppercase tracking-[0.35em] text-xs font-semibold">NIRAULOOM · DISCOVER. BUILD. CONNECT.</p>
            <div className="my-5 text-[#b68b45] text-3xl">✦</div>
            <p className="uppercase tracking-[0.28em] text-sm">Certificate of Creator Recognition</p>
            <h1 className="font-serif text-5xl md:text-6xl mt-7">{user.display_name}</h1>
            <p className="text-lg mt-7 max-w-3xl mx-auto">In recognition of submitting original work to NIRAULOOM.</p>
            <p className="text-base mt-4 font-semibold">{firstProject?.name}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-7">{badges.map((badge) => <span key={badge.name} className="border border-[#b68b45] rounded-full px-4 py-1.5 text-sm">{badge.name}</span>)}</div>
            <div className="mt-12 pt-5 border-t border-[#173f35]/40">
              <p className="font-serif text-xl font-bold">Sakshyam Niraula</p>
              <p className="text-xs uppercase tracking-[0.18em] mt-1">Founder of NIRAULOOM</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export const CreatorWallPage: React.FC = () => {
  const [creators, setCreators] = useState<WallCreator[]>([]);
  const [projectCounts, setProjectCounts] = useState<Record<string, { count: number; appreciations: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<'recent' | 'projects' | 'appreciations'>('recent');

  useEffect(() => {
    let active = true;
    async function loadWall() {
      if (!supabase || !isSupabaseConfigured) {
        setError('Creator Wall is unavailable while the live database is disconnected.');
        setLoading(false);
        return;
      }
      const [profiles, projects] = await Promise.all([
        supabase.from('profiles').select('id,username,display_name,avatar_url,bio,created_at').order('created_at', { ascending: true }),
        supabase.from('creations').select('creator_id,appreciations_count').eq('status', 'approved'),
      ]);
      if (!active) return;
      if (profiles.error || projects.error) {
        setError('We could not load the Creator Wall. Please try again later.');
        setLoading(false);
        return;
      }
      const counts: Record<string, { count: number; appreciations: number }> = {};
      (projects.data || []).forEach((project: any) => {
        const creatorId = project.creator_id;
        if (!counts[creatorId]) counts[creatorId] = { count: 0, appreciations: 0 };
        counts[creatorId].count += 1;
        counts[creatorId].appreciations += project.appreciations_count || 0;
      });
      setCreators((profiles.data || []) as WallCreator[]);
      setProjectCounts(counts);
      setLoading(false);
    }
    void loadWall();
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const list = creators.filter((creator) => (projectCounts[creator.id]?.count || 0) > 0);
    return list.sort((a, b) => {
      if (sort === 'projects') return (projectCounts[b.id]?.count || 0) - (projectCounts[a.id]?.count || 0);
      if (sort === 'appreciations') return (projectCounts[b.id]?.appreciations || 0) - (projectCounts[a.id]?.appreciations || 0);
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [creators, projectCounts, sort]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-7">
      <header className="border-b border-sand-200/10 pb-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-electric-400 font-bold">The people behind the projects</p>
        <h1 className="text-3xl font-extrabold text-sand-100 mt-2">The Creator Wall</h1>
        <p className="text-sm text-sand-300/70 mt-2 max-w-2xl">A place to recognize the builders who shared their work and helped make NIRAULOOM a community. Every creator shown has at least one approved project.</p>
        <div className="mt-3 text-xs text-sand-300/50">{visible.length} creators recognized</div>
      </header>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSort('recent')} className={`px-3 py-2 rounded-xl text-xs font-semibold border ${sort === 'recent' ? 'bg-forest-800 border-sand-200/30 text-sand-100' : 'border-sand-200/15 text-sand-300/70'}`}>Early creators</button>
        <button onClick={() => setSort('projects')} className={`px-3 py-2 rounded-xl text-xs font-semibold border ${sort === 'projects' ? 'bg-forest-800 border-sand-200/30 text-sand-100' : 'border-sand-200/15 text-sand-300/70'}`}>Most projects</button>
        <button onClick={() => setSort('appreciations')} className={`px-3 py-2 rounded-xl text-xs font-semibold border ${sort === 'appreciations' ? 'bg-forest-800 border-sand-200/30 text-sand-100' : 'border-sand-200/15 text-sand-300/70'}`}>Community appreciations</button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sand-300/70"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading creator wall…</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-5 text-sm text-rose-200">{error}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-200/20 p-10 text-center">
          <Users className="w-8 h-8 mx-auto text-sand-300/60" />
          <h2 className="font-bold text-sand-100 mt-3">The wall is waiting for creators</h2>
          <p className="text-sm text-sand-300/70 mt-2">Publish a project to be recognized here.</p>
          <Link to="/submit" className="inline-flex mt-4 rounded-xl bg-sand-200 px-4 py-2 text-forest-950 text-sm font-bold">Publish a project</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((creator) => {
            const metrics = projectCounts[creator.id] || { count: 0, appreciations: 0 };
            const earned = getCreatorBadges(creator.created_at, metrics.count, metrics.appreciations);
            return (
              <article key={creator.id} className="rounded-2xl border border-sand-200/15 bg-forest-900/35 p-5 flex flex-col">
                <div className="flex items-center gap-3">
                  <img src={creator.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.id}`} alt="" className="w-14 h-14 rounded-full border border-sand-200/20" />
                  <div className="min-w-0">
                    <h2 className="font-bold text-sand-100 truncate">{creator.display_name}</h2>
                    <p className="text-xs text-sand-300/60">@{creator.username}</p>
                  </div>
                </div>
                <p className="text-sm text-sand-300/70 mt-3 line-clamp-3">{creator.bio || 'Independent creator sharing their work.'}</p>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-forest-950/50 p-3 mt-4 text-center">
                  <div><strong className="text-sand-100 text-lg block">{metrics.count}</strong><span className="text-[10px] text-sand-300/60 uppercase">Published projects</span></div>
                  <div><strong className="text-sand-100 text-lg block">{metrics.appreciations}</strong><span className="text-[10px] text-sand-300/60 uppercase">Appreciations</span></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {earned.map((badge) => <span key={badge.name} className={badgeStyles + ' ' + badge.tone}>{badge.icon}{badge.name}</span>)}
                </div>
                <Link to={`/creators/${creator.username}`} className="mt-auto pt-4 text-sm font-semibold text-sand-200 inline-flex items-center gap-2">View creator profile <ArrowRight className="w-4 h-4" /></Link>
              </article>
            );
          })}
        </div>
      )}

      <footer className="text-center text-xs text-sand-300/50 pt-3">Recognition is based on published projects and public community activity. NIRAULOOM does not sell badges.</footer>
    </main>
  );
};
