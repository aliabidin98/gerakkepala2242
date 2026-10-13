import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats, Question } from '../types/game';
import { Trophy, RotateCcw, Home, Award, CheckCircle2, XCircle, BookOpen, Flame } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  isVictory: boolean;
  mode: 'single' | 'duel';
  player1Stats: PlayerStats;
  player2Stats?: PlayerStats;
  questions: Question[];
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isVictory,
  mode,
  player1Stats,
  player2Stats,
  questions,
  onRestart,
  onGoHome,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (isVictory) {
        sound.playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [isOpen, isVictory]);

  if (!isOpen) return null;

  const totalAnsweredP1 = player1Stats.correctCount + player1Stats.wrongCount;
  const accuracyP1 = totalAnsweredP1 > 0 ? Math.round((player1Stats.correctCount / totalAnsweredP1) * 100) : 0;

  let duelWinner: 'P1' | 'P2' | 'SERI' = 'SERI';
  if (mode === 'duel' && player2Stats) {
    if (player1Stats.score > player2Stats.score) duelWinner = 'P1';
    else if (player2Stats.score > player1Stats.score) duelWinner = 'P2';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-white overflow-hidden">
        
        {/* Banner top */}
        <div className={`p-6 text-center border-b ${
          isVictory 
            ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/30' 
            : 'bg-gradient-to-b from-rose-500/20 via-slate-900 to-slate-900 border-rose-500/30'
        }`}>
          <div className="inline-flex p-4 rounded-3xl bg-slate-800/80 border border-slate-700 mb-3 shadow-xl">
            <Trophy className={`w-12 h-12 ${isVictory ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold font-['Rajdhani',sans-serif] tracking-wider uppercase">
            {mode === 'duel'
              ? duelWinner === 'P1' ? '🏆 PEMAIN 1 JUARA DUEL!' : duelWinner === 'P2' ? '🏆 PEMAIN 2 JUARA DUEL!' : '🤝 HASIL DUEL IMBANG / SERI!'
              : isVictory ? 'MISI SELESAI: PENEMBAK JITU!' : 'GAME OVER: TETAP SEMANGAT!'}
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-lg mx-auto">
            {isVictory 
              ? 'Luar biasa! Pemahaman Anda tentang materi Teks Iklan, Slogan, dan Poster sangat tajam!'
              : 'Nyawa atau waktu habis, namun ini langkah awal yang baik. Pelajari rangkuman di bawah dan coba lagi!'}
          </p>
        </div>

        {/* Stats Section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Single Player Stats Cards */}
          {mode === 'single' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl text-center">
                <span className="text-xs text-slate-400 font-semibold block mb-1">TOTAL SKOR</span>
                <span className="text-3xl font-extrabold text-amber-400 font-['Rajdhani',sans-serif]">
                  {player1Stats.score}
                </span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl text-center">
                <span className="text-xs text-slate-400 font-semibold block mb-1">AKURASI</span>
                <span className="text-3xl font-extrabold text-cyan-400 font-['Rajdhani',sans-serif]">
                  {accuracyP1}%
                </span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl text-center">
                <span className="text-xs text-slate-400 font-semibold block mb-1">BENAR / SALAH</span>
                <span className="text-xl font-bold font-['Rajdhani',sans-serif] text-emerald-400">
                  {player1Stats.correctCount} <span className="text-slate-500">/</span> <span className="text-rose-400">{player1Stats.wrongCount}</span>
                </span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl text-center">
                <span className="text-xs text-slate-400 font-semibold block mb-1">STREAK TERTINGGI</span>
                <span className="text-3xl font-extrabold text-orange-400 font-['Rajdhani',sans-serif] flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 fill-current" /> {player1Stats.highestStreak}
                </span>
              </div>
            </div>
          ) : (
            /* 2-Player Duel Comparison */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Player 1 */}
              <div className="bg-cyan-950/30 border border-cyan-500/40 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                  <span className="font-extrabold text-cyan-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                    PEMAIN 1 (KIRI)
                  </span>
                  <span className="text-2xl font-black text-cyan-300 font-['Rajdhani',sans-serif]">
                    {player1Stats.score} Poin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-xl">Benar: <strong className="text-emerald-400">{player1Stats.correctCount}</strong></div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">Salah: <strong className="text-rose-400">{player1Stats.wrongCount}</strong></div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">Combo: <strong className="text-orange-400">{player1Stats.highestStreak}x</strong></div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">Sisa Nyawa: <strong className="text-rose-400">{player1Stats.lives} ❤️</strong></div>
                </div>
              </div>

              {/* Player 2 */}
              <div className="bg-rose-950/30 border border-rose-500/40 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                  <span className="font-extrabold text-rose-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                    PEMAIN 2 (KANAN)
                  </span>
                  <span className="text-2xl font-black text-rose-300 font-['Rajdhani',sans-serif]">
                    {player2Stats?.score || 0} Poin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-xl">Benar: <strong className="text-emerald-400">{player2Stats?.correctCount || 0}</strong></div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">Salah: <strong className="text-rose-400">{player2Stats?.wrongCount || 0}</strong></div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">Combo: <strong className="text-orange-400">{player2Stats?.highestStreak || 0}x</strong></div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">Sisa Nyawa: <strong className="text-rose-400">{player2Stats?.lives || 0} ❤️</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* Materi Ringkasan Bahasa Indonesia Kelas 8 */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <BookOpen className="w-4 h-4" />
              RANGKUMAN MATERI KELAS 8: TEKS IKLAN, SLOGAN & POSTER
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <strong className="text-amber-300 block mb-1">1. Teks Iklan:</strong>
                Memadukan unsur kata, gambar, suara, dan gerak. Bertujuan membujuk masyarakat agar membeli produk/jasa atau mengikuti imbauan.
              </div>
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <strong className="text-emerald-300 block mb-1">2. Slogan:</strong>
                Mengutamakan kepadatan makna kata-kata atau motto singkat yang mudah diingat, berima, dan menggugah tekad/kesadaran publik.
              </div>
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <strong className="text-cyan-300 block mb-1">3. Poster:</strong>
                Mengutamakan kekuatan visual gambar/ilustrasi mencolok yang dipadukan dengan kata-kata singkat pada plakat/kertas di tempat umum.
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onGoHome}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Menu Utama
          </button>
          
          <button
            onClick={onRestart}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            Main Lagi!
          </button>
        </div>

      </div>
    </div>
  );
};
