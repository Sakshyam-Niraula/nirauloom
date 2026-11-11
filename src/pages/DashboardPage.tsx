import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  LayoutGrid, 
  Bookmark, 
  FolderPlus, 
  Settings, 
  Trash2, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlusCircle,
  Save,
  ShieldCheck,
  Heart,
  RefreshCw
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';
import { CreationCard } from '../components/creations/CreationCard';

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'creations' | 'bookmarks' | 'collections' | 'settings') || 'creations';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { creations, bookmarks, collections, deleteCreation, refreshCreations, loading } = usePlatform();
  const { user, updateProfile } = useAuth();

  // Settings form state
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [twitter, setTwitter] = useState(user?.twitter || '');
  const [github, setGithub] = useState(user?.github || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-sand-100">Sign in to Access Creator Studio</h2>
        <p className="text-xs text-sand-300/70">Manage your digital submissions, collections, and platform bookmarks.</p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Creations submitted by user
  const myCreations = creations.filter(c => c.creator_id === user.id);
  const myApproved = myCreations.filter(c => c.status === 'approved');
  const myPending = myCreations.filter(c => c.status === 'pending');
  const myRejected = myCreations.filter(c => c.status === 'rejected');

  // Bookmarked creations
  const bookmarkedCreations = creations.filter(c => bookmarks.includes(c.id));

  // My collections
  const myCollections = collections.filter(c => c.user_id === user.id);

  const handleTabChange = (tab: 'creations' | 'bookmarks' | 'collections' | 'settings') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      display_name: displayName,
      bio,
      website,
      twitter,
      github,
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-sand-100 font-sans tracking-tight">
              Creator Studio
            </h1>
            {user.is_admin && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-electric-500/20 text-electric-300 border border-electric-500/30">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-sand-300/70 mt-1">
            Welcome back, <strong className="text-sand-100">{user.display_name}</strong> (@{user.username})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshCreations()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-sand-200/20 text-sand-200 text-xs font-semibold hover:bg-forest-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/25 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-sand-200" />
            <span>Submit New Creation</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-sand-200/10 pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('creations')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'creations'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>My Submissions ({myCreations.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('bookmarks')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'bookmarks'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks ({bookmarkedCreations.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('collections')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'collections'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>My Collections ({myCollections.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'settings'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Profile Settings</span>
        </button>
      </div>

      {/* Tab: Submissions */}
      {activeTab === 'creations' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-forest-900/40 border border-sand-200/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 font-semibold">Live Approved</p>
                <p className="text-2xl font-extrabold text-sand-100">{myApproved.length}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-400/60" />
            </div>

            <div className="p-4 rounded-xl bg-forest-900/40 border border-sand-200/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 font-semibold">Review Pending</p>
                <p className="text-2xl font-extrabold text-sand-100">{myPending.length}</p>
              </div>
              <Clock className="w-6 h-6 text-amber-400/60" />
            </div>

            <div className="p-4 rounded-xl bg-forest-900/40 border border-sand-200/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-400 font-semibold">Rejected</p>
                <p className="text-2xl font-extrabold text-sand-100">{myRejected.length}</p>
              </div>
              <XCircle className="w-6 h-6 text-rose-400/60" />
            </div>
          </div>

          {/* List of Submissions */}
          {myCreations.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
              <p className="text-sm font-semibold text-sand-200">You haven't submitted any creations yet</p>
              <p className="text-xs text-sand-300/60 mt-1">Submit your website or app to be discovered worldwide.</p>
              <Link
                to="/submit"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
              >
                Submit Creation Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myCreations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-forest-900/40 border border-sand-200/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.logo_url}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover border border-sand-200/20"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/creations/${item.slug}`}
                          className="font-bold text-sand-100 hover:text-sand-50 text-sm"
                        >
                          {item.name}
                        </Link>
                        {item.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Approved
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pending Review
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-sand-300/70 line-clamp-1">{item.tagline}</p>
                      {item.rejection_reason && (
                        <p className="text-[11px] text-rose-400 mt-1">Feedback: {item.rejection_reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs text-sand-300/60 mr-2 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      {item.appreciations_count}
                    </span>
                    <a
                      href={item.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-forest-950/80 text-sand-300 hover:text-sand-100 border border-sand-200/10"
                      title="Launch website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                          deleteCreation(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-forest-950/80 text-rose-400 hover:text-rose-300 border border-sand-200/10"
                      title="Delete creation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div>
          {bookmarkedCreations.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
              <Bookmark className="w-8 h-8 text-sand-300/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-sand-200">No bookmarks saved yet</p>
              <p className="text-xs text-sand-300/60 mt-1">Bookmark creations while browsing to access them here quickly.</p>
              <Link
                to="/explore"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
              >
                Explore Discoveries
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedCreations.map((c) => (
                <CreationCard key={c.id} creation={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Collections */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-sand-300/70">Collections created by you.</p>
            <Link
              to="/collections"
              className="text-xs font-semibold text-sand-200 hover:text-sand-100"
            >
              Manage & Add Collections →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCollections.map((col) => (
              <Link
                key={col.id}
                to={`/collections/${col.slug}`}
                className="p-5 rounded-2xl bg-forest-900/40 border border-sand-200/15 hover:border-sand-200/35 transition-all block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-sand-300/60">{col.is_public ? 'Public' : 'Private'}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-forest-800 text-sand-200 font-semibold">{col.items_count} items</span>
                </div>
                <h3 className="text-base font-bold text-sand-100 group-hover:text-sand-50 mb-1">{col.name}</h3>
                <p className="text-xs text-sand-300/70 line-clamp-2">{col.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Profile Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleUpdateProfile} className="max-w-xl p-6 rounded-2xl bg-forest-900/40 border border-sand-200/15 space-y-4">
          <h2 className="text-base font-bold text-sand-100">Update Profile Details</h2>

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              Profile updated successfully!
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-sand-200 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-sand-200 mb-1">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Twitter Handle</label>
              <input
                type="text"
                placeholder="username"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">GitHub Handle</label>
              <input
                type="text"
                placeholder="username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/25"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
