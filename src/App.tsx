/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameMode, Question, GameSettings, PlayerStats } from './types/game';
import { DEFAULT_QUESTIONS } from './utils/defaultQuestions';
import { sound } from './utils/audio';
import { LandingPage } from './components/LandingPage';
import { PlayArena } from './components/PlayArena';
import { GestureGuideModal } from './components/GestureGuideModal';
import { QuestionManagerModal } from './components/QuestionManagerModal';
import { GameOverModal } from './components/GameOverModal';
import { ActivationModal, ActivationTier } from './components/ActivationModal';

const DEFAULT_SETTINGS: GameSettings = {
  secondsPerQuestion: 20,
  pointsPerCorrect: 100,
  penaltyWrong: 30,
  maxLives: 3,
  soundEnabled: true,
  bgOpacity: 0.95,
  aimSensitivity: 1.35,
};

export default function App() {
  const [view, setView] = useState<'landing' | 'playing'>('landing');
  const [mode, setMode] = useState<GameMode>('single');
  
  // Activation state (Masukan Kode Aktivasi)
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('target_bahasa_activated') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [activationTier, setActivationTier] = useState<ActivationTier>(() => {
    try {
      const tier = localStorage.getItem('target_bahasa_activation_tier');
      if (tier === 'demo' || tier === 'full') return tier;
    } catch (e) {}
    return 'full';
  });

  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  // Stored questions & settings
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('target_bahasa_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_QUESTIONS;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('target_bahasa_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure webcam is clear if previously saved with dark opacity
        if (parsed.bgOpacity !== undefined && parsed.bgOpacity < 0.7) {
          parsed.bgOpacity = 0.95;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);

  // Result stats
  const [isVictory, setIsVictory] = useState(false);
  const [p1Stats, setP1Stats] = useState<PlayerStats>({
    score: 0,
    lives: settings.maxLives,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    highestStreak: 0,
  });
  const [p2Stats, setP2Stats] = useState<PlayerStats | undefined>(undefined);

  // Synchronize sound enabled state with sound engine
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Persist questions changes
  const handleUpdateQuestions = (qs: Question[]) => {
    setQuestions(qs);
    try {
      localStorage.setItem('target_bahasa_questions', JSON.stringify(qs));
    } catch (e) {}
  };

  // Persist settings changes
  const handleUpdateSettings = (s: GameSettings) => {
    setSettings(s);
    try {
      localStorage.setItem('target_bahasa_settings', JSON.stringify(s));
    } catch (e) {}
  };

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    handleUpdateSettings({ ...settings, soundEnabled: nextVal });
  };

  // When player clicks start from landing page, show Gesture Guide modal first to confirm mechanics!
  const handleInitiateGame = (selectedMode: GameMode) => {
    // In demo mode, only single player is permitted
    if (activationTier === 'demo' && selectedMode !== 'single') {
      return;
    }
    setMode(selectedMode);
    setPendingMode(selectedMode);
    // User requested: "WAJIB sertakan modal/pop-up panduan di awal game sebelum mulai."
    setIsGuideOpen(true);
  };

  const handleActivationSuccess = (tier: ActivationTier) => {
    setIsActivated(true);
    setActivationTier(tier);
    setIsActivationModalOpen(false);
  };

  const handleStartGameAfterGuide = () => {
    setIsGuideOpen(false);
    setIsGameOverOpen(false);
    setView('playing');
  };

  const handleFinishGame = (victory: boolean, finalP1: PlayerStats, finalP2?: PlayerStats) => {
    setIsVictory(victory);
    setP1Stats(finalP1);
    setP2Stats(finalP2);
    setIsGameOverOpen(true);
  };

  const handleRestart = () => {
    setIsGameOverOpen(false);
    setView('playing');
  };

  const handleGoHome = () => {
    setIsGameOverOpen(false);
    setView('landing');
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. Landing Page View */}
      {view === 'landing' && (
        <LandingPage
          onStartGame={handleInitiateGame}
          onOpenSettings={() => {
            if (activationTier === 'full') {
              setIsSettingsOpen(true);
            }
          }}
          onOpenGuide={() => setIsGuideOpen(true)}
          soundEnabled={settings.soundEnabled}
          onToggleSound={handleToggleSound}
          hasCamera={true}
          tier={activationTier}
          onOpenActivation={() => setIsActivationModalOpen(true)}
        />
      )}

      {/* 2. Fullscreen Play Arena View */}
      {view === 'playing' && (
        <PlayArena
          mode={mode}
          questions={questions}
          settings={settings}
          onFinishGame={handleFinishGame}
          onExitToMenu={handleGoHome}
        />
      )}

      {/* 0. Activation Modal (Masukan Kode Aktivasi) */}
      <ActivationModal
        isOpen={!isActivated || isActivationModalOpen}
        canClose={isActivated}
        onClose={() => setIsActivationModalOpen(false)}
        onSuccess={handleActivationSuccess}
      />

      {/* 3. Mandatory Gesture Guide Modal */}
      <GestureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onStartGame={handleStartGameAfterGuide}
      />

      {/* 4. Question & Settings Management Modal */}
      <QuestionManagerModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        questions={questions}
        onUpdateQuestions={handleUpdateQuestions}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* 5. Game Over / Victory Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isVictory={isVictory}
        mode={mode}
        player1Stats={p1Stats}
        player2Stats={p2Stats}
        questions={questions}
        onRestart={handleRestart}
        onGoHome={handleGoHome}
      />

    </div>
  );
}
