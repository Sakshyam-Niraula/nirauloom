import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  Sparkles, 
  User, 
  Bookmark, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  FolderPlus,
  LayoutGrid,
  Mail
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signOut, switchDemoUser, isLiveSupabase } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Community', path: '/community' },
    { label: 'Categories', path: '/categories' },
    { label: 'Collections', path: '/collections' },
    { label: 'Creators', path: '/creators' },
    { label: 'AI Discover', path: '/ai-discover', icon: Sparkles, highlight: true },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sand-200/10 bg-forest-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <Logo variant="horizontal" theme="dark" size="md" />

          {/* Desktop Navigation Links */}
          <nav className="hidden 2xl:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                    active
                      ? 'bg-forest-800/80 text-sand-100 shadow-sm border border-sand-200/20'
                      : link.highlight
                      ? 'text-electric-400 hover:text-electric-300 hover:bg-electric-500/10'
                      : 'text-sand-300/80 hover:text-sand-100 hover:bg-forest-900/60'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-electric-400 animate-pulse" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center / Right: Quick Search + Submit + Profile */}
        <div className="hidden md:flex items-center gap-2">
          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:block relative w-40 2xl:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/50" />
            <input
              type="text"
              placeholder="Search creations, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-forest-900/60 border border-sand-200/15 rounded-full text-xs text-sand-100 placeholder-sand-300/50 focus:outline-none focus:ring-1 focus:ring-electric-500 focus:border-electric-500 transition-all"
            />
          </form>

          {/* Submit Creation Button */}
          <Link
            to="/submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-800 hover:bg-forest-700 text-sand-100 text-xs font-semibold border border-sand-200/30 transition-all hover:border-sand-200/60 hover:shadow-glow-forest"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sand-200" />
            <span>Submit Creation</span>
          </Link>

          {/* Auth / User Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full border border-sand-200/20 bg-forest-900/70 hover:border-sand-200/40 transition-all"
                title={user.display_name}
              >
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
                  alt={user.display_name}
                  className="w-7 h-7 rounded-full object-cover border border-sand-200/30"
                />
                <span className="text-xs font-medium text-sand-100 pr-2 max-w-[100px] truncate hidden xl:inline">
                  {user.display_name}
                </span>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-forest-900 border border-sand-200/20 shadow-glass py-2 z-50 text-sand-100 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-sand-200/10">
                    <p className="text-sm font-semibold truncate text-sand-100">{user.display_name}</p>
                    <p className="text-xs text-sand-300/70">@{user.username}</p>
                    {user.is_admin && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-electric-500/20 text-electric-400 border border-electric-500/30">
                        Admin Moderator
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-sand-200 hover:bg-forest-800 hover:text-sand-100"
                    >
                      <LayoutGrid className="w-4 h-4 text-sand-300" />
                      Creator Dashboard
                    </Link>
                    <Link
                      to={`/creators/${user.username}`}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-sand-200 hover:bg-forest-800 hover:text-sand-100"
                    >
                      <User className="w-4 h-4 text-sand-300" />
                      Public Profile
                    </Link>
                    <Link
                      to="/dashboard?tab=bookmarks"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-sand-200 hover:bg-forest-800 hover:text-sand-100"
                    >
                      <Bookmark className="w-4 h-4 text-sand-300" />
                      My Bookmarks
                    </Link>
                    <Link
                      to="/dashboard?tab=collections"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-sand-200 hover:bg-forest-800 hover:text-sand-100"
                    >
                      <FolderPlus className="w-4 h-4 text-sand-300" />
                      My Collections
                    </Link>

                    {user.is_admin && (
                      <>
                        <Link
                          to="/moderation"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-electric-400 font-semibold hover:bg-forest-800"
                        >
                          <ShieldCheck className="w-4 h-4 text-electric-400" />
                          Admin Moderation Panel
                        </Link>
                        <Link
                          to="/outreach-agent"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-electric-300 font-semibold hover:bg-forest-800"
                        >
                          <Mail className="w-4 h-4" /> Autonomous Outreach Agent
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Persona Switcher for demonstration testing */}
                  <div className="border-t border-sand-200/10 px-4 py-2">
                    <p className="text-[10px] uppercase font-semibold text-sand-300/50 mb-1">Switch Test Persona</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => switchDemoUser('creator-1')}
                        className={`text-[10px] px-2 py-0.5 rounded border ${user.id === 'creator-1' ? 'bg-forest-700 text-white border-sand-200/40' : 'text-sand-300/70 border-sand-200/10'}`}
                      >
                        Elena (Admin)
                      </button>
                      <button
                        onClick={() => switchDemoUser('creator-2')}
                        className={`text-[10px] px-2 py-0.5 rounded border ${user.id === 'creator-2' ? 'bg-forest-700 text-white border-sand-200/40' : 'text-sand-300/70 border-sand-200/10'}`}
                      >
                        Tariq (Dev)
                      </button>
                      <button
                        onClick={() => switchDemoUser('creator-4')}
                        className={`text-[10px] px-2 py-0.5 rounded border ${user.id === 'creator-4' ? 'bg-forest-700 text-white border-sand-200/40' : 'text-sand-300/70 border-sand-200/10'}`}
                      >
                        Devon (Student)
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-sand-200/10 pt-1">
                    <button
                      onClick={() => {
                        signOut();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-forest-800 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-1.5 rounded-full bg-sand-200/10 hover:bg-sand-200/20 text-sand-100 text-xs font-medium border border-sand-200/20 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex 2xl:hidden items-center gap-2">
          <Link
            to="/submit"
            className="hidden md:inline-flex p-2 rounded-lg bg-forest-800 text-sand-100 border border-sand-200/20"
          >
            <PlusCircle className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-sand-200 hover:bg-forest-900 border border-sand-200/10"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="2xl:hidden border-t border-sand-200/10 bg-forest-950 px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-300/50" />
            <input
              type="text"
              placeholder="Search creations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-forest-900 border border-sand-200/20 rounded-lg text-sm text-sand-100"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium text-center ${
                  isActive(link.path)
                    ? 'bg-forest-800 text-sand-100 border border-sand-200/20'
                    : 'text-sand-300 hover:bg-forest-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-sand-200/10 pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-1">
                  <img
                    src={user.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
                    alt={user.display_name}
                    className="w-9 h-9 rounded-full border border-sand-200/30"
                  />
                  <div>
                    <p className="text-sm font-medium text-sand-100">{user.display_name}</p>
                    <p className="text-xs text-sand-300/60">@{user.username}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-xs bg-forest-900 rounded-lg text-center text-sand-200"
                  >
                    Dashboard
                  </Link>
                  {user.is_admin && (
                    <Link
                      to="/moderation"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 text-xs bg-electric-500/20 text-electric-300 rounded-lg text-center"
                    >
                      Admin Moderation
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-sm font-medium bg-sand-200 text-forest-950 rounded-lg"
              >
                Sign In to NIRAULOOM
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
