import React from 'react';
import { Target, CheckCircle2, AlertTriangle, Crosshair, Sparkles, Volume2, ShieldAlert, ArrowRight, Play } from 'lucide-react';
import { sound } from '../utils/audio';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose, onStartGame }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 p-6 md:p-8 text-white">
        
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-sm"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Crosshair className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">PANDUAN KONTROL PISTOL TANGAN</span>
              <h2 className="text-2xl md:text-3xl font-extrabold font-['Rajdhani',sans-serif] tracking-wide text-white">
                CARA MEMBIDIK & MENEMBAK
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6">

          {/* 3 Steps Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Step 1: Aiming */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-sm flex items-center justify-center border border-cyan-500/40">1</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300">Arah Bidik</span>
                </div>
                
                {/* Visual gesture representation */}
                <div className="my-4 h-32 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <div className="text-5xl select-none transform -rotate-12 group-hover:scale-110 transition-transform">
                      👉
                    </div>
                    <div className="mt-2 text-xs font-mono text-cyan-400">Telunjuk = Crosshair</div>
                  </div>
                  <div className="absolute top-2 right-2 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
                </div>

                <h3 className="font-bold text-lg text-white mb-1">Jari Telunjuk = Pointer Murni</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Luruskan jari telunjuk mengarah ke layar kamera. Kursor <span className="text-cyan-300 font-semibold">crosshair</span> akan bergerak mulus mengikuti ujung telunjuk Anda berkat stabilisasi Lerp anti-getar.
                </p>
              </div>
            </div>

            {/* Step 2: Cocking / Ready */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-sm flex items-center justify-center border border-emerald-500/40">2</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">Kokang Pistol</span>
                </div>

                {/* Visual gesture representation */}
                <div className="my-4 h-32 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <div className="text-5xl select-none transform rotate-12 group-hover:scale-110 transition-transform">
                      👍
                    </div>
                    <div className="mt-2 text-xs font-mono text-emerald-400 font-bold">STATUS: READY (HIJAU)</div>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono border border-emerald-500/30">
                    KOKANG
                  </div>
                </div>

                <h3 className="font-bold text-lg text-white mb-1">Angkat Ibu Jari (Siap Kokang)</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Angkat atau tegakkan ibu jari ke atas seperti pistol mainan. Indikator di layar akan berubah hijau bertuliskan <span className="text-emerald-300 font-semibold font-mono">READY</span> pertanda senjata siap ditembakkan!
                </p>
              </div>
            </div>

            {/* Step 3: Shooting */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between hover:border-rose-500/50 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-300 font-bold text-sm flex items-center justify-center border border-rose-500/40">3</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300">Tembak! (DOR)</span>
                </div>

                {/* Visual gesture representation */}
                <div className="my-4 h-32 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <div className="text-5xl select-none transform -rotate-6 group-hover:scale-110 transition-transform">
                      🔫
                    </div>
                    <div className="mt-2 text-xs font-mono text-rose-400 font-bold">DOR! (TEMBAK)</div>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] rounded font-mono border border-rose-500/30">
                    BANG!
                  </div>
                </div>

                <h3 className="font-bold text-lg text-white mb-1">Turunkan Ibu Jari (DOR!)</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Cukup <span className="text-rose-400 font-semibold">turunkan/tekuk ibu jari ke bawah</span> seketika. Tembakan akan meletus instan! Untuk menembak lagi, angkat ibu jari kembali (reload).
                </p>
              </div>
            </div>

          </div>

          {/* Critical rules box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mt-0.5 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-sm space-y-1">
              <h4 className="font-bold text-amber-300">PENTING & DILARANG:</h4>
              <ul className="text-slate-300 list-disc list-inside space-y-0.5 text-xs md:text-sm">
                <li><strong className="text-white">TIDAK PERLU mencubit:</strong> Jangan menempelkan ujung jempol ke telunjuk (tanpa pinch).</li>
                <li><strong className="text-white">TIDAK MENGGUNAKAN Hover:</strong> Tembakan murni dipicu gerakan ibu jari, bukan menahan jari di atas target.</li>
                <li><strong className="text-white">Dukungan Cadangan:</strong> Anda juga dapat mengklik mouse atau mengetuk layar untuk menembak jika kamera sedang tidak aktif.</li>
              </ul>
            </div>
          </div>

          {/* Test Sound Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                sound.playGunshot();
                sound.playHitExplosion();
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Tes Efek Suara Letusan (Audio)
            </button>
            <div className="text-xs text-slate-400">
              Pastikan pencahayaan ruangan cukup agar jari terbaca jelas oleh webcam.
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Tutup Panduan
          </button>
          {onStartGame && (
            <button
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-current" />
              Mulai Bermain Sekarang!
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
