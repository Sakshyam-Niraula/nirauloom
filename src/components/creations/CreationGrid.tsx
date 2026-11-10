import React from 'react';
import { Creation } from '../../types';
import { CreationCard } from './CreationCard';
import { Layers } from 'lucide-react';

interface CreationGridProps {
  creations: Creation[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  columns?: 2 | 3 | 4;
}

export const CreationGrid: React.FC<CreationGridProps> = ({
  creations,
  loading = false,
  emptyTitle = 'No creations found',
  emptyMessage = 'Try adjusting your search keywords, filters, or category selection.',
  columns = 3,
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="rounded-2xl bg-forest-900/30 border border-sand-200/10 p-5 animate-pulse h-64">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-forest-800/80" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-forest-800/80 rounded w-2/3" />
                <div className="h-3 bg-forest-800/60 rounded w-1/3" />
              </div>
            </div>
            <div className="h-12 bg-forest-800/40 rounded mb-4" />
            <div className="h-4 bg-forest-800/50 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (creations.length === 0) {
    return (
      <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-sand-200/20 bg-forest-900/20 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-forest-800/60 text-sand-300 flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-sand-100">{emptyTitle}</h3>
        <p className="text-xs text-sand-300/60 mt-1 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
      {creations.map((creation) => (
        <CreationCard key={creation.id} creation={creation} />
      ))}
    </div>
  );
};
