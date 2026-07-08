import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundView() {
  return (
    <div className="h-dvh w-full flex items-center justify-center bg-zinc-950 font-sans p-6 relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/10 rounded-full filter blur-3xl animate-blob pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C1121F]/10 rounded-full filter blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
      
      <div className="glass-panel p-10 rounded-3xl max-w-lg w-full text-center border border-zinc-800/50 shadow-2xl relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 flex items-center justify-center rounded-full mb-8 relative">
          <img src="https://crimsoncupbangladesh.com/cdn/shop/files/brand-logo.webp" alt="Crimson Cup Logo" className="w-16 h-16 object-contain opacity-60 grayscale" />
        </div>
        
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 mb-4 tracking-tighter">
          404
        </h1>
        <h2 className="text-xl font-bold text-white mb-3">Page Not Found</h2>
        
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-sm">
          It looks like the page you are looking for has been moved, deleted, or possibly never existed.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-2.5 bg-glass-item hover:bg-glass-panel-hover text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 border border-glass-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link 
            to="/"
            className="w-full sm:w-auto px-6 py-2.5 bg-glass-accent hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-glass-accent/20"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
