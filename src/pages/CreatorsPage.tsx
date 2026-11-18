import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Users } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type CreatorProfile = {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
};

export const CreatorsPage: React.FC = () => {
  const { creations } = usePlatform();
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const loadProfiles = async () => {
      if (!supabase || !isSupabaseConfigured) {
        setLoadError('Creator profiles are unavailable until the live database is connected.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,display_name,bio,avatar_url,created_at')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) setLoadError('We could not load creator profiles right now. Please try again later.');
      else setProfiles((data || []) as CreatorProfile[]);
      setLoading(false);
    };
    void loadProfiles();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      p.display_name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      (p.bio || '').toLowerCase().includes(q)
    );
  }, [profiles, query]);

  const approved = creations.filter((creation) => creation.status === 'approved');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric-400 font-bold">The people behind the projects</p>
          <h1 className="text-3xl font-extrabold text-sand-100 mt-2">Creators & Builders</h1>
          <p className="text-sm text-sand-300/70 mt-2 max-w-xl">Meet the people who have created a real NIRAULOOM account and shared their work.</p>
          <p className="text-xs text-sand-300/50 mt-2">{profiles.length} registered creator profiles</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/50" />
          <input type="search" placeholder="Search creators..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-forest-900/60 border border-sand-200/20 rounded-xl text-sm text-sand-100 placeholder-sand-300/50 focus:outline-none focus:ring-1 focus:ring-electric-500" />
        </div>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm text-sand-300/70">Loading real creator profiles…</div>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-5 text-sm text-rose-200">{loadError}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-200/20 bg-forest-900/30 p-10 text-center">
          <Users className="w-8 h-8 text-sand-300/60 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-sand-100">{query ? 'No matching creators' : 'Be among the first creators'}</h2>
          <p className="text-sm text-sand-300/70 mt-2">{query ? 'Try another name or username.' : 'Creator profiles shown here are real registered accounts, not sample profiles. Join NIRAULOOM and share a project to get started.'}</p>
          {!query && <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-sand-200 text-forest-950 text-sm font-bold">Create a free account <ArrowRight className="w-4 h-4" /></Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((creator) => {
            const userCreations = approved.filter((creation) => creation.creator_id === creator.id);
            const totalAppreciations = userCreations.reduce((sum, creation) => sum + creation.appreciations_count, 0);
            return (
              <article key={creator.id} className="rounded-2xl bg-forest-900/40 border border-sand-200/15 hover:border-sand-200/35 p-6 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img src={creator.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.id}`} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-sand-200/30" />
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-sand-100 truncate">{creator.display_name}</h2>
                      <p className="text-xs text-sand-300/60">@{creator.username}</p>
                    </div>
                  </div>
                  <p className="text-sm text-sand-300/80 leading-relaxed line-clamp-3 mb-4">{creator.bio || 'NIRAULOOM creator.'}</p>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-forest-950/60 border border-sand-200/10 text-center text-xs">
                    <div><span className="font-extrabold text-sand-100 block">{userCreations.length}</span><span className="text-[10px] text-sand-300/50 uppercase font-semibold">Published projects</span></div>
                    <div><span className="font-extrabold text-sand-100 block">{totalAppreciations}</span><span className="text-[10px] text-sand-300/50 uppercase font-semibold">Appreciations</span></div>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-sand-200/10 flex items-center justify-between text-xs">
                  <span className="text-sand-300/50">Joined {new Date(creator.created_at).toLocaleDateString()}</span>
                  <Link to={`/creators/${creator.username}`} className="font-semibold text-sand-200 hover:text-sand-50 inline-flex items-center gap-1">View profile <ArrowRight className="w-3.5 h-3.5" /></Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
