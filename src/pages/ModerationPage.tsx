import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard,
  TrendingUp,
  Rocket,
  Users,
  Bookmark,
  Bot,
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Trash2, 
  Check, 
  X 
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';
import { CreationCard } from '../components/creations/CreationCard';
import { GrowthScoutPage } from './GrowthScoutPage';
import { CreatorOnboardingPage } from './CreatorOnboardingPage';
import { GrowthAnalystPage } from './GrowthAnalystPage';

export const ModerationPage: React.FC = () => {
  const { creations, reports, bookmarks, updateCreationStatus, deleteCreation } = usePlatform();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'reports' | 'all' | 'agents' | 'bookmarks'>('overview');
  const [selectedAgent, setSelectedAgent] = useState<'scout' | 'onboarding' | 'analyst'>('scout');
  const [rejectReasonModal, setRejectReasonModal] = useState<string | null>(null);
  const [rejectionInput, setRejectionInput] = useState('');

  if (!user || !user.is_admin) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-sand-100">Restricted Moderator Area</h2>
        <p className="text-xs text-sand-300/70">
          This portal requires administrator privileges. If testing in development, switch to the Admin demo user (Elena Rostova) via the profile menu.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const pendingCreations = creations.filter(c => c.status === 'pending');
  const approvedCreations = creations.filter(c => c.status === 'approved');
  const rejectedCreations = creations.filter(c => c.status === 'rejected');

  const handleApprove = async (id: string) => {
    await updateCreationStatus(id, 'approved');
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReasonModal) return;
    await updateCreationStatus(rejectReasonModal, 'rejected', rejectionInput.trim() || 'Did not meet platform guidelines.');
    setRejectReasonModal(null);
    setRejectionInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-sand-100 font-sans tracking-tight">
              Moderation & Trust Center
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-electric-500/20 text-electric-300 border border-electric-500/30">
              Admin Mode
            </span>
          </div>
          <p className="text-xs text-sand-300/70 mt-1">
            Review community submissions, enforce safety guidelines, and manage incoming user reports.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-sand-200/10 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Submissions ({pendingCreations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'reports'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Reports Queue ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'agents'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <Bot className="w-4 h-4 text-electric-300" />
          <span>AI Agents</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'bookmarks'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks ({bookmarks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
              : 'text-sand-300/70 hover:text-sand-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>All Submissions ({creations.length})</span>
        </button>
      </div>

      {/* Admin overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Total projects', value: creations.length, icon: Rocket },
              { label: 'Pending review', value: pendingCreations.length, icon: Clock },
              { label: 'Approved projects', value: approvedCreations.length, icon: CheckCircle },
              { label: 'Saved bookmarks', value: bookmarks.length, icon: Bookmark },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-sand-200/10 bg-forest-900/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-sand-300/65">{stat.label}</p>
                    <Icon className="w-4 h-4 text-electric-300" />
                  </div>
                  <p className="text-2xl font-extrabold text-sand-100 mt-2">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-sand-100">Your AI workspace</h2>
              <p className="text-xs text-sand-300/65 mt-1">Agents work on research and preparation. You stay in control of external actions.</p>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              <article className="rounded-2xl border border-electric-400/25 bg-forest-900/50 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Available</span>
                  <TrendingUp className="w-5 h-5 text-electric-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sand-100">Growth Scout</h3>
                  <p className="text-xs text-sand-300/70 mt-1">Find public project launches, assess fit, and prepare invitation drafts for your review.</p>
                </div>
                <button onClick={() => setActiveTab('agents')} className="text-xs font-semibold text-electric-300 hover:text-sand-100 underline underline-offset-4">
                  Open agent
                </button>
              </article>

              <article className="rounded-2xl border border-sand-200/10 bg-forest-900/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Available</span>
                  <Users className="w-5 h-5 text-sand-300/70" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sand-100">Creator Onboarding</h3>
                  <p className="text-xs text-sand-300/70 mt-1">Turn a public project URL into a suggested Nirauloom listing for your approval.</p>
                </div>
                <button onClick={() => { setSelectedAgent("onboarding"); setActiveTab("agents"); }} className="text-xs font-semibold text-electric-300 underline underline-offset-4">Open agent</button>
              </article>

              <article className="rounded-2xl border border-sand-200/10 bg-forest-900/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-300">Planned</span>
                  <TrendingUp className="w-5 h-5 text-sand-300/70" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sand-100">Growth Analyst</h3>
                  <p className="text-xs text-sand-300/70 mt-1">Explain visitor-to-signup conversion, popular pages, and where creators drop off.</p>
                </div>
                <button onClick={() => { setSelectedAgent("analyst"); setActiveTab("agents"); }} className="text-xs font-semibold text-electric-300 underline underline-offset-4">Open agent</button>
              </article>
            </div>
          </section>

          <section className="rounded-2xl border border-sand-200/10 bg-forest-900/30 p-5">
            <h2 className="text-sm font-bold text-sand-100">Platform health at a glance</h2>
            <div className="grid sm:grid-cols-3 gap-4 mt-4 text-xs">
              <div><p className="text-sand-300/55">Rejected projects</p><p className="text-lg font-bold text-sand-100 mt-1">{rejectedCreations.length}</p></div>
              <div><p className="text-sand-300/55">Open reports</p><p className="text-lg font-bold text-sand-100 mt-1">{reports.length}</p></div>
              <div><p className="text-sand-300/55">Current bookmarks</p><p className="text-lg font-bold text-sand-100 mt-1">{bookmarks.length}</p></div>
            </div>
          </section>
        </div>
      )}

      {/* AI Agent workspace */}
      {activeTab === 'agents' && (
  <div className="space-y-6">
    <div className="flex flex-wrap gap-2 border-b border-sand-200/10 pb-3">
      <button onClick={() => setSelectedAgent('scout')} className={selectedAgent === 'scout' ? 'rounded-xl px-4 py-2 text-xs font-semibold bg-forest-800 text-sand-100 border border-sand-200/20' : 'rounded-xl px-4 py-2 text-xs font-semibold text-sand-300/70 hover:text-sand-100'}>Growth Scout</button>
      <button onClick={() => setSelectedAgent('onboarding')} className={selectedAgent === 'onboarding' ? 'rounded-xl px-4 py-2 text-xs font-semibold bg-forest-800 text-sand-100 border border-sand-200/20' : 'rounded-xl px-4 py-2 text-xs font-semibold text-sand-300/70 hover:text-sand-100'}>Creator Onboarding</button>
      <button onClick={() => setSelectedAgent('analyst')} className={selectedAgent === 'analyst' ? 'rounded-xl px-4 py-2 text-xs font-semibold bg-forest-800 text-sand-100 border border-sand-200/20' : 'rounded-xl px-4 py-2 text-xs font-semibold text-sand-300/70 hover:text-sand-100'}>Growth Analyst</button>
    </div>
    {selectedAgent === 'scout' && <GrowthScoutPage />}
    {selectedAgent === 'onboarding' && <CreatorOnboardingPage />}
    {selectedAgent === 'analyst' && <GrowthAnalystPage />}
  </div>
)}

      {/* Saved bookmarks */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {creations.filter((creation) => bookmarks.includes(creation.id)).length === 0 ? (
            <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
              <Bookmark className="w-9 h-9 text-sand-300/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-sand-200">No bookmarks saved yet</p>
              <p className="text-xs text-sand-300/60 mt-1">Projects you bookmark while exploring will appear here.</p>
              <Link to="/explore" className="inline-flex mt-4 px-4 py-2 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold">
                Explore projects
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {creations.filter((creation) => bookmarks.includes(creation.id)).map((creation) => (
                <CreationCard key={creation.id} creation={creation} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingCreations.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
              <CheckCircle className="w-10 h-10 text-emerald-400/70 mx-auto mb-2" />
              <p className="text-sm font-semibold text-sand-200">Pending queue is clear!</p>
              <p className="text-xs text-sand-300/60 mt-1">All submissions have been reviewed.</p>
            </div>
          ) : (
            pendingCreations.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-forest-900/40 border border-sand-200/15 backdrop-blur-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.logo_url}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border border-sand-200/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-sand-100">{item.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pending
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-forest-800 text-sand-200">
                          {item.pricing_type}
                        </span>
                      </div>
                      <p className="text-xs text-sand-200/90 mt-1">{item.tagline}</p>
                      <a
                        href={item.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-electric-300 hover:underline mt-1"
                      >
                        <span>{item.website_url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => setRejectReasonModal(item.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-sand-200/10 text-xs text-sand-300/70">
                  <p className="line-clamp-2">{item.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports Queue */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
              <ShieldCheck className="w-10 h-10 text-sand-300/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-sand-200">No reports submitted</p>
              <p className="text-xs text-sand-300/60 mt-1">Community reports regarding broken links or abuse will appear here.</p>
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl bg-forest-900/40 border border-sand-200/15 backdrop-blur-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Reported Reason:</span>
                    <h3 className="text-sm font-bold text-sand-100">{rep.reason}</h3>
                    <p className="text-xs text-sand-300/75 mt-1">{rep.details || 'No additional details provided.'}</p>
                  </div>
                  <span className="text-[11px] text-sand-300/50">
                    {new Date(rep.created_at).toLocaleDateString()}
                  </span>
                </div>

                {rep.creation && (
                  <div className="p-3 rounded-xl bg-forest-950/60 border border-sand-200/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-sand-100">{rep.creation.name}</p>
                      <p className="text-[11px] text-sand-300/60">{rep.creation.website_url}</p>
                    </div>
                    <Link
                      to={`/creations/${rep.creation.slug}`}
                      className="text-xs font-semibold text-sand-200 hover:text-sand-100"
                    >
                      Inspect Item →
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* All Submissions Directory */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          {creations.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-forest-900/40 border border-sand-200/15 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <img src={item.logo_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-sand-100">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                      item.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-sand-300/60 line-clamp-1">{item.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => deleteCreation(item.id)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-forest-800"
                  title="Delete creation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-forest-900 border border-sand-200/20 p-6 shadow-glass text-sand-100">
            <button
              onClick={() => setRejectReasonModal(null)}
              className="absolute top-4 right-4 p-1 text-sand-300 hover:text-sand-100"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <h3 className="text-base font-bold text-sand-100">Provide Rejection Feedback</h3>
              <p className="text-xs text-sand-300/70">
                Let the creator know why the creation was rejected so they can revise and re-submit.
              </p>

              <div>
                <textarea
                  rows={3}
                  required
                  value={rejectionInput}
                  onChange={(e) => setRejectionInput(e.target.value)}
                  placeholder="e.g. Website URL is currently unreachable; please verify DNS."
                  className="w-full px-3 py-2 bg-forest-950 border border-sand-200/20 rounded-lg text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectReasonModal(null)}
                  className="px-3 py-1.5 text-xs text-sand-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
