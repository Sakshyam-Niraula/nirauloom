import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  GraduationCap, 
  Globe2, 
  Layers, 
  Compass, 
  ShieldCheck, 
  Users,
  FolderHeart,
  ChevronRight
} from 'lucide-react';
import { WovenNIcon } from '../components/brand/Logo';
import { CreationCard } from '../components/creations/CreationCard';
import { usePlatform } from '../context/PlatformContext';
import { SEED_PROFILES } from '../data/seedData';

export const HomePage: React.FC = () => {
  const { creations, categories, collections } = usePlatform();
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');

  const approvedCreations = creations.filter(c => c.status === 'approved');
  const trendingCreations = [...approvedCreations].sort((a, b) => b.appreciations_count - a.appreciations_count).slice(0, 4);
  const recentCreations = [...approvedCreations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);
  const studentCreations = approvedCreations.filter(c => c.is_student_indie).slice(0, 4);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/explore?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  const handlePromptChip = (chip: string) => {
    navigate(`/ai-discover?q=${encodeURIComponent(chip)}`);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION WITH NIRAULOOM IDENTITY */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Glow Halo */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/90 border border-sand-200/25 text-sand-200 text-xs font-semibold shadow-glass mb-8 animate-in fade-in slide-in-from-bottom-2">
          <WovenNIcon size={20} theme="dark" />
          <span>The Next-Generation Digital Discovery Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-electric-500" />
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-sand-100 max-w-4xl mx-auto leading-[1.1] font-sans">
          Discover the Internet, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sand-200 via-sand-100 to-electric-400">
            One Creation at a Time.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-sand-300/80 max-w-2xl mx-auto leading-relaxed">
          Combining the tactile feel of an app launcher with the depth of a global creation directory. 
          Discover indie web apps, generative tools, modern commerce, and student projects from around the globe.
        </p>

        {/* 2. PROMINENT DISCOVERY SEARCH */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form onSubmit={handleHeroSearch} className="relative group">
            <div className="relative flex items-center rounded-2xl bg-forest-900/80 border border-sand-200/25 p-2 shadow-glass backdrop-blur-xl group-focus-within:border-electric-500/80 group-focus-within:shadow-glow-purple transition-all">
              <Search className="w-5 h-5 text-sand-300/60 ml-3" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search web apps, shaders, developer tools, or indie shops..."
                className="w-full bg-transparent border-none px-3 py-2 text-sm text-sand-100 placeholder-sand-300/50 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Prompt Chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-sand-300/50 text-[11px]">Try asking AI:</span>
            {[
              'Free AI tools for students',
              'Minimalist productivity apps',
              'Generative WebGL shaders',
              'Sustainable D2C fashion'
            ].map(chip => (
              <button
                key={chip}
                onClick={() => handlePromptChip(chip)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest-900/60 hover:bg-forest-800 text-sand-300/80 hover:text-sand-100 border border-sand-200/10 text-[11px] transition-colors"
              >
                <Sparkles className="w-2.5 h-2.5 text-electric-400" />
                <span>"{chip}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Platform Metrics Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-y border-sand-200/10 py-6 text-sand-200">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-sand-100 font-sans">{approvedCreations.length}+</p>
            <p className="text-xs text-sand-300/60 font-medium uppercase tracking-wider mt-0.5">Verified Creations</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-sand-100 font-sans">{categories.length}</p>
            <p className="text-xs text-sand-300/60 font-medium uppercase tracking-wider mt-0.5">Core Categories</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-sand-100 font-sans">{SEED_PROFILES.length}+</p>
            <p className="text-xs text-sand-300/60 font-medium uppercase tracking-wider mt-0.5">Global Creators</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-sand-100 font-sans">100%</p>
            <p className="text-xs text-sand-300/60 font-medium uppercase tracking-wider mt-0.5">Community Curated</p>
          </div>
        </div>
      </section>

      {/* 3. POPULAR CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-sand-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-electric-400" />
              <span>Explore by Category</span>
            </h2>
            <p className="text-xs text-sand-300/70 mt-1">
              Curated directories covering 15 specialized domains, from next-gen retail to neural tooling.
            </p>
          </div>
          <Link
            to="/categories"
            className="text-xs font-semibold text-sand-200 hover:text-sand-100 flex items-center gap-1 group"
          >
            <span>All 15 Categories</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {categories.slice(0, 10).map((cat) => {
            const count = approvedCreations.filter(c => c.category_id === cat.id).length;
            return (
              <Link
                key={cat.id}
                to={`/explore?category=${cat.id}`}
                className="group p-4 rounded-xl bg-forest-900/40 hover:bg-forest-900/80 border border-sand-200/10 hover:border-sand-200/30 transition-all duration-200 backdrop-blur-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-forest-800 text-sand-200 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-105 group-hover:bg-electric-500/20 group-hover:text-electric-300 transition-all">
                    {cat.name.charAt(0)}
                  </div>
                  <h3 className="text-xs font-bold text-sand-100 group-hover:text-sand-50 line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-sand-300/60 mt-1 line-clamp-2 leading-snug">
                    {cat.description}
                  </p>
                </div>
                <span className="text-[10px] text-sand-300/50 mt-3 font-medium">
                  {count} {count === 1 ? 'creation' : 'creations'}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. TRENDING CREATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-electric-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> High Velocity
            </div>
            <h2 className="text-2xl font-bold text-sand-100">Trending Right Now</h2>
          </div>
          <Link
            to="/explore?sort=trending"
            className="text-xs font-semibold text-sand-200 hover:text-sand-100 flex items-center gap-1 group"
          >
            <span>View Trending Launcher</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingCreations.map((creation) => (
            <CreationCard key={creation.id} creation={creation} />
          ))}
        </div>
      </section>

      {/* 5. RECENTLY LAUNCHED CREATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sand-200/80 mb-1">
              <Clock className="w-3.5 h-3.5" /> Fresh Drops
            </div>
            <h2 className="text-2xl font-bold text-sand-100">Recently Launched</h2>
          </div>
          <Link
            to="/explore?sort=newest"
            className="text-xs font-semibold text-sand-200 hover:text-sand-100 flex items-center gap-1 group"
          >
            <span>Browse New Drops</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentCreations.map((creation) => (
            <CreationCard key={creation.id} creation={creation} />
          ))}
        </div>
      </section>

      {/* 8. AI-POWERED DISCOVERY HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-forest-900 via-forest-850 to-forest-900 border border-sand-200/20 p-8 sm:p-12 shadow-glass overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-electric-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/20 text-electric-300 text-xs font-semibold border border-electric-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real Database AI Matching</span>
            </div>
            <h2 className="text-3xl font-bold text-sand-100">
              Find exactly what you need in plain English.
            </h2>
            <p className="mt-3 text-sm text-sand-300/80 leading-relaxed">
              No endless filtering required. Ask NIRAULOOM AI to uncover specific tools for students, independent fashion houses, or WebGL developers. Real database items only, zero hallucinations.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/ai-discover"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold transition-all shadow-glow-purple"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open AI Discover Console</span>
              </Link>
              <Link
                to="/collections"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/20 transition-all"
              >
                <FolderHeart className="w-4 h-4 text-sand-200" />
                <span>Explore Curated Collections</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. STUDENT & INDEPENDENT CREATOR PROJECTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <GraduationCap className="w-3.5 h-3.5" /> Next Generation
            </div>
            <h2 className="text-2xl font-bold text-sand-100">Student & Independent Creators</h2>
            <p className="text-xs text-sand-300/70 mt-1">
              Spotlighting grassroots tools, university experiments, and solo hackers building the future of software.
            </p>
          </div>
          <Link
            to="/explore?filter=student"
            className="text-xs font-semibold text-sand-200 hover:text-sand-100 flex items-center gap-1 group"
          >
            <span>View All Student Projects</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {studentCreations.length > 0 ? (
            studentCreations.map((creation) => (
              <CreationCard key={creation.id} creation={creation} />
            ))
          ) : (
            approvedCreations.slice(0, 4).map((creation) => (
              <CreationCard key={creation.id} creation={creation} />
            ))
          )}
        </div>
      </section>

      {/* 6. FEATURED CREATORS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sand-300/80 mb-1">
              <Users className="w-3.5 h-3.5" /> Verified Makers
            </div>
            <h2 className="text-2xl font-bold text-sand-100">Featured Creators</h2>
          </div>
          <Link
            to="/creators"
            className="text-xs font-semibold text-sand-200 hover:text-sand-100 flex items-center gap-1 group"
          >
            <span>Explore All Creators</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SEED_PROFILES.map((creator) => {
            const count = approvedCreations.filter(c => c.creator_id === creator.id).length;
            return (
              <Link
                key={creator.id}
                to={`/creators/${creator.username}`}
                className="group p-5 rounded-2xl bg-forest-900/40 hover:bg-forest-900/70 border border-sand-200/15 hover:border-sand-200/35 transition-all backdrop-blur-sm text-center flex flex-col items-center justify-between"
              >
                <div>
                  <div className="relative mb-3 inline-block">
                    <img
                      src={creator.avatar_url}
                      alt={creator.display_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-sand-200/30 group-hover:border-sand-200/70 transition-colors"
                    />
                    {creator.is_admin && (
                      <span className="absolute bottom-0 right-0 p-1 rounded-full bg-electric-500 text-white shadow-glow-purple" title="Platform Moderator">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-sand-100 group-hover:text-sand-50">
                    {creator.display_name}
                  </h3>
                  <p className="text-xs text-sand-300/60">@{creator.username}</p>
                  <p className="text-xs text-sand-300/80 mt-2 line-clamp-2 leading-relaxed">
                    {creator.bio}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-sand-200/10 w-full flex items-center justify-center gap-4 text-[11px] text-sand-300/60 font-medium">
                  <span>{count} creations</span>
                  <span>•</span>
                  <span>View Profile</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 7. CURATED COLLECTIONS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sand-200/80 mb-1">
              <Layers className="w-3.5 h-3.5" /> Handpicked
            </div>
            <h2 className="text-2xl font-bold text-sand-100">Curated Collections</h2>
          </div>
          <Link
            to="/collections"
            className="text-xs font-semibold text-sand-200 hover:text-sand-100 flex items-center gap-1 group"
          >
            <span>View All Collections</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.slice(0, 2).map((col) => (
            <Link
              key={col.id}
              to={`/collections/${col.slug}`}
              className="group p-6 rounded-2xl bg-forest-900/40 hover:bg-forest-900/70 border border-sand-200/15 hover:border-sand-200/35 transition-all backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-sand-100 group-hover:text-sand-50">
                    {col.name}
                  </h3>
                  <p className="text-xs text-sand-300/75 mt-1 line-clamp-2 leading-relaxed">
                    {col.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-forest-800 text-sand-200 border border-sand-200/20 font-medium">
                  {col.items?.length || col.items_count} tools
                </span>
              </div>

              {/* Thumbnails of items */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-sand-200/10">
                {col.items?.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="w-10 h-10 rounded-lg bg-forest-850 border border-sand-200/20 overflow-hidden shrink-0"
                    title={item.name}
                  >
                    <img src={item.logo_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="text-xs text-sand-300/50 pl-2">Tap to inspect collection →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 10. GLOBAL CREATIONS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-forest-900/30 border border-sand-200/15 p-8 text-center max-w-3xl mx-auto backdrop-blur-md">
          <Globe2 className="w-10 h-10 text-sand-200 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-sand-100">Worldwide Digital Discoveries</h2>
          <p className="text-xs text-sand-300/70 mt-2 leading-relaxed">
            From Scandinavia to East Asia, NIRAULOOM indexes digital experiences created across every border. 
            Independent software has no geographic limits.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {['Sweden', 'Germany', 'Canada', 'United States', 'Japan', 'Norway', 'United Kingdom', 'Australia'].map(country => (
              <Link
                key={country}
                to={`/explore?q=${encodeURIComponent(country)}`}
                className="px-3 py-1 rounded-full bg-forest-800/60 hover:bg-forest-800 text-sand-200 text-xs border border-sand-200/15 transition-colors"
              >
                📍 {country}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
