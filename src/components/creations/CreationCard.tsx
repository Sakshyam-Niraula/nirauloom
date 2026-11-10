import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Bookmark, 
  ExternalLink, 
  Sparkles, 
  GraduationCap, 
  Globe,
  Share2,
  Check
} from 'lucide-react';
import { Creation } from '../../types';
import { usePlatform } from '../../context/PlatformContext';

interface CreationCardProps {
  creation: Creation;
  layout?: 'grid' | 'compact' | 'row';
}

export const CreationCard: React.FC<CreationCardProps> = ({ 
  creation,
  layout = 'grid'
}) => {
  const { bookmarks, appreciations, toggleBookmark, toggleAppreciation } = usePlatform();
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isBookmarked = bookmarks.includes(creation.id);
  const isAppreciated = appreciations.includes(creation.id);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/creations/${creation.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(creation.id);
  };

  const handleAppreciation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleAppreciation(creation.id);
  };

  return (
    <div className="group relative rounded-2xl bg-forest-900/40 hover:bg-forest-900/70 border border-sand-200/15 hover:border-sand-200/35 transition-all duration-300 hover:shadow-glass-hover backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Top Banner / Card Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3.5">
          {/* Logo / Launcher Icon */}
          <Link 
            to={`/creations/${creation.slug}`}
            className="relative shrink-0 block group-hover:scale-105 transition-transform duration-200 focus:outline-none"
          >
            <div className="w-13 h-13 rounded-xl bg-forest-850 border border-sand-200/20 overflow-hidden flex items-center justify-center shadow-md">
              {!imgError && creation.logo_url ? (
                <img
                  src={creation.logo_url}
                  alt={creation.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-forest-800 text-sand-200 font-extrabold text-lg">
                  {creation.name.charAt(0)}
                </div>
              )}
            </div>
            {creation.is_featured && (
              <span 
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-electric-500 text-white shadow-glow-purple"
                title="Featured Creation"
              >
                <Sparkles className="w-3 h-3" />
              </span>
            )}
          </Link>

          {/* Pricing & Badges */}
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {creation.is_student_indie && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                <GraduationCap className="w-3 h-3" />
                Student
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
              creation.pricing_type === 'Free' || creation.pricing_type === 'Open Source'
                ? 'bg-forest-800/80 text-sand-200 border-sand-200/25'
                : 'bg-sand-200/15 text-sand-100 border-sand-200/30'
            }`}>
              {creation.pricing_type}
            </span>
          </div>
        </div>

        {/* Title & Tagline */}
        <div>
          <div className="flex items-center gap-2">
            <Link 
              to={`/creations/${creation.slug}`}
              className="text-base font-bold text-sand-100 group-hover:text-sand-50 transition-colors line-clamp-1"
            >
              {creation.name}
            </Link>
          </div>
          <p className="text-xs text-sand-300/75 mt-1 line-clamp-2 leading-relaxed">
            {creation.tagline || creation.description}
          </p>
        </div>

        {/* Tags / Meta Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {creation.category && (
            <Link
              to={`/explore?category=${creation.category_id}`}
              className="text-[10px] px-2 py-0.5 rounded-md bg-forest-800/60 hover:bg-forest-800 text-sand-200/90 border border-sand-200/10 transition-colors font-medium"
            >
              {creation.category.name}
            </Link>
          )}
          {creation.tags?.slice(0, 2).map(tag => (
            <Link
              key={tag}
              to={`/explore?tag=${tag}`}
              className="text-[10px] px-2 py-0.5 rounded-md bg-sand-200/5 hover:bg-sand-200/15 text-sand-300/80 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Card Footer: Creator info + Actions */}
      <div className="px-5 py-3 border-t border-sand-200/10 bg-forest-950/30 flex items-center justify-between gap-2 text-xs">
        {/* Creator Info */}
        <Link
          to={`/creators/${creation.creator?.username || 'creator'}`}
          className="flex items-center gap-2 text-sand-300/70 hover:text-sand-100 transition-colors max-w-[130px] truncate"
        >
          <img
            src={creation.creator?.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
            alt={creation.creator?.display_name || 'Creator'}
            className="w-5 h-5 rounded-full object-cover border border-sand-200/20 shrink-0"
          />
          <span className="text-[11px] font-medium truncate">
            {creation.creator?.display_name || 'Creator'}
          </span>
        </Link>

        {/* Actions: Upvote / Bookmark / Visit External */}
        <div className="flex items-center gap-1.5">
          {/* Appreciation button */}
          <button
            onClick={handleAppreciation}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
              isAppreciated
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-sand-300/70 hover:text-sand-100 hover:bg-forest-800/60'
            }`}
            title="Appreciate this creation"
          >
            <Heart className={`w-3.5 h-3.5 ${isAppreciated ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>{creation.appreciations_count}</span>
          </button>

          {/* Bookmark button */}
          <button
            onClick={handleBookmark}
            className={`p-1 rounded-md transition-colors ${
              isBookmarked
                ? 'text-electric-400 bg-electric-500/20'
                : 'text-sand-300/60 hover:text-sand-100 hover:bg-forest-800/60'
            }`}
            title={isBookmarked ? 'Bookmarked' : 'Add to bookmarks'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-electric-400' : ''}`} />
          </button>

          {/* Safe External Link */}
          <a
            href={creation.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md text-sand-300/60 hover:text-sand-100 hover:bg-forest-800/60 transition-colors"
            title="Launch external site safely in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
