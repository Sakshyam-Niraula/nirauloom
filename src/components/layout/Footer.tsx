import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { Globe, Heart, Shield, Sparkles, Mail } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { isGeminiConfigured } from '../../lib/gemini';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-sand-200/10 bg-forest-950 text-sand-300/80 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-sand-200/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="horizontal" theme="dark" size="md" />
            <p className="text-sm text-sand-300/70 max-w-sm leading-relaxed">
              Discover the Internet, One Creation at a Time. NIRAULOOM is a modern digital creation discovery platform
              uniting web experiences, independent software, and creative tools from makers worldwide.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-sand-300/60">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-900 border border-sand-200/15">
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>Supabase DB: {isSupabaseConfigured ? 'Connected' : 'Local Preview'}</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-900 border border-sand-200/15">
                <Sparkles className={`w-3 h-3 ${isGeminiConfigured ? 'text-electric-400' : 'text-sand-400'}`} />
                <span>Gemini AI: {isGeminiConfigured ? 'Active' : 'Heuristic Mode'}</span>
              </span>
            </div>
          </div>

          {/* Discovery Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sand-100 font-sans">Discovery</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/explore" className="hover:text-sand-100 transition-colors">All Creations</Link></li>
              <li><Link to="/explore?sort=trending" className="hover:text-sand-100 transition-colors">Trending Launcher</Link></li>
              <li><Link to="/explore?filter=student" className="hover:text-sand-100 transition-colors">Student & Indie Makers</Link></li>
              <li><Link to="/categories" className="hover:text-sand-100 transition-colors">Categories Index</Link></li>
              <li><Link to="/ai-discover" className="hover:text-electric-400 font-medium transition-colors">AI Natural Search</Link></li>
            </ul>
          </div>

          {/* Curations Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sand-100 font-sans">Ecosystem</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/collections" className="hover:text-sand-100 transition-colors">Curated Collections</Link></li>
              <li><Link to="/creators" className="hover:text-sand-100 transition-colors">Verified Creators</Link></li>
              <li><Link to="/submit" className="hover:text-sand-100 transition-colors">Submit Your Creation</Link></li>
              <li><Link to="/dashboard" className="hover:text-sand-100 transition-colors">Creator Studio</Link></li>
              <li><Link to="/moderation" className="hover:text-sand-100 transition-colors">Moderation Guidelines</Link></li>
            </ul>
          </div>

          {/* Platform Standards and Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sand-100 font-sans">Integrity & Safe Discovery</h4>
            <p className="text-xs text-sand-300/60 leading-relaxed">
              Creations undergo peer and moderator verification. External websites are sandboxed and opened safely with security headers.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-sand-300/50">
              <Shield className="w-3.5 h-3.5 text-sand-200" />
              <span>Row Level Security Enforced</span>
            </div>
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sand-100 font-sans">Contact</h4>
              <a
                href="mailto:hello.nirauloom@gmail.com"
                className="inline-flex items-center gap-2 text-xs text-sand-300/70 hover:text-sand-100 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                hello.nirauloom@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sand-300/50">
          <p>© {new Date().getFullYear()} NIRAULOOM. All rights reserved. Crafted with precision for the open web.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-sand-200" /> Global Directory
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-rose-400 fill-rose-400 inline" /> for creators
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
