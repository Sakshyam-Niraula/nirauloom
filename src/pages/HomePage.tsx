import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Compass, Layers3, Search,
  Sparkles, WandSparkles, Globe2, CircleDot, MoveUpRight
} from 'lucide-react';
import { WovenNIcon } from '../components/brand/Logo';
import { CreationCard } from '../components/creations/CreationCard';
import { usePlatform } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';
import { trackConversion } from '../lib/analytics';

export const HomePage: React.FC = () => {
  const { creations, categories, loading } = usePlatform();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => { trackConversion('homepage_view'); }, []);

  const published = useMemo(
    () => creations.filter((creation) => creation.status === 'approved'),
    [creations]
  );
  const recent = useMemo(
    () => [...published].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4),
    [published]
  );
  const appreciated = useMemo(
    () => [...published].sort((a, b) => b.appreciations_count - a.appreciations_count).slice(0, 4),
    [published]
  );
  const creatorCount = new Set(published.map((item) => item.creator_id).filter(Boolean)).size;

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    else navigate('/explore');
  };
  const publishPath = user ? '/submit' : '/auth?mode=signup';
  const signupClick = () => { if (!user) trackConversion('signup_cta_click'); };

  return (
    <div className="loom-home">
      <section className="loom-hero">
        <div className="loom-hero-grid" aria-hidden="true" />
        <div className="loom-orbit loom-orbit-one" aria-hidden="true" />
        <div className="loom-orbit loom-orbit-two" aria-hidden="true" />
        <div className="loom-hero-inner">
          <div className="loom-kicker"><span className="loom-kicker-mark"><WovenNIcon size={22} theme="light" /></span><span>THE INDEPENDENT INTERNET, IN ONE PLACE</span><span className="loom-kicker-dot" /></div>
          <div className="loom-hero-copy">
            <p className="loom-eyebrow">A living directory of things made with intention</p>
            <h1>Good ideas<br /><em>find their people.</em></h1>
            <p className="loom-lede">A discovery space for independent creations — thoughtful tools, curious experiments, open-source work, and the people behind them.</p>
            <form className="loom-search" onSubmit={search}>
              <Search size={19} aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you curious about?" aria-label="Search creations" />
              <button type="submit" aria-label="Search"><span>Explore</span><ArrowUpRight size={17} /></button>
            </form>
            <div className="loom-search-hint"><span>START SOMEWHERE</span>{['AI & machine learning', 'Student-built', 'Open source'].map((item) => <button key={item} onClick={() => navigate(`/explore?q=${encodeURIComponent(item)}`)}>{item}</button>)}</div>
            <div className="loom-hero-actions">
              <Link to={publishPath} onClick={signupClick} className="loom-button loom-button-primary">{user ? 'Publish a creation' : 'Put your work out there'}<ArrowUpRight size={17} /></Link>
              <Link to="/creators" className="loom-button loom-button-quiet">Meet the makers<ArrowRight size={16} /></Link>
            </div>
            <div className="loom-pathway">
              <div className="loom-pathway-heading">A SMALL MAP FOR BIG CURIOSITY</div>
              <div className="loom-pathway-step"><span>01</span><b>Discover</b><small>Find fresh ideas</small></div>
              <div className="loom-pathway-step"><span>02</span><b>Connect</b><small>Meet the makers</small></div>
              <div className="loom-pathway-step"><span>03</span><b>Share</b><small>Show what you build</small></div>
            </div>
          </div>
          <div className="loom-hero-art" aria-label="Abstract woven discovery motif">
            <div className="loom-art-caption"><span>FIG. 01</span><span>THE DISCOVERY FIELD</span></div>
            <div className="loom-art-stage">
              <div className="loom-thread loom-thread-a" />
              <div className="loom-thread loom-thread-b" />
              <div className="loom-thread loom-thread-c" />
              <div className="loom-thread loom-thread-d" />
              <div className="loom-art-core"><WovenNIcon size={76} theme="light" /></div>
              <div className="loom-art-node loom-node-a"><Sparkles size={17} /></div>
              <div className="loom-art-node loom-node-b"><Layers3 size={17} /></div>
              <div className="loom-art-node loom-node-c"><Globe2 size={17} /></div>
              <span className="loom-art-label loom-label-a">MAKE</span>
              <span className="loom-art-label loom-label-b">DISCOVER</span>
              <span className="loom-art-label loom-label-c">CONNECT</span>
            </div>
            <div className="loom-art-foot"><span>INDEPENDENT BY NATURE</span><span>CONNECTED BY CURIOSITY ↗</span></div>
          </div>
        </div>
        <div className="loom-hero-bottom"><span>SCROLL TO EXPLORE</span><ArrowDownRight size={16} /><span className="loom-hero-bottom-line" /></div>
      </section>

      <section className="loom-proof-strip" aria-label="NIRAULOOM directory information">
        <div><span className="loom-proof-value">{published.length.toString().padStart(2, '0')}</span><span className="loom-proof-label">PUBLISHED CREATIONS</span></div>
        <div><span className="loom-proof-value">{creatorCount.toString().padStart(2, '0')}</span><span className="loom-proof-label">CREATORS REPRESENTED</span></div>
        <div><span className="loom-proof-value">{categories.length.toString().padStart(2, '0')}</span><span className="loom-proof-label">WAYS TO EXPLORE</span></div>
        <div className="loom-proof-note"><CircleDot size={13} /> Real work. Real makers. No made-up numbers.</div>
      </section>

      <section className="loom-section loom-section-discover">
        <div className="loom-section-heading">
          <div><p className="loom-eyebrow">01 / Find your next rabbit hole</p><h2>Explore the <em>unexpected.</em></h2></div>
          <Link to="/categories" className="loom-text-link">All categories <MoveUpRight size={16} /></Link>
        </div>
        <div className="loom-category-grid">
          {categories.slice(0, 8).map((category, index) => {
            const count = published.filter((creation) => creation.category_id === category.id).length;
            return <Link to={`/explore?category=${category.id}`} key={category.id} className={`loom-category-tile loom-category-${index % 4}`}>
              <span className="loom-category-index">0{index + 1}</span><span className="loom-category-glyph">{['✳', '⌘', '◈', '⌁'][index % 4]}</span>
              <span className="loom-category-name">{category.name}</span><span className="loom-category-count">{count} {count === 1 ? 'creation' : 'creations'}</span><ArrowUpRight className="loom-category-arrow" size={17} />
            </Link>;
          })}
        </div>
      </section>

      <section className="loom-section loom-section-work">
        <div className="loom-section-heading">
          <div><p className="loom-eyebrow">02 / Out in the world</p><h2>Made by <em>real people.</em></h2><p className="loom-section-subtitle">A growing collection of independent work, shared by the people who made it.</p></div>
          <Link to="/explore" className="loom-text-link">Explore everything <MoveUpRight size={16} /></Link>
        </div>
        {loading ? <div className="loom-loading-grid">{[1, 2, 3, 4].map((n) => <div className="loom-skeleton" key={n}><div /><span /><span /></div>)}</div>
          : recent.length ? <div className="loom-project-grid">{recent.map((creation) => <CreationCard key={creation.id} creation={creation} />)}</div>
          : <div className="loom-empty"><WovenNIcon size={44} theme="light" /><div><h3>The first threads are waiting.</h3><p>Be among the makers who shape what this place becomes.</p></div><Link to={publishPath} onClick={signupClick} className="loom-button loom-button-primary">Share your first creation<ArrowUpRight size={16} /></Link></div>}
      </section>

      {appreciated.length > 1 && (
        <section className="loom-section loom-section-appreciated">
          <div className="loom-section-heading"><div><p className="loom-eyebrow">03 / Community signals</p><h2>Worth a <em>closer look.</em></h2></div><Link to="/explore?sort=popular" className="loom-text-link">See what's appreciated <MoveUpRight size={16} /></Link></div>
          <div className="loom-project-grid">{appreciated.map((creation) => <CreationCard key={creation.id} creation={creation} />)}</div>
        </section>
      )}

      <section className="loom-maker-section">
        <div className="loom-maker-pattern" aria-hidden="true" />
        <div className="loom-maker-copy"><p className="loom-eyebrow">FOR THE PEOPLE WHO MAKE THINGS</p><h2>Your work deserves<br /><em>to travel further.</em></h2><p>Give your project a place to live beyond a launch post. Build your creator profile, share what you made, and let curious people find their way to it.</p><div className="loom-maker-actions"><Link to={publishPath} onClick={signupClick} className="loom-button loom-button-light">{user ? 'Publish your creation' : 'Create your free profile'}<ArrowUpRight size={17} /></Link><Link to="/community" className="loom-maker-secondary">Discover the community <ArrowRight size={16} /></Link></div></div>
        <div className="loom-maker-side"><div className="loom-maker-symbol"><WovenNIcon size={94} theme="light" /></div><span>BUILT INDEPENDENTLY.<br />FOUND TOGETHER.</span><span className="loom-maker-number">N° 001 — ONGOING</span></div>
      </section>

      <footer className="loom-last-note"><span>AN OPEN INVITATION TO CURIOSITY</span><Link to="/explore">Wander a little <ArrowUpRight size={16} /></Link></footer>
    </div>
  );
};
