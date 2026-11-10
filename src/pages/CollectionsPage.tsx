import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderPlus, 
  Sparkles, 
  Layers, 
  Lock, 
  Globe, 
  Plus, 
  X,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';
import { generateAICollection } from '../lib/gemini';

export const CollectionsPage: React.FC = () => {
  const { collections, creations, createCollection } = usePlatform();
  const { user } = useAuth();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Manual creation state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // AI creation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const publicCollections = collections.filter(c => c.is_public || (user && c.user_id === user.id));

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCollection(name.trim(), description.trim(), isPublic);
    setName('');
    setDescription('');
    setCreateModalOpen(false);
  };

  const handleAICreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    try {
      const generated = await generateAICollection(aiPrompt.trim(), creations);
      const itemIds = generated.items.map(i => i.id);
      await createCollection(generated.title, generated.description, true, itemIds);
      setAiPrompt('');
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-sand-100 font-sans tracking-tight">
            Curated Collections
          </h1>
          <p className="text-xs text-sand-300/70 mt-1 max-w-xl leading-relaxed">
            Thematic stacks, workflows, and resource bundles assembled by creators and intelligent AI curators.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold shadow-glow-purple transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-sand-200" />
            <span>New Collection</span>
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publicCollections.map((col) => (
          <div
            key={col.id}
            className="rounded-2xl bg-forest-900/40 border border-sand-200/15 hover:border-sand-200/35 p-6 backdrop-blur-sm transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-sand-300/60">
                  {col.is_public ? (
                    <>
                      <Globe className="w-3 h-3 text-emerald-400" /> Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-amber-400" /> Private
                    </>
                  )}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-forest-800 text-sand-200 border border-sand-200/20">
                  {col.items?.length || col.items_count} items
                </span>
              </div>

              <h3 className="text-lg font-bold text-sand-100 group-hover:text-sand-50 mb-1.5">
                {col.name}
              </h3>
              <p className="text-xs text-sand-300/75 leading-relaxed line-clamp-2">
                {col.description || 'A collection of useful digital creations.'}
              </p>

              {/* Items Thumbnails */}
              <div className="mt-4 pt-4 border-t border-sand-200/10 flex items-center gap-2">
                {col.items?.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="w-10 h-10 rounded-lg bg-forest-850 border border-sand-200/20 overflow-hidden shrink-0"
                    title={item.name}
                  >
                    <img src={item.logo_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {(col.items?.length || 0) > 4 && (
                  <div className="w-10 h-10 rounded-lg bg-forest-800 text-sand-200 text-xs font-bold flex items-center justify-center border border-sand-200/20">
                    +{(col.items?.length || 0) - 4}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-sand-200/10 flex items-center justify-between text-xs">
              <span className="text-sand-300/50">
                Created {new Date(col.created_at).toLocaleDateString()}
              </span>
              <Link
                to={`/collections/${col.slug}`}
                className="font-semibold text-sand-200 group-hover:text-sand-50 flex items-center gap-1"
              >
                <span>View Stack</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-forest-900 border border-sand-200/20 p-6 shadow-glass text-sand-100">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-sand-300 hover:text-sand-100 rounded-lg hover:bg-forest-800"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleManualCreate} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderPlus className="w-5 h-5 text-sand-200" />
                <h3 className="text-base font-bold text-sand-100">Create New Collection</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sand-200 mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Favorite Shader Instruments"
                  className="w-full px-3 py-2 bg-forest-950 border border-sand-200/20 rounded-lg text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sand-200 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this collection focuses on..."
                  className="w-full px-3 py-2 bg-forest-950 border border-sand-200/20 rounded-lg text-xs text-sand-100 placeholder-sand-300/40 focus:outline-none focus:ring-1 focus:ring-electric-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="col-public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-sand-200/20 bg-forest-950 text-electric-500"
                />
                <label htmlFor="col-public" className="text-xs text-sand-200">
                  Make collection public in global discovery
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-sand-300 hover:text-sand-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold rounded-lg border border-sand-200/30"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-forest-900 border border-sand-200/20 p-6 shadow-glass text-sand-100">
            <button
              onClick={() => setAiModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-sand-300 hover:text-sand-100 rounded-lg hover:bg-forest-800"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleAICreate} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-electric-500/20 text-electric-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sand-100">AI Collection Architect</h3>
                  <p className="text-[11px] text-sand-300/60">Generate a custom stack from real database creations.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sand-200 mb-1">
                  Describe what you want to collect:
                </label>
                <textarea
                  rows={3}
                  required
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Free open-source developer tools for building fast backend APIs..."
                  className="w-full px-3 py-2 bg-forest-950 border border-sand-200/20 rounded-lg text-xs text-sand-100 placeholder-sand-300/40 focus:outline-none focus:ring-1 focus:ring-electric-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-sand-300 hover:text-sand-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Weave Collection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
