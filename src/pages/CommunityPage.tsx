import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ExternalLink, Send, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type FeedPost = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  website_url: string;
  logo_url: string;
  created_at: string;
  appreciations_count: number;
  creator_id: string;
  creator?: { username: string; display_name: string; avatar_url?: string };
};

type FeedComment = {
  id: string;
  body: string;
  created_at: string;
  author?: { username: string; display_name: string; avatar_url?: string };
};

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadFeed = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setError('The community feed requires the live database connection.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: feedError } = await supabase
      .from('creations')
      .select('id,name,slug,tagline,description,website_url,logo_url,created_at,appreciations_count,creator_id,creator:profiles(username,display_name,avatar_url)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (feedError) {
      setError(feedError.message);
      setLoading(false);
      return;
    }

    const feedPosts = (data || []) as unknown as FeedPost[];
    setPosts(feedPosts);

    const postIds = feedPosts.map(post => post.id);
    if (user && postIds.length) {
      const { data: likes } = await supabase
        .from('appreciations')
        .select('creation_id')
        .eq('user_id', user.id)
        .in('creation_id', postIds);
      setLikedIds((likes || []).map((like: { creation_id: string }) => like.creation_id));
    } else {
      setLikedIds([]);
    }

    if (postIds.length) {
      const { data: commentRows } = await supabase
        .from('creation_comments')
        .select('id,creation_id,body,created_at,author:profiles(username,display_name,avatar_url)')
        .in('creation_id', postIds)
        .order('created_at', { ascending: true });
      const grouped: Record<string, FeedComment[]> = {};
      (commentRows || []).forEach((row: any) => {
        grouped[row.creation_id] = [...(grouped[row.creation_id] || []), row];
      });
      setComments(grouped);
    } else {
      setComments({});
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadFeed(); }, [loadFeed]);

  const toggleLike = async (post: FeedPost) => {
    if (!user || !supabase) {
      setError('Sign in to appreciate a project.');
      return;
    }
    setBusy(post.id);
    const alreadyLiked = likedIds.includes(post.id);
    const result = alreadyLiked
      ? await supabase.from('appreciations').delete().match({ user_id: user.id, creation_id: post.id })
      : await supabase.from('appreciations').insert({ user_id: user.id, creation_id: post.id });
    if (result.error) {
      setError(result.error.message);
    } else {
      setLikedIds(current => alreadyLiked ? current.filter(id => id !== post.id) : [...current, post.id]);
      setPosts(current => current.map(item => item.id === post.id
        ? { ...item, appreciations_count: Math.max(0, item.appreciations_count + (alreadyLiked ? -1 : 1)) }
        : item));
    }
    setBusy(null);
  };

  const submitComment = async (post: FeedPost) => {
    const body = (drafts[post.id] || '').trim();
    if (!user || !supabase) {
      setError('Sign in to join the conversation.');
      return;
    }
    if (!body) return;
    setBusy(post.id);
    const { data, error: commentError } = await supabase
      .from('creation_comments')
      .insert({ creation_id: post.id, author_id: user.id, body })
      .select('id,body,created_at,author:profiles(username,display_name,avatar_url)')
      .single();
    if (commentError) {
      setError(commentError.message);
    } else {
      setComments(current => ({ ...current, [post.id]: [...(current[post.id] || []), data as unknown as FeedComment] }));
      setDrafts(current => ({ ...current, [post.id]: '' }));
      setOpenComments(current => current.includes(post.id) ? current : [...current, post.id]);
    }
    setBusy(null);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-7">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sand-200/10 pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric-400 font-bold">The NIRAULOOM community</p>
          <h1 className="text-3xl font-extrabold text-sand-100 mt-2">Community Feed</h1>
          <p className="text-sm text-sand-300/70 mt-2">Projects launched by independent creators. Discover, appreciate, and join the conversation.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadFeed()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-sand-200/20 text-sand-200 text-xs hover:bg-forest-800">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link to="/submit" className="px-4 py-2 rounded-xl bg-sand-200 text-forest-950 text-xs font-bold">Share a project</Link>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}

      {loading ? (
        <div className="py-16 text-center text-sand-300/70">Loading community posts…</div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-200/20 p-12 text-center">
          <h2 className="text-lg font-bold text-sand-100">The feed is waiting for its first projects</h2>
          <p className="text-sm text-sand-300/70 mt-2">Be the first to share something you have built.</p>
          <Link to="/submit" className="inline-flex mt-5 px-4 py-2 rounded-xl bg-sand-200 text-forest-950 text-sm font-semibold">Submit your project</Link>
        </div>
      ) : posts.map(post => {
        const postComments = comments[post.id] || [];
        const isOpen = openComments.includes(post.id);
        const author = post.creator;
        return (
          <article key={post.id} className="rounded-2xl border border-sand-200/15 bg-forest-900/45 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Link to={author?.username ? `/creators/${author.username}` : '/creators'} className="flex items-center gap-3 min-w-0">
                  <img src={author?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.creator_id}`} alt="" className="w-10 h-10 rounded-full border border-sand-200/20" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sand-100 truncate">{author?.display_name || 'Community creator'}</p>
                    <p className="text-[11px] text-sand-300/60">@{author?.username || 'creator'} · {new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </Link>
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 border border-emerald-400/25 rounded-full px-2 py-1">Published</span>
              </div>

              <div className="flex gap-4">
                <img src={post.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-sand-200/20 shrink-0" />
                <div className="min-w-0">
                  <Link to={`/creations/${post.slug}`} className="text-lg font-bold text-sand-100 hover:text-electric-300">{post.name}</Link>
                  <p className="text-sm text-sand-300/80 mt-1">{post.tagline}</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-sand-200/85 whitespace-pre-line">{post.description}</p>
              <a href={post.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-electric-300 hover:text-electric-200">
                Visit project <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="px-5 sm:px-6 py-3 border-t border-sand-200/10 flex items-center gap-5">
              <button disabled={busy === post.id} onClick={() => void toggleLike(post)} className={`inline-flex items-center gap-2 text-xs font-semibold ${likedIds.includes(post.id) ? 'text-rose-300' : 'text-sand-300/75 hover:text-sand-100'} disabled:opacity-50`}>
                <Heart className={`w-4 h-4 ${likedIds.includes(post.id) ? 'fill-current' : ''}`} /> {post.appreciations_count} Appreciate
              </button>
              <button onClick={() => setOpenComments(current => current.includes(post.id) ? current.filter(id => id !== post.id) : [...current, post.id])} className="inline-flex items-center gap-2 text-xs font-semibold text-sand-300/75 hover:text-sand-100">
                <MessageCircle className="w-4 h-4" /> {postComments.length} Comments
              </button>
            </div>

            {isOpen && (
              <div className="px-5 sm:px-6 pb-5 space-y-4 border-t border-sand-200/10 pt-4">
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {postComments.length === 0 && <p className="text-xs text-sand-300/60">No comments yet. Start the conversation.</p>}
                  {postComments.map(comment => (
                    <div key={comment.id} className="flex gap-2.5">
                      <img src={comment.author?.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=comment'} alt="" className="w-7 h-7 rounded-full" />
                      <div className="min-w-0 rounded-xl bg-forest-950/70 px-3 py-2 flex-1">
                        <p className="text-[11px] font-semibold text-sand-100">{comment.author?.display_name || 'Community member'} <span className="font-normal text-sand-300/50">· {new Date(comment.created_at).toLocaleString()}</span></p>
                        <p className="text-xs text-sand-200/85 mt-1 whitespace-pre-wrap break-words">{comment.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input maxLength={1000} value={drafts[post.id] || ''} onChange={event => setDrafts(current => ({ ...current, [post.id]: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submitComment(post); } }} placeholder={user ? 'Write a comment…' : 'Sign in to comment'} className="min-w-0 flex-1 rounded-xl bg-forest-950 border border-sand-200/15 px-3 py-2 text-xs text-sand-100 placeholder:text-sand-300/40 focus:outline-none focus:border-electric-500" />
                  <button disabled={!user || busy === post.id || !(drafts[post.id] || '').trim()} onClick={() => void submitComment(post)} className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-3 py-2 text-xs font-semibold text-sand-100 disabled:opacity-40"><Send className="w-3.5 h-3.5" /> Post</button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </main>
  );
};
