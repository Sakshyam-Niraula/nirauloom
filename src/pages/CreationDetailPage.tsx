import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Bookmark, 
  ExternalLink, 
  Share2, 
  AlertTriangle, 
  FolderPlus, 
  ArrowLeft, 
  Sparkles, 
  GraduationCap, 
  Globe, 
  Check,
  Calendar,
  Layers
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { getSimilarCreations } from '../lib/gemini';
import { ReportModal } from '../components/creations/ReportModal';
import { AddToCollectionModal } from '../components/creations/AddToCollectionModal';
import { CreationCard } from '../components/creations/CreationCard';

export const CreationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { 
    creations, 
    bookmarks, 
    appreciations, 
    toggleBookmark, 
    toggleAppreciation 
  } = usePlatform();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  const creation = creations.find(c => c.slug === slug || c.id === slug);

  if (!creation) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-sand-100">Creation not found</h2>
        <p className="text-xs text-sand-300/70">The creation you are looking for may have been removed or renamed.</p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Explorer</span>
        </Link>
      </div>
    );
  }

  const isBookmarked = bookmarks.includes(creation.id);
  const isAppreciated = appreciations.includes(creation.id);

  // Recommended similar creations
  const similar = getSimilarCreations(creation, creations, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const screenshots = creation.screenshots || [];
  const primaryScreenshot = activeScreenshot || (screenshots.length > 0 ? screenshots[0] : null);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-sand-300 hover:text-sand-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to discoveries</span>
        </button>
      </div>

      {/* Main Creation Header Banner */}
      <div className="rounded-3xl bg-forest-900/50 border border-sand-200/20 p-6 sm:p-8 backdrop-blur-xl shadow-glass space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          {/* Logo & Core Title */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-forest-850 border border-sand-200/25 overflow-hidden shrink-0 shadow-md flex items-center justify-center">
              {creation.logo_url ? (
                <img src={creation.logo_url} alt={creation.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-sand-200">{creation.name.charAt(0)}</span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-100 font-sans">
                  {creation.name}
                </h1>
                {creation.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-electric-500/20 text-electric-300 border border-electric-500/30">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </span>
                )}
                {creation.is_student_indie && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Student / Indie Maker
                  </span>
                )}
              </div>

              <p className="text-sm text-sand-200/90 mt-1.5 font-medium max-w-xl">
                {creation.tagline}
              </p>

              {/* Breadcrumb / Category Metadata */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-sand-300/70">
                {creation.category && (
                  <Link
                    to={`/explore?category=${creation.category_id}`}
                    className="px-2.5 py-0.5 rounded-md bg-forest-800 text-sand-200 font-medium hover:bg-forest-700 transition-colors"
                  >
                    {creation.category.name}
                  </Link>
                )}
                {creation.subcategory && (
                  <span className="text-sand-300/50">/ {creation.subcategory.name}</span>
                )}
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-sand-200/10 text-sand-100 font-medium">
                  {creation.pricing_type}
                </span>
                {creation.origin_country && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sand-300/60" />
                      {creation.origin_country}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Visit Website Primary CTA */}
          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <a
              href={creation.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 font-semibold text-sm border border-sand-200/30 transition-all hover:shadow-glow-forest hover:border-sand-200/60"
            >
              <span>Launch Website</span>
              <ExternalLink className="w-4 h-4 text-sand-200" />
            </a>
            <span className="text-[10px] text-sand-300/50 self-center sm:self-end">
              Safe external launch in new tab
            </span>
          </div>
        </div>

        {/* Action Bar (Appreciate, Bookmark, Save to Collection, Share, Report) */}
        <div className="pt-4 border-t border-sand-200/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Appreciation */}
            <button
              onClick={() => toggleAppreciation(creation.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isAppreciated
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-forest-950/60 text-sand-200 hover:bg-forest-800 border border-sand-200/15'
              }`}
            >
              <Heart className={`w-4 h-4 ${isAppreciated ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{isAppreciated ? 'Appreciated' : 'Appreciate'} ({creation.appreciations_count})</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={() => toggleBookmark(creation.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isBookmarked
                  ? 'bg-electric-500/20 text-electric-300 border border-electric-500/40'
                  : 'bg-forest-950/60 text-sand-200 hover:bg-forest-800 border border-sand-200/15'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-electric-400 text-electric-400' : ''}`} />
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            {/* Save to Collection */}
            <button
              onClick={() => setCollectionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-forest-950/60 text-sand-200 hover:bg-forest-800 border border-sand-200/15 font-medium transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-sand-300" />
              <span>Save to Collection</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Share */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-forest-950/60 text-sand-300 hover:text-sand-100 hover:bg-forest-800 border border-sand-200/15 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Link Copied' : 'Share'}</span>
            </button>

            {/* Report */}
            <button
              onClick={() => setReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sand-400/60 hover:text-rose-400 hover:bg-forest-800/40 transition-colors"
              title="Report suspicious or broken creation"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns (Details & Screenshots vs Creator & Metadata) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Screenshots */}
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Description */}
          <div className="rounded-2xl bg-forest-900/40 border border-sand-200/15 p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-base font-bold text-sand-100">About {creation.name}</h2>
            <div className="text-sm text-sand-200/90 leading-relaxed space-y-3 whitespace-pre-line">
              {creation.description}
            </div>

            {/* Tags */}
            <div className="pt-4 border-t border-sand-200/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sand-300/50 mb-2">Platform Tags:</p>
              <div className="flex flex-wrap gap-1.5">
                {creation.tags?.map(tag => (
                  <Link
                    key={tag}
                    to={`/explore?tag=${tag}`}
                    className="text-xs px-2.5 py-1 rounded-md bg-forest-950/60 hover:bg-forest-800 text-sand-200 border border-sand-200/10 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Screenshots Gallery (if available) */}
          {screenshots.length > 0 && (
            <div className="rounded-2xl bg-forest-900/40 border border-sand-200/15 p-6 backdrop-blur-sm space-y-4">
              <h2 className="text-base font-bold text-sand-100">Visual Previews & Interface</h2>
              {primaryScreenshot && (
                <div className="w-full h-72 sm:h-96 rounded-xl overflow-hidden border border-sand-200/20 bg-forest-950">
                  <img
                    src={primaryScreenshot}
                    alt={`${creation.name} Preview`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {screenshots.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {screenshots.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveScreenshot(s)}
                      className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        primaryScreenshot === s ? 'border-electric-500 scale-105' : 'border-sand-200/20 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={s} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Creator Info & Safety Notes */}
        <div className="space-y-6">
          {/* Creator Profile Card */}
          {creation.creator && (
            <div className="rounded-2xl bg-forest-900/40 border border-sand-200/15 p-6 backdrop-blur-sm space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sand-300/50">Crafted By</p>
              <div className="flex items-center gap-3">
                <img
                  src={creation.creator.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
                  alt={creation.creator.display_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-sand-200/20"
                />
                <div>
                  <h3 className="text-base font-bold text-sand-100">{creation.creator.display_name}</h3>
                  <p className="text-xs text-sand-300/60">@{creation.creator.username}</p>
                </div>
              </div>
              <p className="text-xs text-sand-300/80 leading-relaxed">
                {creation.creator.bio || 'Independent creator on NIRAULOOM.'}
              </p>

              <div className="pt-2">
                <Link
                  to={`/creators/${creation.creator.username}`}
                  className="block w-full text-center py-2 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/20 transition-colors"
                >
                  View Creator Profile
                </Link>
              </div>
            </div>
          )}

          {/* Platform Safety Box */}
          <div className="rounded-2xl bg-forest-950/60 border border-sand-200/10 p-5 space-y-2 text-xs text-sand-300/70">
            <p className="font-semibold text-sand-200">Safe Web Discovery</p>
            <p className="leading-relaxed text-[11px]">
              NIRAULOOM uses sandboxed external redirections. Websites submitted by the community are checked for standard safety and community standards.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] text-sand-300/50">
              <Calendar className="w-3 h-3" />
              <span>First added on {new Date(creation.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Creations Section */}
      {similar.length > 0 && (
        <div className="pt-8 border-t border-sand-200/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-sand-100">Similar Creations</h2>
              <p className="text-xs text-sand-300/60 mt-0.5">
                Related digital creations based on category, technology stack, and shared tags.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similar.map(item => (
              <CreationCard key={item.id} creation={item} />
            ))}
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      <ReportModal
        creationId={creation.id}
        creationName={creation.name}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

      <AddToCollectionModal
        creationId={creation.id}
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
      />
    </div>
  );
};
