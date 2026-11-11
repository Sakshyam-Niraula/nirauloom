import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Globe, 
  ShieldCheck, 
  PlusCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { GithubIcon, TwitterIcon } from '../components/brand/SocialIcons';
import { usePlatform } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';
import { SEED_PROFILES } from '../data/seedData';
import { CreationCard } from '../components/creations/CreationCard';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';

export const CreatorProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { creations, collections } = usePlatform();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'creations' | 'collections'>('creations');
  const [creator, setCreator] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCreator = async () => {
      if (!username) {
        setCreator(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        // Resolve real public profiles from Supabase first. This makes creator
        // pages work for visitors who are not signed in as that creator.
        if (isSupabaseConfigured && supabase) {
          const { data: byUsername, error: usernameError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .maybeSingle();

          if (usernameError) {
            console.warn('Could not load creator by username:', usernameError);
          }

          let resolved = byUsername as Profile | null;

          // Support older links that use the creator's UUID instead of username.
          if (!resolved) {
            const { data: byId, error: idError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', username)
              .maybeSingle();

            if (idError) {
              console.warn('Could not load creator by ID:', idError);
            }
            resolved = byId as Profile | null;
          }

          if (!cancelled && resolved) {
            setCreator(resolved);
            setProfileLoading(false);
            return;
          }
        }

        // Preserve demo profiles and the signed-in user's local profile.
        const fallback =
          SEED_PROFILES.find(profile => profile.username === username || profile.id === username) ||
          (user && (user.username === username || user.id === username) ? user : null);

        if (!cancelled) {
          setCreator(fallback);
          setProfileLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error loading creator profile:', error);

        const fallback =
          SEED_PROFILES.find(profile => profile.username === username || profile.id === username) ||
          (user && (user.username === username || user.id === username) ? user : null);

        if (!cancelled) {
          setCreator(fallback);
          setProfileLoading(false);
        }
      }
    };

    loadCreator();

    return () => {
      cancelled = true;
    };
  }, [username, user]);

  if (profileLoading || authLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <p className="text-sm text-sand-300/70">Loading creator profile...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-sand-100">Creator not found</h2>
        <p className="text-xs text-sand-300/70">The creator profile you are looking for does not exist.</p>
        <Link
          to="/creators"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
        >
          Explore All Creators
        </Link>
      </div>
    );
  }

  const isOwnProfile = user && user.id === creator.id;

  // Filter creations: if own profile, show pending/rejected too; otherwise, only approved
  const creatorCreations = creations.filter(c => {
    if (c.creator_id !== creator.id) return false;
    if (isOwnProfile) return true;
    return c.status === 'approved';
  });

  const creatorCollections = collections.filter(col => {
    if (col.user_id !== creator.id) return false;
    if (isOwnProfile) return true;
    return col.is_public;
  });

  const totalAppreciations = creatorCreations.reduce((acc, c) => acc + c.appreciations_count, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Header Glass Banner */}
      <div className="rounded-3xl bg-forest-900/50 border border-sand-200/20 p-6 sm:p-8 backdrop-blur-xl shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <img
              src={creator.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
              alt={creator.display_name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-sand-200/30 shadow-md"
            />
            {creator.is_admin && (
              <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-electric-500 text-white shadow-glow-purple" title="Platform Moderator">
                <ShieldCheck className="w-4 h-4" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-100 font-sans">
                {creator.display_name}
              </h1>
              {isOwnProfile && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sand-200/15 text-sand-200 border border-sand-200/25">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-sand-300/60 mt-0.5">@{creator.username}</p>
            <p className="text-xs sm:text-sm text-sand-200/90 mt-2 max-w-xl leading-relaxed">
              {creator.bio || 'Digital builder showcasing unique creations on NIRAULOOM.'}
            </p>

            {/* Social / External Links */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-sand-300/80">
              {creator.website && (
                <a
                  href={creator.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-sand-100 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-sand-200" />
                  <span>{creator.website.replace('https://', '')}</span>
                </a>
              )}
              {creator.twitter && (
                <a
                  href={`https://twitter.com/${creator.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-sand-100 transition-colors"
                >
                  <TwitterIcon className="w-3.5 h-3.5 text-sand-200" />
                  <span>@{creator.twitter}</span>
                </a>
              )}
              {creator.github && (
                <a
                  href={`https://github.com/${creator.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-sand-100 transition-colors"
                >
                  <GithubIcon className="w-3.5 h-3.5 text-sand-200" />
                  <span>github.com/{creator.github}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-4 bg-forest-950/60 border border-sand-200/15 rounded-2xl p-4 text-center shrink-0 w-full sm:w-auto justify-around">
          <div>
            <p className="text-xl font-extrabold text-sand-100">{creatorCreations.length}</p>
            <p className="text-[10px] uppercase font-bold text-sand-300/60">Creations</p>
          </div>
          <div className="w-px h-8 bg-sand-200/10" />
          <div>
            <p className="text-xl font-extrabold text-sand-100">{totalAppreciations}</p>
            <p className="text-[10px] uppercase font-bold text-sand-300/60">Appreciations</p>
          </div>
          <div className="w-px h-8 bg-sand-200/10" />
          <div>
            <p className="text-xl font-extrabold text-sand-100">{creatorCollections.length}</p>
            <p className="text-[10px] uppercase font-bold text-sand-300/60">Collections</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-sand-200/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('creations')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'creations'
                ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
                : 'text-sand-300/70 hover:text-sand-100'
            }`}
          >
            Creations ({creatorCreations.length})
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'collections'
                ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
                : 'text-sand-300/70 hover:text-sand-100'
            }`}
          >
            Collections ({creatorCollections.length})
          </button>
        </div>

        {isOwnProfile && (
          <Link
            to="/submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/25 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sand-200" />
            <span>Submit New</span>
          </Link>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'creations' ? (
        creatorCreations.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
            <p className="text-sm font-semibold text-sand-200">No creations published yet</p>
            {isOwnProfile && (
              <Link
                to="/submit"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
              >
                Submit Your First Creation
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorCreations.map(creation => (
              <div key={creation.id} className="relative">
                {isOwnProfile && creation.status !== 'approved' && (
                  <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-forest-900 border border-sand-200/20 text-xs">
                    <span className="flex items-center gap-1.5">
                      {creation.status === 'pending' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-300 font-semibold">Moderation Review Pending</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-rose-300 font-semibold">Submission Rejected</span>
                        </>
                      )}
                    </span>
                    {creation.rejection_reason && (
                      <span className="text-[10px] text-sand-300/60 truncate max-w-[140px]" title={creation.rejection_reason}>
                        Reason: {creation.rejection_reason}
                      </span>
                    )}
                  </div>
                )}
                <CreationCard creation={creation} />
              </div>
            ))}
          </div>
        )
      ) : (
        creatorCollections.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
            <p className="text-sm font-semibold text-sand-200">No public collections created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorCollections.map(col => (
              <Link
                key={col.id}
                to={`/collections/${col.slug}`}
                className="p-5 rounded-2xl bg-forest-900/40 hover:bg-forest-900/70 border border-sand-200/15 hover:border-sand-200/35 transition-all block group"
              >
                <h3 className="text-base font-bold text-sand-100 group-hover:text-sand-50 mb-1">{col.name}</h3>
                <p className="text-xs text-sand-300/70 line-clamp-2">{col.description}</p>
                <span className="mt-3 inline-block text-[11px] text-sand-300/50">{col.items?.length || col.items_count} items</span>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
};
