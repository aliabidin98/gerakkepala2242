import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-rose-950/50">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-['Rajdhani',sans-serif] text-rose-400 tracking-wide">
              TERJADI KESALAHAN TAMPILAN
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Aplikasi mengalami kendala saat memuat antarmuka. Anda dapat me-refresh halaman atau mereset data penyimpanan.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs font-mono text-rose-300/80 max-h-32 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Reset Data & Mulai Lagi
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
