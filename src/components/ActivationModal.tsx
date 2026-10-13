import React, { useState } from 'react';
import { Lock, KeyRound, AlertTriangle, ShieldCheck, Sparkles, X } from 'lucide-react';
import { sound } from '../utils/audio';

export type ActivationTier = 'full' | 'demo';

interface ActivationModalProps {
  isOpen: boolean;
  onSuccess: (tier: ActivationTier) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const CODE_FULL = 'TBKTG';
export const CODE_DEMO = 'GRATIS';

export const ActivationModal: React.FC<ActivationModalProps> = ({ 
  isOpen, 
  onSuccess,
  onClose,
  canClose = false 
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === CODE_FULL) {
      sound.playCorrect();
      setError(null);
      localStorage.setItem('target_bahasa_activated', 'true');
      localStorage.setItem('target_bahasa_activation_tier', 'full');
      onSuccess('full');
    } else if (cleanCode === CODE_DEMO) {
      sound.playCorrect();
      setError(null);
      localStorage.setItem('target_bahasa_activated', 'true');
      localStorage.setItem('target_bahasa_activation_tier', 'demo');
      onSuccess('demo');
    } else {
      sound.playWrong();
      setError('Kode aktivasi salah! Masukkan kode resmi atau ketik GRATIS untuk Mode Demo.');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div
        className={`relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 text-white text-center transition-transform ${
          isShake ? 'translate-x-[-10px] animate-pulse' : ''
        }`}
      >
        {/* Close button if canClose */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-sm"></div>

        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/20">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title */}
        <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
          KODE AKTIVASI
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-['Rajdhani',sans-serif] tracking-wide mt-1 text-white">
          VERIFIKASI AKSES
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Masukkan kode aktivasi untuk membuka akses permainan.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="Masukan kode aktivasi"
              className="w-full px-4 py-3.5 pl-11 rounded-2xl bg-slate-950/80 border-2 border-slate-700 focus:border-cyan-400 text-center text-lg sm:text-xl font-black tracking-widest uppercase text-cyan-300 placeholder:text-slate-600 focus:outline-none transition-all shadow-inner font-mono"
            />
            <KeyRound className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            Aktifkan Sekarang
          </button>
        </form>

        {/* Quick Demo Button */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setCode(CODE_DEMO);
              sound.playCorrect();
              localStorage.setItem('target_bahasa_activated', 'true');
              localStorage.setItem('target_bahasa_activation_tier', 'demo');
              onSuccess('demo');
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center justify-center gap-1 mx-auto py-1 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Atau klik di sini untuk langsung coba Mode Demo Gratis
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
          Dibuat oleh <span className="text-slate-300 font-semibold">M. Nur Ali Abidin, S.Pd.</span>
        </div>
      </div>
    </div>
  );
};
