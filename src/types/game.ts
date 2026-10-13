export interface Question {
  id: string;
  question: string;
  category: 'Iklan' | 'Slogan' | 'Poster' | 'Umum';
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface GameSettings {
  secondsPerQuestion: number; // default 20
  pointsPerCorrect: number; // default 100
  penaltyWrong: number; // default 30
  maxLives: number; // default 3
  soundEnabled: boolean;
  bgOpacity: number; // 0 to 1 (0 = solid dark, 0.4 = camera visible)
  aimSensitivity: number; // 1 to 2
}

export type GameMode = 'single' | 'duel'; // 1 Pemain vs 2 Pemain

export interface PlayerStats {
  score: number;
  lives: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  highestStreak: number;
}

export interface HandTrackingState {
  x: number; // normalized or screen coords
  y: number;
  rawX: number;
  rawY: number;
  isIndexPointing: boolean;
  isCocked: boolean;
  thumbValue: number; // metric for thumb height/extension
  justShot: boolean;
  lastShotTime: number;
  handSide: 'Left' | 'Right' | 'Unknown';
}

export interface TargetBounds {
  key: 'A' | 'B' | 'C' | 'D';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  isHit?: boolean;
  isCorrect?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'rect' | 'star';
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}
