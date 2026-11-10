import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Sparkles, 
  X, 
  Tag as TagIcon,
  Check
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { CreationCard } from '../components/creations/CreationCard';
import { CreationGrid } from '../components/creations/CreationGrid';

export const ExplorePage: React.FC = () => {
  const { creations, categories, subcategories, tags } = usePlatform();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedSubcategory = searchParams.get('subcategory') || 'all';
  const selectedTag = searchParams.get('tag') || 'all';
  const selectedPricing = searchParams.get('pricing') || 'all';
  const sortBy = searchParams.get('sort') || 'trending'; // trending, newest, popular, alpha
  const isStudentOnly = searchParams.get('filter') === 'student';

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Available subcategories for chosen category
  const filteredSubcategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    return subcategories.filter(s => s.category_id === selectedCategory);
  }, [selectedCategory, subcategories]);

  // Filter creations
  const filteredCreations = useMemo(() => {
    return creations.filter(creation => {
      // Must be approved
      if (creation.status !== 'approved') return false;

      // Student filter
      if (isStudentOnly && !creation.is_student_indie) return false;

      // Category filter
      if (selectedCategory !== 'all' && creation.category_id !== selectedCategory) return false;

      // Subcategory filter
      if (selectedSubcategory !== 'all' && creation.subcategory_id !== selectedSubcategory) return false;

      // Tag filter
      if (selectedTag !== 'all' && !creation.tags?.includes(selectedTag)) return false;

      // Pricing filter
      if (selectedPricing !== 'all' && creation.pricing_type !== selectedPricing) return false;

      // Search keywords
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = creation.name.toLowerCase().includes(q);
        const matchesTagline = creation.tagline.toLowerCase().includes(q);
        const matchesDesc = creation.description.toLowerCase().includes(q);
        const matchesTags = creation.tags?.some(t => t.toLowerCase().includes(q));
        const matchesCountry = creation.origin_country?.toLowerCase().includes(q);
        if (!matchesName && !matchesTagline && !matchesDesc && !matchesTags && !matchesCountry) {
          return false;
        }
      }

      return true;
    });
  }, [creations, isStudentOnly, selectedCategory, selectedSubcategory, selectedTag, selectedPricing, searchQuery]);

  // Sort creations
  const sortedCreations = useMemo(() => {
    const list = [...filteredCreations];
    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'popular':
      case 'trending':
        return list.sort((a, b) => b.appreciations_count - a.appreciations_count);
      case 'alpha':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [filteredCreations, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedCreations.length / itemsPerPage);
  const paginatedCreations = sortedCreations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const updateParam = (key: string, value: string) => {
    const updated = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      updated.delete(key);
    } else {
      updated.set(key, value);
    }
    // Reset page on filter change
    setCurrentPage(1);
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedSubcategory !== 'all' || selectedTag !== 'all' || selectedPricing !== 'all' || isStudentOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-sand-100 font-sans tracking-tight">
            App Launcher & Explorer
          </h1>
          <p className="text-xs text-sand-300/70 mt-1 max-w-xl leading-relaxed">
            Browse verified digital products, open-source code repositories, WebGL experiments, and e-commerce innovations.
          </p>
        </div>

        {/* Global Result Counter */}
        <div className="flex items-center gap-2 text-xs text-sand-300/60">
          <span>Showing <strong className="text-sand-100">{sortedCreations.length}</strong> creations</span>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-electric-400 hover:text-electric-300 font-medium ml-2 flex items-center gap-1 underline underline-offset-2"
            >
              <X className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Search + Sort + Pricing */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/50" />
          <input
            type="text"
            placeholder="Search by name, tags, description, country..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-forest-900/60 border border-sand-200/20 rounded-xl text-xs text-sand-100 placeholder-sand-300/50 focus:outline-none focus:ring-1 focus:ring-electric-500 backdrop-blur-md"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateParam('q', '');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-300/60 hover:text-sand-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Controls: Pricing Pill & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pricing Selector */}
          <div className="flex items-center bg-forest-900/60 border border-sand-200/20 rounded-xl p-1 text-xs text-sand-300">
            {['all', 'Free', 'Open Source', 'Freemium', 'Paid'].map((price) => (
              <button
                key={price}
                onClick={() => updateParam('pricing', price)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedPricing === price
                    ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
                    : 'hover:text-sand-100'
                }`}
              >
                {price === 'all' ? 'All Pricing' : price}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center bg-forest-900/60 border border-sand-200/20 rounded-xl px-2.5 py-1 text-xs text-sand-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-sand-300/60 mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="bg-transparent text-xs text-sand-100 focus:outline-none cursor-pointer py-1"
            >
              <option value="trending" className="bg-forest-900">Trending (Appreciations)</option>
              <option value="newest" className="bg-forest-900">Newest First</option>
              <option value="alpha" className="bg-forest-900">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills (Horizontal Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => {
            updateParam('category', 'all');
            updateParam('subcategory', 'all');
          }}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-sand-200 text-forest-950 shadow-sm'
              : 'bg-forest-900/60 text-sand-300/80 hover:text-sand-100 hover:bg-forest-900 border border-sand-200/10'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              updateParam('category', cat.id);
              updateParam('subcategory', 'all');
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-sand-200 text-forest-950 font-semibold shadow-sm'
                : 'bg-forest-900/60 text-sand-300/80 hover:text-sand-100 hover:bg-forest-900 border border-sand-200/10'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategory Pills (When Category is Selected) */}
      {filteredSubcategories.length > 0 && (
        <div className="p-3 rounded-xl bg-forest-900/30 border border-sand-200/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-sand-300/60 font-semibold text-[11px] uppercase tracking-wider pl-1">Subcategories:</span>
          <button
            onClick={() => updateParam('subcategory', 'all')}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
              selectedSubcategory === 'all'
                ? 'bg-forest-800 text-sand-100 font-bold border border-sand-200/25'
                : 'text-sand-300/70 hover:text-sand-100'
            }`}
          >
            All Subcategories
          </button>
          {filteredSubcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => updateParam('subcategory', sub.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                selectedSubcategory === sub.id
                  ? 'bg-forest-800 text-sand-100 font-bold border border-sand-200/25'
                  : 'text-sand-300/70 hover:text-sand-100 hover:bg-forest-900'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Popular Tags Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-sand-300/50 flex items-center gap-1 text-[11px]">
          <TagIcon className="w-3 h-3" /> Filter by Tag:
        </span>
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => updateParam('tag', selectedTag === tag.id ? 'all' : tag.id)}
            className={`px-2.5 py-0.5 rounded-md text-[11px] transition-colors border ${
              selectedTag === tag.id
                ? 'bg-electric-500/20 text-electric-300 border-electric-500/40 font-semibold'
                : 'bg-forest-950/40 text-sand-300/70 border-sand-200/10 hover:text-sand-100'
            }`}
          >
            #{tag.name}
          </button>
        ))}
      </div>

      {/* Creations Grid */}
      <CreationGrid
        creations={paginatedCreations}
        emptyTitle="No creations found"
        emptyMessage="Try clearing some filter criteria or searching with different terms."
      />

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3.5 py-1.5 rounded-lg text-xs bg-forest-900 border border-sand-200/15 text-sand-200 disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                currentPage === page
                  ? 'bg-sand-200 text-forest-950'
                  : 'bg-forest-900 text-sand-300 border border-sand-200/10 hover:bg-forest-800'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3.5 py-1.5 rounded-lg text-xs bg-forest-900 border border-sand-200/15 text-sand-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
