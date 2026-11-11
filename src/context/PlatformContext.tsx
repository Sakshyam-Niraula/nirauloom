import React, { createContext, useContext, useState, useEffect } from 'react';
import { Creation, Category, Subcategory, Tag, Collection, Report, SubmissionStatus } from '../types';
import { SEED_CATEGORIES, SEED_SUBCATEGORIES, SEED_TAGS, INITIAL_CREATIONS } from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PlatformContextType {
  creations: Creation[];
  categories: Category[];
  subcategories: Subcategory[];
  tags: Tag[];
  collections: Collection[];
  reports: Report[];
  bookmarks: string[]; // creation IDs
  appreciations: string[]; // creation IDs
  loading: boolean;
  refreshCreations: () => Promise<void>;
  // Actions
  toggleBookmark: (creationId: string) => Promise<boolean>;
  toggleAppreciation: (creationId: string) => Promise<boolean>;
  submitCreation: (data: Omit<Creation, 'id' | 'creator_id' | 'status' | 'appreciations_count' | 'bookmarks_count' | 'views_count' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string; id?: string }>;
  updateCreationStatus: (creationId: string, status: SubmissionStatus, rejectionReason?: string) => Promise<boolean>;
  deleteCreation: (creationId: string) => Promise<boolean>;
  createCollection: (name: string, description: string, isPublic: boolean, initialItemIds?: string[]) => Promise<Collection>;
  toggleItemInCollection: (collectionId: string, creationId: string) => Promise<boolean>;
  submitReport: (creationId: string, reason: string, details: string) => Promise<boolean>;
  getCreationBySlug: (slug: string) => Creation | undefined;
  getCreationById: (id: string) => Creation | undefined;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

const LOCAL_CREATIONS_KEY = 'nirauloom_creations_db';
const LOCAL_BOOKMARKS_KEY = 'nirauloom_bookmarks';
const LOCAL_APPRECIATIONS_KEY = 'nirauloom_appreciations';
const LOCAL_COLLECTIONS_KEY = 'nirauloom_collections';
const LOCAL_REPORTS_KEY = 'nirauloom_reports';

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [categories] = useState<Category[]>(SEED_CATEGORIES);
  const [subcategories] = useState<Subcategory[]>(SEED_SUBCATEGORIES);
  const [tags] = useState<Tag[]>(SEED_TAGS);

  const [creations, setCreations] = useState<Creation[]>(() => {
    const saved = localStorage.getItem(LOCAL_CREATIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_CREATIONS;
      }
    }
    return INITIAL_CREATIONS;
  });

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
    return saved ? JSON.parse(saved) : ['creation-1', 'creation-2'];
  });

  const [appreciations, setAppreciations] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_APPRECIATIONS_KEY);
    return saved ? JSON.parse(saved) : ['creation-1'];
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem(LOCAL_COLLECTIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback below
      }
    }
    return [
      {
        id: 'col-1',
        user_id: 'creator-1',
        name: 'Sensory Web & Creative Code',
        slug: 'sensory-web-creative-code',
        description: 'Interactive instruments, WebGL shaders, and audio experiments pushing browser limits.',
        is_public: true,
        items_count: 2,
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
        items: [INITIAL_CREATIONS[0], INITIAL_CREATIONS[5]],
      },
      {
        id: 'col-2',
        user_id: 'creator-2',
        name: 'Indie Hacker Dev Stack',
        slug: 'indie-hacker-dev-stack',
        description: 'Sub-second speed tools, edge databases, and agent operating systems for solo founders.',
        is_public: true,
        items_count: 2,
        created_at: '2026-02-20T00:00:00Z',
        updated_at: '2026-02-20T00:00:00Z',
        items: [INITIAL_CREATIONS[1], INITIAL_CREATIONS[4]],
      },
    ];
  });

  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem(LOCAL_REPORTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Sync with Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      loadFromSupabase();
    }
  }, []);

  // Load the signed-in user's real bookmarks from Supabase.
  // Bookmarks are protected by the user's own-row RLS policy.
  useEffect(() => {
    let cancelled = false;

    const loadUserBookmarks = async () => {
      if (!user) {
        setBookmarks([]);
        return;
      }
      if (!isSupabaseConfigured || !supabase) return;

      const client = supabase;
      setBookmarks([]);
      const { data, error } = await client
        .from('bookmarks')
        .select('creation_id')
        .eq('user_id', user.id);

      if (cancelled) return;
      if (error) {
        console.warn('Could not load account bookmarks:', error);
        setBookmarks([]);
        return;
      }
      setBookmarks((data || []).map((row) => row.creation_id));
    };

    void loadUserBookmarks();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loadFromSupabase = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creations')
        .select(`
          *,
          creator:profiles(*),
          category:categories(*),
          subcategory:subcategories(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCreations(data as Creation[]);
      }
    } catch (e) {
      console.warn('Using local dataset as primary source:', e);
    } finally {
      setLoading(false);
    }
  };

  // Save changes to localStorage for offline / client reliability
  useEffect(() => {
    localStorage.setItem(LOCAL_CREATIONS_KEY, JSON.stringify(creations));
  }, [creations]);

  useEffect(() => {
    localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(LOCAL_APPRECIATIONS_KEY, JSON.stringify(appreciations));
  }, [appreciations]);

  useEffect(() => {
    localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  }, [reports]);

  // Actions
  const toggleBookmark = async (creationId: string): Promise<boolean> => {
    const isBookmarked = bookmarks.includes(creationId);
    let updatedBookmarks: string[];

    if (isBookmarked) {
      updatedBookmarks = bookmarks.filter(id => id !== creationId);
    } else {
      updatedBookmarks = [...bookmarks, creationId];
    }
    setBookmarks(updatedBookmarks);

    // Update creation count
    setCreations(prev =>
      prev.map(c => {
        if (c.id === creationId) {
          const delta = isBookmarked ? -1 : 1;
          return { ...c, bookmarks_count: Math.max(0, c.bookmarks_count + delta) };
        }
        return c;
      })
    );

    if (isSupabaseConfigured && supabase && user) {
      if (isBookmarked) {
        await supabase.from('bookmarks').delete().match({ user_id: user.id, creation_id: creationId });
      } else {
        await supabase.from('bookmarks').insert({ user_id: user.id, creation_id: creationId });
      }
    }

    return !isBookmarked;
  };

  const toggleAppreciation = async (creationId: string): Promise<boolean> => {
    const isAppreciated = appreciations.includes(creationId);
    let updatedAppreciations: string[];

    if (isAppreciated) {
      updatedAppreciations = appreciations.filter(id => id !== creationId);
    } else {
      updatedAppreciations = [...appreciations, creationId];
    }
    setAppreciations(updatedAppreciations);

    // Update creation count
    setCreations(prev =>
      prev.map(c => {
        if (c.id === creationId) {
          const delta = isAppreciated ? -1 : 1;
          return { ...c, appreciations_count: Math.max(0, c.appreciations_count + delta) };
        }
        return c;
      })
    );

    if (isSupabaseConfigured && supabase && user) {
      if (isAppreciated) {
        await supabase.from('appreciations').delete().match({ user_id: user.id, creation_id: creationId });
      } else {
        await supabase.from('appreciations').insert({ user_id: user.id, creation_id: creationId });
      }
    }

    return !isAppreciated;
  };

  const submitCreation = async (
    data: Omit<Creation, 'id' | 'creator_id' | 'status' | 'appreciations_count' | 'bookmarks_count' | 'views_count' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string; id?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be signed in to submit a creation.' };
    }

    const id = crypto.randomUUID();
    const matchedCategory = categories.find(c => c.id === data.category_id);
    const matchedSubcategory = subcategories.find(s => s.id === data.subcategory_id);

    // Auto-approve if user is admin, else set to pending
    const status: SubmissionStatus = user.is_admin ? 'approved' : 'pending';

    const newCreation: Creation = {
      ...data,
      id,
      creator_id: user.id,
      status,
      appreciations_count: 0,
      bookmarks_count: 0,
      views_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: user,
      category: matchedCategory,
      subcategory: matchedSubcategory,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: insertError } = await supabase.from('creations').insert({
          id,
          creator_id: user.id,
          name: data.name,
          slug: data.slug,
          tagline: data.tagline,
          description: data.description,
          website_url: data.website_url,
          logo_url: data.logo_url,
          screenshots: data.screenshots,
          category_id: data.category_id,
          subcategory_id: data.subcategory_id || null,
          pricing_type: data.pricing_type,
          is_featured: data.is_featured,
          is_student_indie: data.is_student_indie,
          origin_country: data.origin_country || 'Global',
          status,
        });
        if (insertError) return { success: false, error: insertError.message };
      } catch (err) {
        console.warn('Failed to insert into live Supabase:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Could not save your project.' };
      }
    }

    setCreations(prev => [newCreation, ...prev]);
    return { success: true, id };
  };

  const updateCreationStatus = async (
    creationId: string,
    status: SubmissionStatus,
    rejectionReason?: string
  ): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('creations')
        .update({ status, rejection_reason: rejectionReason || null, updated_at: new Date().toISOString() })
        .eq('id', creationId);
      if (error) {
        console.error('Could not update creation status:', error);
        return false;
      }
    }

    setCreations(prev =>
      prev.map(c => c.id === creationId
        ? { ...c, status, rejection_reason: status === 'rejected' ? rejectionReason : undefined, updated_at: new Date().toISOString() }
        : c)
    );
    return true;
  };

  const deleteCreation = async (creationId: string): Promise<boolean> => {
    setCreations(prev => prev.filter(c => c.id !== creationId));

    if (isSupabaseConfigured && supabase) {
      await supabase.from('creations').delete().eq('id', creationId);
    }

    return true;
  };

  const createCollection = async (
    name: string,
    description: string,
    isPublic: boolean,
    initialItemIds: string[] = []
  ): Promise<Collection> => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const matchedItems = creations.filter(c => initialItemIds.includes(c.id));

    const newCol: Collection = {
      id: `col-${Date.now()}`,
      user_id: user?.id || 'guest',
      name,
      slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
      description,
      is_public: isPublic,
      items_count: matchedItems.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: user || undefined,
      items: matchedItems,
    };

    setCollections(prev => [newCol, ...prev]);

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from('collections').insert({
        id: newCol.id,
        user_id: user.id,
        name,
        slug: newCol.slug,
        description,
        is_public: isPublic,
      });

      if (initialItemIds.length > 0) {
        const itemRows = initialItemIds.map(creation_id => ({
          collection_id: newCol.id,
          creation_id,
        }));
        await supabase.from('collection_items').insert(itemRows);
      }
    }

    return newCol;
  };

  const toggleItemInCollection = async (collectionId: string, creationId: string): Promise<boolean> => {
    const creation = creations.find(c => c.id === creationId);
    if (!creation) return false;

    let wasAdded = false;

    setCollections(prev =>
      prev.map(col => {
        if (col.id === collectionId) {
          const existing = col.items || [];
          const exists = existing.some(i => i.id === creationId);
          wasAdded = !exists;
          const updatedItems = exists
            ? existing.filter(i => i.id !== creationId)
            : [...existing, creation];
          return {
            ...col,
            items: updatedItems,
            items_count: updatedItems.length,
            updated_at: new Date().toISOString(),
          };
        }
        return col;
      })
    );

    return wasAdded;
  };

  const submitReport = async (creationId: string, reason: string, details: string): Promise<boolean> => {
    const matchedCreation = creations.find(c => c.id === creationId);
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      reporter_id: user?.id || 'anonymous',
      creation_id: creationId,
      reason,
      details,
      status: 'pending',
      created_at: new Date().toISOString(),
      creation: matchedCreation,
    };

    setReports(prev => [newReport, ...prev]);

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from('reports').insert({
        id: newReport.id,
        reporter_id: user.id,
        creation_id: creationId,
        reason,
        details,
      });
    }

    return true;
  };

  const getCreationBySlug = (slug: string) => {
    return creations.find(c => c.slug === slug);
  };

  const getCreationById = (id: string) => {
    return creations.find(c => c.id === id);
  };

  return (
    <PlatformContext.Provider
      value={{
        creations,
        categories,
        subcategories,
        tags,
        collections,
        reports,
        bookmarks,
        appreciations,
        loading,
        refreshCreations: loadFromSupabase,
        toggleBookmark,
        toggleAppreciation,
        submitCreation,
        updateCreationStatus,
        deleteCreation,
        createCollection,
        toggleItemInCollection,
        submitReport,
        getCreationBySlug,
        getCreationById,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
