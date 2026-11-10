import React, { useState } from 'react';
import { X, FolderPlus, Check, Plus } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

interface AddToCollectionModalProps {
  creationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  creationId,
  isOpen,
  onClose,
}) => {
  const { collections, toggleItemInCollection, createCollection } = usePlatform();
  const [newColName, setNewColName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (colId: string) => {
    toggleItemInCollection(colId, creationId);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await createCollection(newColName.trim(), '', true, [creationId]);
    setNewColName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-forest-900 border border-sand-200/20 p-5 shadow-glass text-sand-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-sand-300 hover:text-sand-100 rounded-lg hover:bg-forest-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <FolderPlus className="w-5 h-5 text-sand-200" />
          <h3 className="text-sm font-bold text-sand-100">Save to Collection</h3>
        </div>

        {/* Existing Collections List */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {collections.map((col) => {
            const hasItem = col.items?.some(i => i.id === creationId);
            return (
              <button
                key={col.id}
                onClick={() => handleToggle(col.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                  hasItem
                    ? 'bg-forest-800 border-sand-200/40 text-sand-100'
                    : 'bg-forest-950/50 border-sand-200/10 text-sand-300/80 hover:bg-forest-800/50'
                }`}
              >
                <div>
                  <p className="font-semibold">{col.name}</p>
                  <p className="text-[10px] text-sand-300/60">{col.items_count || 0} items</p>
                </div>
                {hasItem && (
                  <div className="w-5 h-5 rounded-full bg-electric-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Inline Create Form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="mt-4 pt-3 border-t border-sand-200/10 space-y-2">
            <input
              type="text"
              autoFocus
              placeholder="Collection name..."
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="w-full px-3 py-1.5 bg-forest-950 border border-sand-200/20 rounded-lg text-xs text-sand-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2.5 py-1 text-[11px] text-sand-300 hover:text-sand-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-electric-600 hover:bg-electric-500 text-white text-[11px] font-semibold rounded-lg"
              >
                Create & Save
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-sand-200/25 text-xs text-sand-200 hover:bg-forest-800/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Collection</span>
          </button>
        )}
      </div>
    </div>
  );
};
