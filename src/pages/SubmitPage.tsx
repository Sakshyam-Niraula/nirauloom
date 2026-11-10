import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Globe, 
  Upload, 
  Tag, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Plus, 
  X,
  ExternalLink
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';
import { analyzeWebsiteWithAI } from '../lib/gemini';
import { PricingType } from '../types';

export const SubmitPage: React.FC = () => {
  const { categories, subcategories, submitCreation } = usePlatform();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'developer-tools');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('Free');
  const [originCountry, setOriginCountry] = useState('Global');
  const [logoUrl, setLogoUrl] = useState('');
  const [screenshotInput, setScreenshotInput] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['web-app', 'free']);
  const [isStudentIndie, setIsStudentIndie] = useState(false);

  // AI Assistant State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiNotification, setAiNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Submit Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successSubmission, setSuccessSubmission] = useState<{ id: string; status: string } | null>(null);

  const availableSubs = subcategories.filter(s => s.category_id === categoryId);

  // AI Assistant Auto-Fill Handler
  const handleAIAssist = async () => {
    if (!websiteUrl.trim()) {
      setAiNotification({ message: 'Please enter a Website URL first.', type: 'info' });
      return;
    }

    setAiAnalyzing(true);
    setAiNotification(null);

    try {
      const res = await analyzeWebsiteWithAI(websiteUrl, name || 'Digital Project', categories);
      const { suggestion, source } = res;

      if (suggestion.tagline) setTagline(suggestion.tagline);
      if (suggestion.description) setDescription(suggestion.description);
      if (suggestion.category_id) {
        setCategoryId(suggestion.category_id);
        const newSubs = subcategories.filter(s => s.category_id === suggestion.category_id);
        if (newSubs.length > 0) setSubcategoryId(newSubs[0].id);
      }
      if (suggestion.suggested_tags && suggestion.suggested_tags.length > 0) {
        setTags(suggestion.suggested_tags);
      }
      if (suggestion.pricing_type) {
        setPricingType(suggestion.pricing_type as PricingType);
      }

      setAiNotification({
        message: source === 'gemini' 
          ? 'AI metadata generated using Gemini 1.5. You can review and refine any field.' 
          : 'Analyzed website patterns heuristically. Please review and refine.',
        type: 'success'
      });
    } catch {
      setAiNotification({
        message: 'Could not reach AI assistant. You can continue filling out the details manually.',
        type: 'error'
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const handleAddScreenshot = () => {
    if (screenshotInput.trim()) {
      setScreenshots([...screenshots, screenshotInput.trim()]);
      setScreenshotInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg('You must sign in to submit a creation.');
      return;
    }

    // URL validation
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      setErrorMsg('Website URL must start with http:// or https://');
      return;
    }

    setSubmitting(true);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const fallbackLogo = logoUrl.trim() || `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`;

    const res = await submitCreation({
      name: name.trim(),
      slug,
      tagline: tagline.trim() || name.trim(),
      description: description.trim(),
      website_url: websiteUrl.trim(),
      logo_url: fallbackLogo,
      screenshots,
      category_id: categoryId,
      subcategory_id: subcategoryId || undefined,
      pricing_type: pricingType,
      is_featured: false,
      is_student_indie: isStudentIndie,
      origin_country: originCountry || 'Global',
      tags,
    });

    setSubmitting(false);

    if (res.success && res.id) {
      setSuccessSubmission({
        id: res.id,
        status: user.is_admin ? 'approved' : 'pending',
      });
    } else {
      setErrorMsg(res.error || 'Failed to submit creation. Please check your inputs.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-sand-100">Sign in to Submit a Creation</h2>
        <p className="text-xs text-sand-300/70">
          NIRAULOOM requires an authenticated creator profile to submit and manage web creations.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold border border-sand-200/30"
        >
          Sign In or Create Account
        </Link>
      </div>
    );
  }

  if (successSubmission) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-sand-100 font-sans">
            {successSubmission.status === 'approved' ? 'Creation Published!' : 'Submission Received!'}
          </h2>
          <p className="text-xs text-sand-300/75 mt-2 leading-relaxed">
            {successSubmission.status === 'approved'
              ? 'As an administrator, your creation was automatically approved and is now live on the explorer.'
              : 'Your creation has been entered into the moderation queue. Once reviewed by our curation team, it will appear in global discovery.'}
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-forest-800 text-sand-100 text-xs font-semibold border border-sand-200/25"
          >
            Go to Creator Dashboard
          </Link>
          <button
            onClick={() => {
              setSuccessSubmission(null);
              setName('');
              setWebsiteUrl('');
              setTagline('');
              setDescription('');
            }}
            className="px-5 py-2.5 rounded-xl bg-forest-900 text-sand-200 text-xs font-semibold border border-sand-200/15"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-sand-200/10 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-900 border border-sand-200/20 text-sand-200 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-electric-400" />
          <span>Creator Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-sand-100 font-sans tracking-tight">
          Submit Your Digital Creation
        </h1>
        <p className="text-xs text-sand-300/70 mt-1 leading-relaxed">
          Showcase your web app, open-source project, direct-to-consumer store, or generative tool to the world.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL + AI Auto-Fill Helper */}
        <div className="p-5 rounded-2xl bg-forest-900/40 border border-sand-200/15 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-sand-100">Website URL *</label>
            <button
              type="button"
              onClick={handleAIAssist}
              disabled={aiAnalyzing}
              className="inline-flex items-center gap-1.5 text-xs text-electric-300 hover:text-electric-200 font-semibold bg-electric-500/20 px-3 py-1 rounded-lg border border-electric-500/30 transition-all disabled:opacity-50"
            >
              {aiAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-electric-400" />
                  <span>Auto-fill with AI</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/50" />
            <input
              type="url"
              required
              placeholder="https://yourapp.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 placeholder-sand-300/40 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
          </div>

          {aiNotification && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              aiNotification.type === 'success' 
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' 
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
            }`}>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{aiNotification.message}</span>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="p-5 rounded-2xl bg-forest-900/40 border border-sand-200/15 backdrop-blur-sm space-y-4">
          <h2 className="text-sm font-bold text-sand-100 border-b border-sand-200/10 pb-2">Basic Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Creation Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. PrismWeave"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Country / Region</label>
              <input
                type="text"
                placeholder="e.g. Sweden, Global, United States"
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-sand-200 mb-1">Tagline (One sentence) *</label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Generative interactive shader loom for web designers and digital artists"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
            <p className="text-[10px] text-sand-300/50 mt-1">Keep it concise and punchy for the app launcher card.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-sand-200 mb-1">Full Description *</label>
            <textarea
              rows={4}
              required
              placeholder="Explain what problem it solves, key architectural highlights, technology stack, and who will find it valuable..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 placeholder-sand-300/40 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
          </div>
        </div>

        {/* Classification & Pricing */}
        <div className="p-5 rounded-2xl bg-forest-900/40 border border-sand-200/15 backdrop-blur-sm space-y-4">
          <h2 className="text-sm font-bold text-sand-100 border-b border-sand-200/10 pb-2">Classification</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Subcategory</label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              >
                <option value="">None / General</option>
                {availableSubs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-sand-200 mb-1">Pricing Model *</label>
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as PricingType)}
                className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              >
                <option value="Free">Free</option>
                <option value="Open Source">Open Source</option>
                <option value="Freemium">Freemium</option>
                <option value="Paid">Paid</option>
                <option value="Contact">Contact / Custom</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStudentIndie}
                  onChange={(e) => setIsStudentIndie(e.target.checked)}
                  className="rounded border-sand-200/25 bg-forest-950 text-electric-500 w-4 h-4"
                />
                <span className="text-xs text-sand-200 font-medium">
                  Built by student or solo indie creator
                </span>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-sand-200 mb-1">Tags (Press Enter)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add tag (e.g. minimal, 3d, rust)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 px-3.5 py-1.5 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-forest-800 text-sand-200 rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-forest-800 text-sand-200 text-xs font-medium"
                >
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Assets (Logo and Screenshots) */}
        <div className="p-5 rounded-2xl bg-forest-900/40 border border-sand-200/15 backdrop-blur-sm space-y-4">
          <h2 className="text-sm font-bold text-sand-100 border-b border-sand-200/10 pb-2">Media & Assets</h2>

          <div>
            <label className="block text-xs font-semibold text-sand-200 mb-1">Logo / Icon URL (Square recommended)</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-sand-200 mb-1">Screenshots / Previews (Optional URLs)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                placeholder="https://example.com/screenshot.jpg"
                value={screenshotInput}
                onChange={(e) => setScreenshotInput(e.target.value)}
                className="flex-1 px-3.5 py-1.5 bg-forest-950 border border-sand-200/20 rounded-xl text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
              <button
                type="button"
                onClick={handleAddScreenshot}
                className="px-3 py-1.5 bg-forest-800 text-sand-200 rounded-xl text-xs font-semibold"
              >
                Add Image
              </button>
            </div>
            {screenshots.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {screenshots.map((s, idx) => (
                  <div key={idx} className="relative w-24 h-16 rounded-lg overflow-hidden border border-sand-200/20 shrink-0">
                    <img src={s} alt="thumb" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setScreenshots(screenshots.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-forest-950/80 text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-[11px] text-sand-300/60 max-w-sm">
            Submissions are verified by community moderators before appearing in global discovery.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-800 hover:bg-forest-700 text-sand-100 font-semibold text-xs border border-sand-200/30 transition-all hover:shadow-glow-forest disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Creation...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-sand-200" />
                <span>Submit to NIRAULOOM</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
