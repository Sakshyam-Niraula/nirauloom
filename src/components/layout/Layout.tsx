import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-forest-950 text-sand-100 selection:bg-electric-500 selection:text-white relative overflow-x-hidden">
      {/* Subtle Ambient Background Gradient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-forest-800/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-electric-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-forest-800/15 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        {children}
      </main>

      <Footer />
    </div>
  );
};
