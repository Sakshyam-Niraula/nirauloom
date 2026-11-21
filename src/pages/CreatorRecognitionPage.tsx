import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Crown, Sparkles, Star, Users, Printer, ArrowRight, Loader2 } from 'lucide-react';
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

function getCreatorBadges(joinedAt: string, published: number, appreciations: number): BadgeInfo[] {
  const badges: BadgeInfo[] = [];
  if (published >= 1) badges.push({ name: 'First Build', description: 'Published a project on NIRAULOOM', icon: <Sparkles className="w-4 h-4" />, tone: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-300' });
  if (published >= 1 && new Date(joinedAt) <= new Date('2026-12-31T23:59:59Z')) badges.push({ name: 'Early Pioneer', description: 'Joined during NIRAULOOM’s early launch era', icon: <Crown className="w-4 h-4" />, tone: 'border-amber-300/30 bg-amber-500/10 text-amber-300' });
  if (published >= 3) badges.push({ name: 'Project Builder', description: 'Published 3 or more projects', icon: <Award className="w-4 h-4" />, tone: 'border-sky-300/30 bg-sky-500/10 text-sky-300' });
  if (appreciations >= 5) badges.push({ name: 'Community Favorite', description: 'Projects received 5 or more appreciations', icon: <Star className="w-4 h-4" />, tone: 'border-purple-300/30 bg-purple-500/10 text-purple-300' });
  return badges;
}

const badgeStyles = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold';

export const CreatorRewardsPage: React.FC = () => {
  const { user } = useAuth();
  const { creations } = usePlatform();
  const own = creations.filter((creation) => creation.creator_id === user?.id && creation.status === 'approved');
  const totalAppreciations = own.reduce((sum, creation) => sum + (creation.appreciations_count || 0), 0);
  const badges = getCreatorBadges(user?.created_at || new Date().toISOString(), own.length, totalAppreciations);
  const nextMilestone = own.length === 0
    ? 'Publish your first project to unlock First Build and become eligible for Early Pioneer.'
    : own.length < 3
      ? 'Publish 2 more approved projects to unlock Project Builder.'
      : 'You have reached Project Builder. Keep creating—your milestones are recorded here.';

  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-sand-100">Creator Rewards</h1>
        <p className="text-sand-300/70 mt-2">Sign in to view your creator milestones.</p>
        <Link to="/auth?mode=signup" className="inline-flex mt-5 px-4 py-2 rounded-xl bg-sand-200 text-forest-950 font-bold text-sm">Sign in / Create account</Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-7">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric-400 font-bold">Recognition for your work</p>
          <h1 className="text-3xl font-extrabold text-sand-100 mt-2">Creator Rewards</h1>
          <p className="text-sm text-sand-300/70 mt-2 max-w-xl">Your work matters here. Track your milestones and keep a record of what you have built with NIRAULOOM.</p>
        </div>
        <Link to={`/creators/${user.username}`} className="text-sm font-semibold text-sand-200 hover:text-white inline-flex items-center gap-2">View public profile <ArrowRight className="w-4 h-4" /></Link>
      </header>

      <section className="rounded-3xl border border-sand-200/15 bg-forest-900/45 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <img src={user.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`} alt="" className="w-20 h-20 rounded-full border border-sand-200/20" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-sand-300/60">Creator journey</p>
            <h2 className="text-2xl font-bold text-sand-100">{user.display_name}</h2>
            <p className="text-sm text-sand-300/70">@{user.username} · {own.length} published {own.length === 1 ? 'project' : 'projects'}</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-forest-950/60 p-3 text-center min-w-20"><strong className="block text-xl text-sand-100">{own.length}</strong><span className="text-[10px] text-sand-300/60 uppercase">Published</span></div>
            <div className="rounded-xl bg-forest-950/60 p-3 text-center min-w-20"><strong className="block text-xl text-sand-100">{totalAppreciations}</strong><span className="text-[10px] text-sand-300/60 uppercase">Appreciations</span></div>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-sand-200/10">
          <h3 className="font-bold text-sand-100 mb-3">Your earned badges</h3>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => <span key={badge.name} className={badgeStyles + ' ' + badge.tone} title={badge.description}>{badge.icon}{badge.name}</span>)}
            </div>
          ) : (
            <p className="text-sm text-sand-300/65">Your first badge is waiting for your first approved project.</p>
          )}
          <p className="text-sm text-sand-300/70 mt-4">{nextMilestone}</p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-sand-200/15 bg-forest-900/35 p-5">
          <h3 className="font-bold text-sand-100">Milestones</h3>
          <ul className="mt-3 space-y-2 text-sm text-sand-300/75">
            <li>First Build — 1 approved project</li>
            <li>Project Builder — 3 approved projects</li>
            <li>Community Favorite — 5 appreciations</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-sand-200/15 bg-forest-900/35 p-5">
          <h3 className="font-bold text-sand-100">Share your recognition</h3>
          <p className="mt-2 text-sm text-sand-300/75">Print or save this certificate as a PDF. It celebrates your contribution to NIRAULOOM—no paid upgrade required.</p>
          <button onClick={() => window.print()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sand-200 px-4 py-2 text-sm font-bold text-forest-950"><Printer className="w-4 h-4" /> Save certificate / Print</button>
        </article>
      </section>

      <section className="print-certificate hidden print:block border-2 border-emerald-900 p-12 text-center text-slate-900">
        <p className="uppercase tracking-[0.3em] text-sm">NIRAULOOM · Creator Recognition</p>
        <h1 className="text-4xl font-serif mt-8">Creator Appreciation</h1>
        <p className="mt-6 text-lg">This certificate recognizes</p>
        <h2 className="text-3xl font-bold mt-3">{user.display_name}</h2>
        <p className="mt-6 text-lg">for contributing creativity and sharing their work with the NIRAULOOM community.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">{badges.map((badge) => <span key={badge.name} className="border border-emerald-900 px-3 py-1 rounded-full text-sm">{badge.name}</span>)}</div>
        <p className="mt-10 text-sm">Discover. Build. Connect.</p>
      </section>

      <section className="rounded-2xl border border-dashed border-sand-200/20 p-5">
        <h3 className="font-bold text-sand-100">Coming next</h3>
        <p className="text-sm text-sand-300/70 mt-1">Creator spotlights, referral recognition, and community contribution badges will be introduced with transparent criteria as those systems become available.</p>
        <Link to="/creator-wall" className="inline-flex items-center gap-2 mt-3 text-sm text-sand-200 font-semibold">Meet the Creator Wall <ArrowRight className="w-4 h-4" /></Link>
      </section>
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
