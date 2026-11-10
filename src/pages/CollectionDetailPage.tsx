import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Globe, 
  Lock, 
  Trash2, 
  Share2, 
  Check, 
  Layers, 
  Calendar 
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';
import { CreationCard } from '../components/creations/CreationCard';

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { collections, toggleItemInCollection } = usePlatform();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const collection = collections.find(c => c.slug === slug || c.id === slug);

  if (!collection) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-sand-100">Collection not found</h2>
        <p className="text-xs text-sand-300/70">This collection might have been deleted or made private.</p>
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collections</span>
        </Link>
      </div>
    );
  }

  const isOwner = user && collection.user_id === user.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = (creationId: string) => {
    toggleItemInCollection(collection.id, creationId);
  };

  const items = collection.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <button
          onClick={() => navigate('/collections')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-sand-300 hover:text-sand-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all collections</span>
        </button>
      </div>

      {/* Collection Header */}
      <div className="rounded-3xl bg-forest-900/50 border border-sand-200/20 p-6 sm:p-8 backdrop-blur-xl shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-sand-300/60">
              {collection.is_public ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Public Stack
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Private Stack
                </>
              )}
            </span>
            <span className="text-sand-300/40">•</span>
            <span className="text-xs text-sand-300/70">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-100 font-sans">
            {collection.name}
          </h1>
          <p className="text-xs sm:text-sm text-sand-300/80 mt-2 max-w-2xl leading-relaxed">
            {collection.description || 'A handpicked compilation of digital tools on NIRAULOOM.'}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-sand-300/50">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created {new Date(collection.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Share Button */}
        <div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/25 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Share Link Copied' : 'Share Collection'}</span>
          </button>
        </div>
      </div>

      {/* Items Section */}
      <div>
        <h2 className="text-xl font-bold text-sand-100 mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-sand-200" />
          <span>Curated Creations ({items.length})</span>
        </h2>

        {items.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
            <p className="text-sm font-semibold text-sand-200">This collection is currently empty</p>
            <p className="text-xs text-sand-300/60 mt-1">Explore the directory to add creations to this stack.</p>
            <Link
              to="/explore"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold"
            >
              Browse Creations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(creation => (
              <div key={creation.id} className="relative group">
                <CreationCard creation={creation} />
                {isOwner && (
                  <button
                    onClick={() => handleRemove(creation.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-forest-950/80 text-rose-400 hover:text-rose-300 border border-sand-200/20 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    title="Remove from collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
