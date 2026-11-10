import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Layers, 
  Loader2, 
  CheckCircle2, 
  Compass,
  Cpu
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { naturalLanguageDiscover, isGeminiConfigured } from '../lib/gemini';
import { Creation } from '../types';
import { CreationCard } from '../components/creations/CreationCard';

export const AIDiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { creations } = usePlatform();
  const approvedCreations = creations.filter(c => c.status === 'approved');

  const [prompt, setPrompt] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Creation[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [intent, setIntent] = useState<{ category?: string; pricing?: string; audience?: string } | null>(null);

  const samplePrompts = [
    'Find free AI tools for students',
    'Open source developer tools for backend APIs',
    'Minimalist audio or focus apps',
    'Direct-to-consumer sustainable retail',
    'Interactive 3D and WebGL experiments',
  ];

  const handleSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setSearchParams({ q: queryText.trim() });

    try {
      const res = await naturalLanguageDiscover(queryText.trim(), approvedCreations);
      setResults(res.matches);
      setReasoning(res.reasoning);
      setIntent(res.extractedQueryIntent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim()) {
      handleSearch(initialQuery);
    } else {
      // Default to top approved
      setResults(approvedCreations.slice(0, 4));
      setReasoning('Showing trending platform creations across all categories.');
    }
  }, [initialQuery]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(prompt);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* AI Discovery Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-electric-500/15 border border-electric-500/30 text-electric-300 text-xs font-semibold shadow-glow-purple">
          <Sparkles className="w-4 h-4 text-electric-400 animate-pulse" />
          <span>Real Database Natural Language Matching</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-sand-100 font-sans tracking-tight">
          AI Creation Discoverer
        </h1>
        <p className="text-sm text-sand-300/80 leading-relaxed">
          Express your requirements in plain English. NIRAULOOM AI analyzes user intent and matches verified tools, 
          platforms, and products strictly from our live PostgreSQL registry.
        </p>

        {/* Prompt Input Box */}
        <form onSubmit={onSubmit} className="pt-2">
          <div className="relative flex items-center rounded-2xl bg-forest-900/80 border border-sand-200/25 p-2 shadow-glass backdrop-blur-xl focus-within:border-electric-500/80 focus-within:shadow-glow-purple transition-all">
            <Search className="w-5 h-5 text-sand-300/60 ml-3" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Find free AI tools for students and researchers..."
              className="w-full bg-transparent border-none px-3 py-2.5 text-sm text-sand-100 placeholder-sand-300/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold shadow-glow-purple transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Matching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Discover</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Prompt Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
          <span className="text-sand-300/50 text-[11px]">Inspirations:</span>
          {samplePrompts.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPrompt(p);
                handleSearch(p);
              }}
              className="px-3 py-1 rounded-full bg-forest-900/60 hover:bg-forest-900 text-sand-300/80 hover:text-sand-100 border border-sand-200/10 text-[11px] transition-colors"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      {/* Intelligence Insight Banner */}
      {reasoning && (
        <div className="p-5 rounded-2xl bg-forest-900/40 border border-sand-200/15 backdrop-blur-sm max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-electric-500/20 text-electric-300 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sand-300/50">Discovery Reasoning</p>
              <p className="text-xs text-sand-100 mt-0.5 leading-relaxed">{reasoning}</p>
            </div>
          </div>

          {intent && (intent.category || intent.pricing || intent.audience) && (
            <div className="flex items-center gap-2 text-xs shrink-0 pt-2 sm:pt-0">
              {intent.category && (
                <span className="px-2.5 py-1 rounded-lg bg-forest-800 text-sand-200 border border-sand-200/20 text-[11px] font-medium">
                  {intent.category}
                </span>
              )}
              {intent.pricing && (
                <span className="px-2.5 py-1 rounded-lg bg-forest-800 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                  {intent.pricing}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Result Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-sand-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-electric-400" />
            <span>Matched Platform Creations ({results.length})</span>
          </h2>
          <span className="text-xs text-sand-300/50">
            Engine: {isGeminiConfigured ? 'Gemini 1.5 Flash' : 'Deterministic Semantic Parser'}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-sand-200/20 rounded-2xl bg-forest-900/20">
            <p className="text-sm font-semibold text-sand-200">No creations matched this description</p>
            <p className="text-xs text-sand-300/60 mt-1">Try broadening your prompt or checking different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((c) => (
              <CreationCard key={c.id} creation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
