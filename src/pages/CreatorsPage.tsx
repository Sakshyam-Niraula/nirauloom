import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ShieldCheck, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { SEED_PROFILES } from '../data/seedData';
import { usePlatform } from '../context/PlatformContext';

export const CreatorsPage: React.FC = () => {
  const { creations } = usePlatform();
  const [query, setQuery] = useState('');

  const approved = creations.filter(c => c.status === 'approved');

  const filtered = SEED_PROFILES.filter(p => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.display_name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.bio?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-sand-100 font-sans tracking-tight">
            Verified Creators & Builders
          </h1>
          <p className="text-xs text-sand-300/70 mt-1 max-w-xl leading-relaxed">
            The minds weaving the next generation of web apps, design suites, and open-source tools.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/50" />
          <input
            type="text"
            placeholder="Search creators..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-forest-900/60 border border-sand-200/20 rounded-xl text-xs text-sand-100 placeholder-sand-300/50 focus:outline-none focus:ring-1 focus:ring-electric-500"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((creator) => {
          const userCreations = approved.filter(c => c.creator_id === creator.id);
          const totalAppreciations = userCreations.reduce((acc, c) => acc + c.appreciations_count, 0);

          return (
            <div
              key={creator.id}
              className="rounded-2xl bg-forest-900/40 border border-sand-200/15 hover:border-sand-200/35 p-6 backdrop-blur-sm transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={creator.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
                        alt={creator.display_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-sand-200/30 group-hover:border-sand-200/60 transition-colors"
                      />
                      {creator.is_admin && (
                        <span className="absolute bottom-0 right-0 p-1 rounded-full bg-electric-500 text-white shadow-glow-purple" title="Platform Moderator">
                          <ShieldCheck className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-sand-100 group-hover:text-sand-50">
                        {creator.display_name}
                      </h3>
                      <p className="text-xs text-sand-300/60">@{creator.username}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-sand-300/80 leading-relaxed line-clamp-3 mb-4">
                  {creator.bio || 'Digital builder sharing novel web creations.'}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-forest-950/60 border border-sand-200/10 text-center text-xs">
                  <div>
                    <span className="font-extrabold text-sand-100 block">{userCreations.length}</span>
                    <span className="text-[10px] text-sand-300/50 uppercase font-semibold">Creations</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-sand-100 block">{totalAppreciations}</span>
                    <span className="text-[10px] text-sand-300/50 uppercase font-semibold">Appreciations</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-sand-200/10 flex items-center justify-between text-xs">
                <span className="text-sand-300/50 text-[11px]">
                  Joined {new Date(creator.created_at).toLocaleDateString()}
                </span>
                <Link
                  to={`/creators/${creator.username}`}
                  className="font-semibold text-sand-200 group-hover:text-sand-50 flex items-center gap-1"
                >
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
