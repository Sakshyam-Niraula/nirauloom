import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Sparkles, 
  Code2, 
  Palette, 
  CheckSquare, 
  Briefcase, 
  GraduationCap, 
  Newspaper, 
  Gamepad2, 
  HeartPulse, 
  Home, 
  UtensilsCrossed, 
  Cpu, 
  Users, 
  Film,
  ArrowRight
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Sparkles,
  Code2,
  Palette,
  CheckSquare,
  Briefcase,
  GraduationCap,
  Newspaper,
  Gamepad2,
  HeartPulse,
  Home,
  UtensilsCrossed,
  Cpu,
  Users,
  Film,
};

export const CategoriesPage: React.FC = () => {
  const { categories, subcategories, creations } = usePlatform();
  const approvedCreations = creations.filter(c => c.status === 'approved');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="border-b border-sand-200/10 pb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-100 font-sans tracking-tight">
          Categories Directory
        </h1>
        <p className="text-sm text-sand-300/70 mt-2 max-w-2xl leading-relaxed">
          15 curated domains connecting independent creators, developers, designers, and students across the globe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category) => {
          const Icon = ICON_MAP[category.icon] || Code2;
          const matchingCreations = approvedCreations.filter(c => c.category_id === category.id);
          const relatedSubs = subcategories.filter(s => s.category_id === category.id);

          return (
            <div
              key={category.id}
              className="rounded-2xl bg-forest-900/40 border border-sand-200/15 p-6 hover:border-sand-200/35 transition-all duration-200 backdrop-blur-sm flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-forest-800 text-sand-100 flex items-center justify-center border border-sand-200/20 shadow-sm">
                    <Icon className="w-6 h-6 text-sand-200" />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-forest-800/80 text-sand-200 border border-sand-200/15 font-semibold">
                    {matchingCreations.length} {matchingCreations.length === 1 ? 'creation' : 'creations'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-sand-100 mb-1.5">
                  {category.name}
                </h3>
                <p className="text-xs text-sand-300/75 leading-relaxed mb-4">
                  {category.description}
                </p>

                {/* Subcategories (if any) */}
                {relatedSubs.length > 0 && (
                  <div className="pt-3 border-t border-sand-200/10 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-sand-300/50 tracking-wider">Subcategories:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {relatedSubs.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/explore?category=${category.id}&subcategory=${sub.id}`}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-forest-950/60 hover:bg-forest-800 text-sand-200 border border-sand-200/10 transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View Category Link */}
              <div className="mt-6 pt-4 border-t border-sand-200/10">
                <Link
                  to={`/explore?category=${category.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand-200 hover:text-sand-50 transition-colors group"
                >
                  <span>Explore {category.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
