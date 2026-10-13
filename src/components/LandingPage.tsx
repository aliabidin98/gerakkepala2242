import React from 'react';
import { GameMode } from '../types/game';
import { 
  Crosshair, 
  User, 
  Users, 
  Settings, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldCheck, 
  Maximize2,
  KeyRound
} from 'lucide-react';

interface LandingPageProps {
  onStartGame: (mode: GameMode) => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hasCamera: boolean;
  tier: 'full' | 'demo';
  onOpenActivation?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartGame,
  onOpenSettings,
  onOpenGuide,
  soundEnabled,
  onToggleSound,
  hasCamera,
  tier,
  onOpenActivation,
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 md:p-8 bg-slate-950 text-white overflow-hidden selection:bg-cyan-500 selection:text-white">
      
      {/* Dynamic Background Neon Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Crosshair className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">MEDIA PEMBELAJARAN INTERAKTIF</span>
            <h1 className="text-xl md:text-2xl font-black font-['Rajdhani',sans-serif] tracking-wide text-white">
              TEMBAK TANGAN <span className="text-cyan-400"></span>
            </h1>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors hidden sm:flex"
            title="Layar Penuh"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Hero & Menu */}
      <main className="relative z-10 max-w-5xl w-full mx-auto my-auto py-8 flex flex-col items-center text-center">
        
        {/* Topic & Mode Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            Game AR Interaktif
          </div>
          {tier === 'demo' && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black shadow">
              <span>MODE DEMO (GRATIS)</span>
            </div>
          )}
        </div>

        {/* Game Title */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-['Rajdhani',sans-serif] tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 drop-shadow-md">
          TEMBAK TANGAN
        </h2>
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mt-3 font-medium">
          Tembak papan sasaran jawaban yang tepat menggunakan gestur pistol tangan di depan kamera webcam Anda!
        </p>

        {/* Key mechanics badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Telunjuk = Bidik Halus (Lerp)
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Jempol Terangkat = Ready (Kokang)
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Jempol Turun = DOR! (Tembak Instan)
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Tanpa Cubitan (No Pinch)
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className={`grid gap-4 w-full mt-8 ${tier === 'demo' ? 'max-w-md mx-auto grid-cols-1' : 'max-w-2xl grid-cols-1 sm:grid-cols-2'}`}>
          
          {/* 1 Player Mode (Always Available) */}
          <button
            onClick={() => onStartGame('single')}
            className="group relative p-6 rounded-3xl bg-gradient-to-br from-cyan-900/40 via-slate-900 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 shadow-xl hover:shadow-cyan-500/20 text-left transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 group-hover:scale-110 transition-transform">
                <User className="w-7 h-7" />
              </div>
              <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MODE TUNGGAL
              </span>
            </div>
            <h3 className="text-2xl font-black font-['Rajdhani',sans-serif] tracking-wide text-white group-hover:text-cyan-300 transition-colors">
              1 PEMAIN (SOLO)
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Asah kemampuan Anda menembak sasaran jawaban benar untuk meraih skor tertinggi!
            </p>
          </button>

          {/* 2 Players Duel Mode (Only in Full Mode, hidden in Demo Mode) */}
          {tier === 'full' && (
            <button
              onClick={() => onStartGame('duel')}
              className="group relative p-6 rounded-3xl bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-900 border border-purple-500/40 hover:border-purple-400 shadow-xl hover:shadow-purple-500/20 text-left transition-all transform hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  DUEL SPLIT SCREEN
                </span>
              </div>
              <h3 className="text-2xl font-black font-['Rajdhani',sans-serif] tracking-wide text-white group-hover:text-purple-300 transition-colors">
                2 PEMAIN (DUEL)
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Tantang teman dalam 1 kamera! Layar dibagi dua (P1 Biru vs P2 Merah) rebutan tembak jawaban benar!
              </p>
            </button>
          )}

        </div>

        {/* Secondary Navigation buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 w-full max-w-2xl">
          <button
            onClick={onOpenGuide}
            className="flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            Panduan Gestur
          </button>

          {/* Bank Soal & Pengaturan (Only in Full Mode, hidden in Demo Mode) */}
          {tier === 'full' && (
            <button
              onClick={onOpenSettings}
              className="flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              Bank Soal & Pengaturan
            </button>
          )}

         

          {/* Upgrade button in Demo mode */}
          {tier === 'demo' && onOpenActivation && (
            <button
              onClick={onOpenActivation}
              className="flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-slate-900 border border-amber-400/50 hover:border-amber-400 text-amber-300 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              Aktivasi Versi Penuh
            </button>
          )}
        </div>

      </main>

      {/* Footer Info */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-900 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>MediaPipe Hands Powered • Akselerasi 60 FPS </span>
        </div>
        <div>
          Dibuat oleh M. Nur Ali Abidin, S.Pd.
        </div>
      </footer>

    </div>
  );
};
