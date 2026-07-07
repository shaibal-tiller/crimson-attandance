import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh w-full flex items-center justify-center bg-zinc-950 font-sans p-6 relative overflow-hidden">
          {/* Blobs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/10 rounded-full filter blur-3xl animate-blob pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C1121F]/10 rounded-full filter blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
          
          <div className="glass-panel p-8 rounded-3xl max-w-lg w-full text-center border border-red-500/20 shadow-[0_0_50px_-12px_rgba(239,68,68,0.15)] relative overflow-hidden z-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />
            <div className="mx-auto w-16 h-16 bg-red-500/10 flex items-center justify-center rounded-2xl mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">System Error</h1>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              We encountered an unexpected error while rendering this view. Our team has been notified.
            </p>
            <div className="bg-black/30 rounded-xl p-4 mb-8 border border-zinc-800/50 text-left overflow-x-auto">
              <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown Error'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-6 py-2.5 bg-glass-item hover:bg-glass-panel-hover text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 border border-glass-border"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full sm:w-auto px-6 py-2.5 bg-glass-accent hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-glass-accent/20"
              >
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
