import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  GraduationCap,
  Compass,
  ChevronRight,
  Rocket,
  Users,
  Heart,
  Bookmark,
  Globe2,
} from 'lucide-react';
import { WovenNIcon } from '../components/brand/Logo';
import { CreationCard } from '../components/creations/CreationCard';
import { usePlatform } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { creations, categories, loading } = usePlatform();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');

  const approvedCreations = creations.filter((creation) => creation.status === 'approved');
  const trendingCreations = [...approvedCreations]
    .sort((a, b) => b.appreciations_count - a.appreciations_count)
    .slice(0, 4);
  const recentCreations = [...approvedCreations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);
  const studentCreations = approvedCreations.filter((creation) => creation.is_student_indie).slice(0, 4);
  const creatorCount = new Set(approvedCreations.map((creation) => creation.creator_id).filter(Boolean)).size;

  const handleHeroSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (heroSearch.trim()) navigate(`/explore?q=${encodeURIComponent(heroSearch.trim())}`);
  };

  return (
    <div className="space-y-20 pb-20">
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-24 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/90 border border-sand-200/25 text-sand-200 text-xs font-semibold shadow-glass mb-7">
          <WovenNIcon size={20} theme="dark" />
          <span>A home for independent digital creations</span>
          <span className="w-1.5 h-1.5 rounded-full bg-electric-500" />
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-sand-100 max-w-4xl mx-auto leading-[1.08]">
          Discover independent projects.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sand-200 via-sand-100 to-electric-400">
            Share what you build.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-sand-300/80 max-w-2xl mx-auto leading-relaxed">
          One place to discover useful apps, AI tools, open-source work, and student projects — or publish your own creation so people can find it.
        </p>

        <div className="mt-9 max-w-2xl mx-auto">
          <form onSubmit={handleHeroSearch} className="relative group">
            <div className="flex items-center rounded-2xl bg-forest-900/80 border border-sand-200/25 p-2 shadow-glass backdrop-blur-xl group-focus-within:border-electric-500/80 transition-all">
              <Search className="w-5 h-5 text-sand-300/60 ml-3 shrink-0" />
              <input
                type="search"
                value={heroSearch}
                onChange={(event) => setHeroSearch(event.target.value)}
                placeholder="Search AI tools, student projects, developer apps..."
                aria-label="Search creations"
                className="w-full min-w-0 bg-transparent border-none px-3 py-2.5 text-sm text-sand-100 placeholder-sand-300/50 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-sand-300/50 text-[11px]">Popular searches:</span>
            {['Free AI tools', 'Study apps', 'Open-source projects', 'Design tools'].map((term) => (
              <button
                key={term}
                onClick={() => navigate(`/explore?q=${encodeURIComponent(term)}`)}
                className="px-2.5 py-1 rounded-full bg-forest-900/60 hover:bg-forest-800 text-sand-300/80 hover:text-sand-100 border border-sand-200/10 text-[11px] transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? '/submit' : '/auth?mode=signup'}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sand-200 hover:bg-sand-100 text-forest-950 text-sm font-extrabold transition-all shadow-glass"
          >
            <Rocket className="w-4 h-4" />
            {user ? 'Publish your project' : 'List your project — free'}
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-forest-900/70 hover:bg-forest-800 text-sand-100 text-sm font-semibold border border-sand-200/20 transition-all"
          >
            Browse creations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-3 text-[11px] text-sand-300/55">
          No listing fees · Browse without an account · Creators keep ownership of their work
        </p>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <div className="rounded-xl bg-forest-900/40 border border-sand-200/10 p-4">
            <p className="text-2xl font-extrabold text-sand-100">{approvedCreations.length}</p>
            <p className="text-[10px] sm:text-xs text-sand-300/60 uppercase tracking-wider mt-1">Published creations</p>
          </div>
          <div className="rounded-xl bg-forest-900/40 border border-sand-200/10 p-4">
            <p className="text-2xl font-extrabold text-sand-100">{categories.length}</p>
            <p className="text-[10px] sm:text-xs text-sand-300/60 uppercase tracking-wider mt-1">Discovery categories</p>
          </div>
          <div className="rounded-xl bg-forest-900/40 border border-sand-200/10 p-4">
            <p className="text-2xl font-extrabold text-sand-100">{creatorCount}</p>
            <p className="text-[10px] sm:text-xs text-sand-300/60 uppercase tracking-wider mt-1">Creators represented</p>
          </div>
          <div className="rounded-xl bg-forest-900/40 border border-sand-200/10 p-4">
            <p className="text-2xl font-extrabold text-sand-100">Free</p>
            <p className="text-[10px] sm:text-xs text-sand-300/60 uppercase tracking-wider mt-1">Creator listings</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-electric-400">Simple by design</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-sand-100 mt-2">From your idea to discoverable in three steps</h2>
          <p className="text-sm text-sand-300/70 mt-2">No complicated launch process. Your project can be live in a few minutes after review.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-forest-900/40 border border-sand-200/10 p-6"><span className="text-xs font-bold text-electric-300">01</span><h3 className="font-bold text-sand-100 mt-2">Create your free profile</h3><p className="text-sm text-sand-300/70 mt-2">Use an email sign-in to create your public creator identity.</p></div>
          <div className="rounded-2xl bg-forest-900/40 border border-sand-200/10 p-6"><span className="text-xs font-bold text-electric-300">02</span><h3 className="font-bold text-sand-100 mt-2">Add your project</h3><p className="text-sm text-sand-300/70 mt-2">Share its name, link, a short description, and category. AI assistance is optional.</p></div>
          <div className="rounded-2xl bg-forest-900/40 border border-sand-200/10 p-6"><span className="text-xs font-bold text-electric-300">03</span><h3 className="font-bold text-sand-100 mt-2">Get discovered</h3><p className="text-sm text-sand-300/70 mt-2">After a quick review, your listing and creator profile can be explored by visitors.</p></div>
        </div>
        <div className="text-center mt-6"><Link to={user ? '/submit' : '/auth?mode=signup'} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-sm font-bold transition-colors">Start with your project <ArrowRight className="w-4 h-4" /></Link><p className="text-xs text-sand-300/55 mt-2">You can browse the directory without signing up.</p></div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-electric-400 mb-1">
              <Compass className="w-3.5 h-3.5" /> Start exploring
            </div>
            <h2 className="text-2xl font-bold text-sand-100">Explore by category</h2>
            <p className="text-xs text-sand-300/70 mt-1">Find the kind of thing you came looking for.</p>
          </div>
          <Link to="/categories" className="text-xs font-semibold text-sand-200 hover:text-sand-100 flex items-center gap-1">
            All categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.slice(0, 10).map((category) => {
            const count = approvedCreations.filter((creation) => creation.category_id === category.id).length;
            return (
              <Link
                key={category.id}
                to={`/explore?category=${category.id}`}
                className="group p-4 rounded-xl bg-forest-900/40 hover:bg-forest-900/80 border border-sand-200/10 hover:border-sand-200/30 transition-all flex flex-col justify-between min-h-32"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-forest-800 text-sand-200 flex items-center justify-center font-bold text-sm mb-3 group-hover:bg-electric-500/20 group-hover:text-electric-300 transition-all">
                    {category.name.charAt(0)}
                  </div>
                  <h3 className="text-xs font-bold text-sand-100 line-clamp-1">{category.name}</h3>
                  <p className="text-[11px] text-sand-300/60 mt-1 line-clamp-2">{category.description}</p>
                </div>
                <span className="text-[10px] text-sand-300/50 mt-3">{count} {count === 1 ? 'creation' : 'creations'}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-electric-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> Community discoveries
            </div>
            <h2 className="text-2xl font-bold text-sand-100">Recently published</h2>
            <p className="text-xs text-sand-300/70 mt-1">Real projects shared on NIRAULOOM.</p>
          </div>
          <Link to="/explore" className="text-xs font-semibold text-sand-200 hover:text-sand-100 flex items-center gap-1">
            Browse all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-sand-200/10 bg-forest-900/30 p-10 text-center text-sm text-sand-300/70">
            Loading published creations…
          </div>
        ) : recentCreations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentCreations.map((creation) => <CreationCard key={creation.id} creation={creation} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand-200/20 bg-forest-900/30 p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-electric-500/15 text-electric-300 flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-sand-100">Help build the first wave of discoveries</h3>
            <p className="text-sm text-sand-300/70 max-w-xl mx-auto mt-2">
              NIRAULOOM is opening its doors to independent makers. Share a project you have built,
              or explore the directory while the community grows.
            </p>
            <Link to={user ? '/submit' : '/auth?mode=signup'} className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold transition-colors">
              {user ? 'Submit a creation' : 'Create your free account'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {trendingCreations.length > 1 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-7">
            <TrendingUp className="w-5 h-5 text-electric-400" />
            <div>
              <h2 className="text-2xl font-bold text-sand-100">Appreciated by the community</h2>
              <p className="text-xs text-sand-300/70 mt-1">Projects receiving the most appreciation.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingCreations.map((creation) => <CreationCard key={creation.id} creation={creation} />)}
          </div>
        </section>
      )}

      {studentCreations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-7">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-2xl font-bold text-sand-100">Student-built projects</h2>
              <p className="text-xs text-sand-300/70 mt-1">A place for experiments, side projects, and early ideas.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {studentCreations.map((creation) => <CreationCard key={creation.id} creation={creation} />)}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-900 to-forest-800 border border-sand-200/20 p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-electric-500/10 blur-3xl pointer-events-none" />
          <div className="relative grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/15 text-electric-300 text-xs font-semibold border border-electric-500/25 mb-4">
                <Users className="w-3.5 h-3.5" /> For independent makers
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-sand-100">You built something. Let people discover it.</h2>
              <p className="mt-3 text-sm text-sand-300/80 leading-relaxed max-w-xl">
                Create a public maker profile, submit your app or project, and give people one simple place to find what you are building.
                Submissions are reviewed before appearing in the directory.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={user ? '/submit' : '/auth?mode=signup'} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sand-200 hover:bg-sand-100 text-forest-950 text-xs font-extrabold transition-colors">
                  {user ? 'Submit your project' : 'Create a free creator account'} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/creators" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-950/50 hover:bg-forest-950 text-sand-100 text-xs font-semibold border border-sand-200/20 transition-colors">
                  Meet the creators
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-forest-950/50 border border-sand-200/10 p-5">
                <Heart className="w-5 h-5 text-rose-300 mb-3" />
                <h3 className="text-sm font-bold text-sand-100">Get discovered</h3>
                <p className="text-xs text-sand-300/65 mt-1">Put your work in front of curious people.</p>
              </div>
              <div className="rounded-2xl bg-forest-950/50 border border-sand-200/10 p-5">
                <Bookmark className="w-5 h-5 text-electric-300 mb-3" />
                <h3 className="text-sm font-bold text-sand-100">Build your profile</h3>
                <p className="text-xs text-sand-300/65 mt-1">Keep your creations together in one place.</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-forest-950/50 border border-sand-200/10 p-5 flex items-center gap-3">
                <Globe2 className="w-6 h-6 text-sand-200 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-sand-100">Open to creators everywhere</h3>
                  <p className="text-xs text-sand-300/65 mt-1">Student, indie, open-source, and solo projects are welcome.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-sand-100">Discover something worth sharing.</h2>
        <p className="text-sm text-sand-300/70 mt-2">Browse freely. Join when you want to save, appreciate, or publish.</p>
        <Link to={user ? '/explore' : '/auth?mode=signup'} className="inline-flex items-center gap-2 mt-5 text-sm font-bold text-electric-300 hover:text-electric-200">
          {user ? 'Explore the directory' : 'Join NIRAULOOM for free'} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};
