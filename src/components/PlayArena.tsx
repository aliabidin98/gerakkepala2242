import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Question, GameSettings, GameMode, PlayerStats, Particle, FloatingText } from '../types/game';
import { createHandTracker, processHandLandmarks, PlayerHandTracker } from '../utils/gestureDetector';
import { sound } from '../utils/audio';
import { Heart, Clock, Flame, Crosshair, ArrowLeft, Sparkles, Swords } from 'lucide-react';

interface PlayArenaProps {
  mode: GameMode;
  questions: Question[];
  settings: GameSettings;
  onFinishGame: (isVictory: boolean, p1Stats: PlayerStats, p2Stats?: PlayerStats) => void;
  onExitToMenu: () => void;
}

function shuffleQuestions(list: Question[]): Question[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const PlayArena: React.FC<PlayArenaProps> = ({
  mode,
  questions,
  settings,
  onFinishGame,
  onExitToMenu,
}) => {
  // Independent random question pools for 2-player split screen
  const p1Questions = useMemo(() => (mode === 'duel' ? shuffleQuestions(questions) : questions), [questions, mode]);
  const p2Questions = useMemo(() => (mode === 'duel' ? shuffleQuestions(questions) : questions), [questions, mode]);

  // Question indices
  const [p1QIndex, setP1QIndex] = useState(0);
  const [p2QIndex, setP2QIndex] = useState(0);

  // Timers
  const [p1TimeLeft, setP1TimeLeft] = useState(settings.secondsPerQuestion);
  const [p2TimeLeft, setP2TimeLeft] = useState(settings.secondsPerQuestion);

  // Status flags
  const [screenShake, setScreenShake] = useState(false);
  const [handsDetectedCount, setHandsDetectedCount] = useState(0);

  // Player Stats
  const [p1Stats, setP1Stats] = useState<PlayerStats>({
    score: 0,
    lives: settings.maxLives,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    highestStreak: 0,
  });

  const [p2Stats, setP2Stats] = useState<PlayerStats>({
    score: 0,
    lives: settings.maxLives,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    highestStreak: 0,
  });

  // Crosshairs stored in refs (decoupled from React render loop to achieve 60+ FPS zero-lag)
  const p1CrosshairRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.25 : 200,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 300,
    isCocked: true,
    isPointing: true,
    flash: false,
    visible: true,
  });

  const p2CrosshairRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.75 : 600,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 300,
    isCocked: true,
    isPointing: true,
    flash: false,
    visible: mode === 'duel',
  });

  // Refs for tracking & canvas animation
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arenaContainerRef = useRef<HTMLDivElement>(null);

  const trackerP1Ref = useRef<PlayerHandTracker>(createHandTracker('Left'));
  const trackerP2Ref = useRef<PlayerHandTracker>(createHandTracker('Right'));

  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  
  // Hit test bounds
  const p1TargetBoundsRef = useRef<Map<'A' | 'B' | 'C' | 'D', DOMRect>>(new Map());
  const p2TargetBoundsRef = useRef<Map<'A' | 'B' | 'C' | 'D', DOMRect>>(new Map());
  const targetHitAnimationRef = useRef<Map<string, { time: number; type: 'correct' | 'wrong' }>>(new Map());

  // Current active questions
  const p1CurrentQ = p1Questions[p1QIndex] || p1Questions[0];
  const p2CurrentQ = p2Questions[p2QIndex] || p2Questions[0];

  // Screen shake
  const triggerShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
  }, []);

  // Spawn visual particle explosions
  const spawnExplosion = useCallback((x: number, y: number, isCorrect: boolean, isP2: boolean = false) => {
    const count = isCorrect ? 30 : 16;
    const colors = isCorrect
      ? isP2
        ? ['#f43f5e', '#fb7185', '#fda4af', '#f59e0b', '#ffffff']
        : ['#10b981', '#34d399', '#38bdf8', '#06b6d4', '#ffffff']
      : ['#ef4444', '#f87171', '#fca5a5', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 3,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.02,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
      });
    }
  }, []);

  // Spawn floating score text
  const spawnFloatingText = useCallback((text: string, x: number, y: number, color: string) => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -2.5,
    });
  }, []);

  // Update target bounding boxes for precise hit tests
  const updateTargetRects = useCallback(() => {
    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    keys.forEach(k => {
      const elP1 = document.getElementById(`p1-target-${k}`);
      if (elP1) p1TargetBoundsRef.current.set(k, elP1.getBoundingClientRect());
      if (mode === 'duel') {
        const elP2 = document.getElementById(`p2-target-${k}`);
        if (elP2) p2TargetBoundsRef.current.set(k, elP2.getBoundingClientRect());
      }
    });
  }, [mode]);

  useEffect(() => {
    updateTargetRects();
    window.addEventListener('resize', updateTargetRects);
    return () => window.removeEventListener('resize', updateTargetRects);
  }, [p1QIndex, p2QIndex, updateTargetRects]);

  // Check end conditions
  const checkEndGame = useCallback((currentP1: PlayerStats, currentP2: PlayerStats, nextP1Idx: number, nextP2Idx: number) => {
    if (mode === 'single') {
      if (currentP1.lives <= 0) {
        onFinishGame(false, currentP1);
      } else if (nextP1Idx >= p1Questions.length) {
        onFinishGame(true, currentP1);
      }
    } else {
      const p1Done = currentP1.lives <= 0 || nextP1Idx >= p1Questions.length;
      const p2Done = currentP2.lives <= 0 || nextP2Idx >= p2Questions.length;

      if (p1Done && p2Done) {
        onFinishGame(currentP1.score >= currentP2.score, currentP1, currentP2);
      } else if (currentP1.lives <= 0 && currentP2.lives <= 0) {
        onFinishGame(currentP1.score >= currentP2.score, currentP1, currentP2);
      }
    }
  }, [mode, p1Questions.length, p2Questions.length, onFinishGame]);

  // Handle Shot by Player 1
  const handleShootP1 = useCallback((x: number, y: number) => {
    sound.playGunshot();
    triggerShake();

    p1CrosshairRef.current.flash = true;
    setTimeout(() => { p1CrosshairRef.current.flash = false; }, 100);

    const HIT_MARGIN = 20; // Generous margin for smooth, satisfying hits
    let hitKey: 'A' | 'B' | 'C' | 'D' | null = null;
    p1TargetBoundsRef.current.forEach((rect, key) => {
      if (
        x >= rect.left - HIT_MARGIN &&
        x <= rect.right + HIT_MARGIN &&
        y >= rect.top - HIT_MARGIN &&
        y <= rect.bottom + HIT_MARGIN
      ) {
        hitKey = key;
      }
    });

    if (hitKey) {
      sound.playHitExplosion();
      const isCorrect = hitKey === p1CurrentQ.correctAnswer;
      spawnExplosion(x, y, isCorrect, false);
      targetHitAnimationRef.current.set(`p1-${hitKey}`, { time: performance.now(), type: isCorrect ? 'correct' : 'wrong' });

      setP1Stats(prev => {
        const nextStreak = isCorrect ? prev.streak + 1 : 0;
        const streakBonus = isCorrect && nextStreak > 1 ? (nextStreak - 1) * 20 : 0;
        const delta = isCorrect ? settings.pointsPerCorrect + streakBonus : -settings.penaltyWrong;
        const newScore = Math.max(0, prev.score + delta);
        const newLives = isCorrect ? prev.lives : prev.lives - 1;
        const updated: PlayerStats = {
          score: newScore,
          lives: newLives,
          correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
          wrongCount: isCorrect ? prev.wrongCount : prev.wrongCount + 1,
          streak: nextStreak,
          highestStreak: Math.max(prev.highestStreak, nextStreak),
        };

        if (isCorrect) {
          sound.playCorrect();
          spawnFloatingText(`+${settings.pointsPerCorrect}${streakBonus ? ` (+${streakBonus})` : ''}`, x, y - 20, '#34d399');
          setTimeout(() => {
            const nextIdx = p1QIndex + 1;
            setP1QIndex(nextIdx);
            setP1TimeLeft(settings.secondsPerQuestion);
            checkEndGame(updated, p2Stats, nextIdx, p2QIndex);
          }, 350);
        } else {
          sound.playWrong();
          spawnFloatingText(`-${settings.penaltyWrong} SALAH!`, x, y - 20, '#f87171');
          checkEndGame(updated, p2Stats, p1QIndex, p2QIndex);
        }
        return updated;
      });
    } else {
      spawnExplosion(x, y, false);
      spawnFloatingText('Meleset!', x, y - 10, '#94a3b8');
    }
  }, [p1CurrentQ, p1QIndex, p2QIndex, p2Stats, settings, checkEndGame, spawnExplosion, spawnFloatingText, triggerShake]);

  // Handle Shot by Player 2 (Duel)
  const handleShootP2 = useCallback((x: number, y: number) => {
    sound.playGunshot();
    triggerShake();

    p2CrosshairRef.current.flash = true;
    setTimeout(() => { p2CrosshairRef.current.flash = false; }, 100);

    const HIT_MARGIN = 20; // Generous margin for smooth, satisfying hits
    let hitKey: 'A' | 'B' | 'C' | 'D' | null = null;
    p2TargetBoundsRef.current.forEach((rect, key) => {
      if (
        x >= rect.left - HIT_MARGIN &&
        x <= rect.right + HIT_MARGIN &&
        y >= rect.top - HIT_MARGIN &&
        y <= rect.bottom + HIT_MARGIN
      ) {
        hitKey = key;
      }
    });

    if (hitKey) {
      sound.playHitExplosion();
      const isCorrect = hitKey === p2CurrentQ.correctAnswer;
      spawnExplosion(x, y, isCorrect, true);
      targetHitAnimationRef.current.set(`p2-${hitKey}`, { time: performance.now(), type: isCorrect ? 'correct' : 'wrong' });

      setP2Stats(prev => {
        const nextStreak = isCorrect ? prev.streak + 1 : 0;
        const streakBonus = isCorrect && nextStreak > 1 ? (nextStreak - 1) * 20 : 0;
        const delta = isCorrect ? settings.pointsPerCorrect + streakBonus : -settings.penaltyWrong;
        const newScore = Math.max(0, prev.score + delta);
        const newLives = isCorrect ? prev.lives : prev.lives - 1;
        const updated: PlayerStats = {
          score: newScore,
          lives: newLives,
          correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
          wrongCount: isCorrect ? prev.wrongCount : prev.wrongCount + 1,
          streak: nextStreak,
          highestStreak: Math.max(prev.highestStreak, nextStreak),
        };

        if (isCorrect) {
          sound.playCorrect();
          spawnFloatingText(`+${settings.pointsPerCorrect}${streakBonus ? ` (+${streakBonus})` : ''}`, x, y - 20, '#f43f5e');
          setTimeout(() => {
            const nextIdx = p2QIndex + 1;
            setP2QIndex(nextIdx);
            setP2TimeLeft(settings.secondsPerQuestion);
            checkEndGame(p1Stats, updated, p1QIndex, nextIdx);
          }, 350);
        } else {
          sound.playWrong();
          spawnFloatingText(`-${settings.penaltyWrong} SALAH!`, x, y - 20, '#f87171');
          checkEndGame(p1Stats, updated, p1QIndex, p2QIndex);
        }
        return updated;
      });
    } else {
      spawnExplosion(x, y, false, true);
      spawnFloatingText('Meleset!', x, y - 10, '#94a3b8');
    }
  }, [p2CurrentQ, p1QIndex, p2QIndex, p1Stats, settings, checkEndGame, spawnExplosion, spawnFloatingText, triggerShake]);

  // Timers countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setP1TimeLeft(prev => {
        if (prev <= 1) {
          sound.playWrong();
          setP1Stats(curr => {
            const updated = { ...curr, lives: curr.lives - 1, wrongCount: curr.wrongCount + 1, streak: 0 };
            const nextIdx = p1QIndex + 1;
            setP1QIndex(nextIdx);
            checkEndGame(updated, p2Stats, nextIdx, p2QIndex);
            return updated;
          });
          return settings.secondsPerQuestion;
        }
        return prev - 1;
      });

      if (mode === 'duel') {
        setP2TimeLeft(prev => {
          if (prev <= 1) {
            sound.playWrong();
            setP2Stats(curr => {
              const updated = { ...curr, lives: curr.lives - 1, wrongCount: curr.wrongCount + 1, streak: 0 };
              const nextIdx = p2QIndex + 1;
              setP2QIndex(nextIdx);
              checkEndGame(p1Stats, updated, p1QIndex, nextIdx);
              return updated;
            });
            return settings.secondsPerQuestion;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, p1QIndex, p2QIndex, p1Stats, p2Stats, settings.secondsPerQuestion, checkEndGame]);

  // High-Performance MediaPipe Hands (Lite model complexity 0 + 640x480 for 60+ FPS zero-lag)
  useEffect(() => {
    let cameraInstance: any = null;
    let handsInstance: any = null;
    let isCancelled = false;
    let isProcessing = false;

    const setupMediaPipe = async () => {
      const win = window as any;
      if (!win.Hands || !win.Camera || !videoRef.current) {
        setTimeout(() => { if (!isCancelled) setupMediaPipe(); }, 400);
        return;
      }

      try {
        handsInstance = new win.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        // modelComplexity: 0 uses the fast Lite model which executes 3x faster with zero input lag!
        handsInstance.setOptions({
          maxNumHands: mode === 'duel' ? 2 : 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handsInstance.onResults((results: any) => {
          if (isCancelled || !arenaContainerRef.current) return;
          const container = arenaContainerRef.current.getBoundingClientRect();
          const w = container.width;
          const h = container.height;

          const numHands = results.multiHandLandmarks?.length || 0;
          setHandsDetectedCount(numHands);

          if (numHands > 0) {
            const landmarksList = results.multiHandLandmarks;

            if (mode === 'single') {
              const p1Result = processHandLandmarks(
                landmarksList[0],
                trackerP1Ref.current,
                w,
                h,
                settings.aimSensitivity,
                640,
                480
              );

              p1CrosshairRef.current.x = p1Result.state.x;
              p1CrosshairRef.current.y = p1Result.state.y;
              p1CrosshairRef.current.isCocked = p1Result.state.isCocked;
              p1CrosshairRef.current.isPointing = p1Result.state.isIndexPointing;
              p1CrosshairRef.current.visible = true;

              if (p1Result.didCock) sound.playCock();
              if (p1Result.didShoot) handleShootP1(p1Result.state.x, p1Result.state.y);

            } else {
              // Duel Mode: Split-screen mapping with full reach across each half
              landmarksList.forEach((landmarks: any) => {
                const rawMirroredX = 1.0 - landmarks[8].x; // 0 (left) to 1 (right)

                if (rawMirroredX < 0.5) {
                  // Player 1: Left half screen
                  // Map sub-range [0.06, 0.44] to left screen half [25, w/2 - 25]
                  const normSubX = Math.max(0, Math.min(1, (rawMirroredX - 0.06) / 0.38));
                  const normSubY = Math.max(0, Math.min(1, (landmarks[8].y - 0.12) / 0.72));

                  const targetPxX = normSubX * (w / 2 - 50) + 25;
                  const targetPxY = normSubY * (h - 90) + 45;

                  const tracker = trackerP1Ref.current;
                  if (!tracker.hasTracked) {
                    tracker.smoothedX = targetPxX;
                    tracker.smoothedY = targetPxY;
                    tracker.hasTracked = true;
                  } else {
                    const dx = targetPxX - tracker.smoothedX;
                    const dy = targetPxY - tracker.smoothedY;
                    const dist = Math.hypot(dx, dy);
                    const lerp = Math.min(0.92, Math.max(0.48, dist / 110));
                    tracker.smoothedX += dx * lerp;
                    tracker.smoothedY += dy * lerp;
                  }

                  // Scale-invariant thumb trigger
                  const wrist = landmarks[0];
                  const indexMcp = landmarks[5];
                  const thumbMcp = landmarks[2];
                  const thumbIp = landmarks[3];
                  const thumbTip = landmarks[4];
                  const middleMcp = landmarks[9];

                  const handScale = Math.hypot(indexMcp.x - wrist.x, indexMcp.y - wrist.y) || 0.15;
                  const thumbLift = (thumbMcp.y - thumbTip.y) / handScale;
                  const thumbExt = Math.hypot(thumbTip.x - middleMcp.x, thumbTip.y - middleMcp.y) / handScale;
                  const now = performance.now();

                  if (!tracker.isCocked) {
                    if (thumbLift > 0.16 || thumbExt > 0.65) {
                      tracker.isCocked = true;
                      sound.playCock();
                    }
                  } else {
                    const thumbDropped = thumbLift < 0.05 || thumbTip.y >= thumbIp.y;
                    const rapidDrop = tracker.lastThumbLift - thumbLift > 0.12;
                    if ((thumbDropped || rapidDrop) && now - tracker.lastShotTime > 180) {
                      tracker.isCocked = false;
                      tracker.lastShotTime = now;
                      handleShootP1(tracker.smoothedX, tracker.smoothedY);
                    }
                  }
                  tracker.lastThumbLift = thumbLift;

                  p1CrosshairRef.current.x = tracker.smoothedX;
                  p1CrosshairRef.current.y = tracker.smoothedY;
                  p1CrosshairRef.current.isCocked = tracker.isCocked;
                  p1CrosshairRef.current.visible = true;

                } else {
                  // Player 2: Right half screen
                  // Map sub-range [0.56, 0.94] to right screen half [w/2 + 25, w - 25]
                  const normSubX = Math.max(0, Math.min(1, (rawMirroredX - 0.56) / 0.38));
                  const normSubY = Math.max(0, Math.min(1, (landmarks[8].y - 0.12) / 0.72));

                  const targetPxX = w / 2 + normSubX * (w / 2 - 50) + 25;
                  const targetPxY = normSubY * (h - 90) + 45;

                  const tracker = trackerP2Ref.current;
                  if (!tracker.hasTracked) {
                    tracker.smoothedX = targetPxX;
                    tracker.smoothedY = targetPxY;
                    tracker.hasTracked = true;
                  } else {
                    const dx = targetPxX - tracker.smoothedX;
                    const dy = targetPxY - tracker.smoothedY;
                    const dist = Math.hypot(dx, dy);
                    const lerp = Math.min(0.92, Math.max(0.48, dist / 110));
                    tracker.smoothedX += dx * lerp;
                    tracker.smoothedY += dy * lerp;
                  }

                  const wrist = landmarks[0];
                  const indexMcp = landmarks[5];
                  const thumbMcp = landmarks[2];
                  const thumbIp = landmarks[3];
                  const thumbTip = landmarks[4];
                  const middleMcp = landmarks[9];

                  const handScale = Math.hypot(indexMcp.x - wrist.x, indexMcp.y - wrist.y) || 0.15;
                  const thumbLift = (thumbMcp.y - thumbTip.y) / handScale;
                  const thumbExt = Math.hypot(thumbTip.x - middleMcp.x, thumbTip.y - middleMcp.y) / handScale;
                  const now = performance.now();

                  if (!tracker.isCocked) {
                    if (thumbLift > 0.16 || thumbExt > 0.65) {
                      tracker.isCocked = true;
                      sound.playCock();
                    }
                  } else {
                    const thumbDropped = thumbLift < 0.05 || thumbTip.y >= thumbIp.y;
                    const rapidDrop = tracker.lastThumbLift - thumbLift > 0.12;
                    if ((thumbDropped || rapidDrop) && now - tracker.lastShotTime > 180) {
                      tracker.isCocked = false;
                      tracker.lastShotTime = now;
                      handleShootP2(tracker.smoothedX, tracker.smoothedY);
                    }
                  }
                  tracker.lastThumbLift = thumbLift;

                  p2CrosshairRef.current.x = tracker.smoothedX;
                  p2CrosshairRef.current.y = tracker.smoothedY;
                  p2CrosshairRef.current.isCocked = tracker.isCocked;
                  p2CrosshairRef.current.visible = true;
                }
              });
            }
          }
        });

        // Run detection inference at 640x480 resolution for lightning-fast real-time inference
        cameraInstance = new win.Camera(videoRef.current, {
          onFrame: async () => {
            if (isCancelled || !videoRef.current || !handsInstance || isProcessing) return;
            isProcessing = true;
            try {
              await handsInstance.send({ image: videoRef.current });
            } catch (err) {
            } finally {
              isProcessing = false;
            }
          },
          width: 640,
          height: 480,
        });

        await cameraInstance.start();
      } catch (err) {
        console.warn('Camera initiation:', err);
      }
    };

    setupMediaPipe();

    return () => {
      isCancelled = true;
      if (cameraInstance?.stop) {
        try { cameraInstance.stop(); } catch (e) {}
      }
      if (handsInstance?.close) {
        try { handsInstance.close(); } catch (e) {}
      }
    };
  }, [mode, settings.aimSensitivity, handleShootP1, handleShootP2]);

  // Mouse & Click Fallback
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!arenaContainerRef.current) return;
    const rect = arenaContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (handsDetectedCount === 0) {
      if (mode === 'single' || x < rect.width / 2) {
        p1CrosshairRef.current.x = x;
        p1CrosshairRef.current.y = y;
        p1CrosshairRef.current.visible = true;
      } else {
        p2CrosshairRef.current.x = x;
        p2CrosshairRef.current.y = y;
        p2CrosshairRef.current.visible = true;
      }
    }
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    if (!arenaContainerRef.current) return;
    const rect = arenaContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'single' || x < rect.width / 2) {
      handleShootP1(x, y);
    } else {
      handleShootP2(x, y);
    }
  };

  // Space / Enter keyboard shoot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleShootP1(p1CrosshairRef.current.x, p1CrosshairRef.current.y);
      } else if (e.code === 'Enter' && mode === 'duel') {
        e.preventDefault();
        handleShootP2(p2CrosshairRef.current.x, p2CrosshairRef.current.y);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, handleShootP1, handleShootP2]);

  // Native Canvas 60 FPS Render Loop (Crosshairs + Particles + Explosions + Floating Points)
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas && arenaContainerRef.current) {
        const ctx = canvas.getContext('2d');
        const rect = arenaContainerRef.current.getBoundingClientRect();

        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Render Particles
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.25;
            p.alpha -= p.decay;
            if (p.rotation !== undefined && p.vRot) p.rotation += p.vRot;

            if (p.alpha <= 0) {
              particlesRef.current.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);

            if (p.shape === 'rect') {
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // 2. Render Floating Text
          for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
            const ft = floatingTextsRef.current[i];
            ft.y += ft.vy;
            ft.alpha -= 0.02;

            if (ft.alpha <= 0) {
              floatingTextsRef.current.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 22px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 6;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          }

          // 3. Draw Player 1 Crosshair directly on canvas (Zero DOM Lag)
          const p1 = p1CrosshairRef.current;
          if (p1.visible) {
            ctx.save();
            const ringColor = p1.flash ? '#ffffff' : p1.isCocked ? '#10b981' : '#06b6d4';
            const radius = p1.flash ? 32 : 24;

            // Outer ring
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
            ctx.lineWidth = p1.flash ? 4 : 2.5;
            ctx.strokeStyle = ringColor;
            ctx.shadowColor = ringColor;
            ctx.shadowBlur = 10;
            ctx.stroke();

            // Center laser dot
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = ringColor;
            ctx.fill();

            // Crosshairs lines
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y - radius - 5);
            ctx.lineTo(p1.x, p1.y - radius + 5);
            ctx.moveTo(p1.x, p1.y + radius - 5);
            ctx.lineTo(p1.x, p1.y + radius + 5);
            ctx.moveTo(p1.x - radius - 5, p1.y);
            ctx.lineTo(p1.x - radius + 5, p1.y);
            ctx.moveTo(p1.x + radius - 5, p1.y);
            ctx.lineTo(p1.x + radius + 5, p1.y);
            ctx.stroke();

            // Status Badge text
            const statusText = p1.isCocked ? 'READY' : 'KOKANG';
            ctx.font = 'bold 11px Rajdhani, monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = p1.isCocked ? '#10b981' : '#f59e0b';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(`${mode === 'duel' ? 'P1 ' : ''}${statusText}`, p1.x, p1.y + radius + 15);
            ctx.restore();
          }

          // 4. Draw Player 2 Crosshair in Duel mode
          if (mode === 'duel') {
            const p2 = p2CrosshairRef.current;
            if (p2.visible) {
              ctx.save();
              const ringColor = p2.flash ? '#ffffff' : p2.isCocked ? '#10b981' : '#f43f5e';
              const radius = p2.flash ? 32 : 24;

              ctx.beginPath();
              ctx.arc(p2.x, p2.y, radius, 0, Math.PI * 2);
              ctx.lineWidth = p2.flash ? 4 : 2.5;
              ctx.strokeStyle = ringColor;
              ctx.shadowColor = ringColor;
              ctx.shadowBlur = 10;
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2);
              ctx.fillStyle = ringColor;
              ctx.fill();

              ctx.beginPath();
              ctx.moveTo(p2.x, p2.y - radius - 5);
              ctx.lineTo(p2.x, p2.y - radius + 5);
              ctx.moveTo(p2.x, p2.y + radius - 5);
              ctx.lineTo(p2.x, p2.y + radius + 5);
              ctx.moveTo(p2.x - radius - 5, p2.y);
              ctx.lineTo(p2.x - radius + 5, p2.y);
              ctx.moveTo(p2.x + radius - 5, p2.y);
              ctx.lineTo(p2.x + radius + 5, p2.y);
              ctx.stroke();

              const statusText = p2.isCocked ? 'READY' : 'KOKANG';
              ctx.font = 'bold 11px Rajdhani, monospace';
              ctx.textAlign = 'center';
              ctx.fillStyle = p2.isCocked ? '#10b981' : '#f43f5e';
              ctx.shadowColor = '#000000';
              ctx.shadowBlur = 4;
              ctx.fillText(`P2 ${statusText}`, p2.x, p2.y + radius + 15);
              ctx.restore();
            }
          }
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [mode]);

  const p1TimerPercent = (p1TimeLeft / settings.secondsPerQuestion) * 100;
  const p2TimerPercent = (p2TimeLeft / settings.secondsPerQuestion) * 100;

  return (
    <div
      ref={arenaContainerRef}
      onMouseMove={handleMouseMove}
      onClick={handleMouseClick}
      className={`relative w-screen h-screen overflow-hidden bg-slate-950 select-none cursor-crosshair transition-transform ${
        screenShake ? 'scale-[1.012] translate-x-1 -translate-y-1' : ''
      }`}
    >
      {/* 1. Live Webcam Feed - 100% Bright, Crisp & Crystal-Clear */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none brightness-105"
        style={{ opacity: 1 }}
      />

      {/* 2. Particle & Effects Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" />

      {/* ========================================================= */}
      {/* MODE 1: SINGLE PLAYER ARENA                               */}
      {/* ========================================================= */}
      {mode === 'single' ? (
        <div className="relative z-20 p-4 md:p-6 max-w-7xl mx-auto flex flex-col justify-between h-full pb-12">
          
          {/* Top Bar HUD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onExitToMenu}
                className="px-3.5 py-2 rounded-2xl bg-slate-950/25 hover:bg-slate-900/40 backdrop-blur-xs border border-white/20 text-white flex items-center gap-2 text-xs font-bold transition-all shadow-md"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                Menu
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase px-3.5 py-1.5 rounded-full bg-cyan-500/25 backdrop-blur-xs text-cyan-200 border border-cyan-400/40 shadow">
                  SOAL {p1QIndex + 1} / {p1Questions.length}
                </span>
                <span className={`text-xs font-black uppercase px-3.5 py-1.5 rounded-full backdrop-blur-xs border shadow ${
                  p1CurrentQ.category === 'Iklan' ? 'bg-amber-500/25 text-amber-200 border-amber-400/50' :
                  p1CurrentQ.category === 'Slogan' ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50' :
                  p1CurrentQ.category === 'Poster' ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50' :
                  'bg-purple-500/25 text-purple-200 border-purple-400/50'
                }`}>
                  TOPIK: {p1CurrentQ.category}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full backdrop-blur-xs border shadow ${
                  handsDetectedCount > 0
                    ? 'bg-emerald-950/40 border-emerald-400/50 text-emerald-300'
                    : 'bg-slate-950/25 border-white/20 text-slate-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${handsDetectedCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="font-semibold hidden sm:inline">
                    {handsDetectedCount > 0 ? `${handsDetectedCount} Tangan Aktif` : 'Gunakan Tangan / Mouse'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/25 backdrop-blur-xs border border-white/20 p-3.5 rounded-2xl shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 drop-shadow">SKOR</span>
                  <span className="text-2xl font-black font-['Rajdhani',sans-serif] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {p1Stats.score}
                  </span>
                </div>

                {p1Stats.streak > 1 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-orange-300 bg-orange-950/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-orange-400/40 shadow animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    COMBO {p1Stats.streak}x
                  </div>
                )}

                <div className="flex items-center gap-1 ml-2">
                  {Array.from({ length: settings.maxLives }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] transition-transform ${
                        i < p1Stats.lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-600/70 scale-90'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 ${p1TimeLeft <= 5 ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
                <div className="flex flex-col items-end">
                  <span className={`text-xl font-black font-['Rajdhani',sans-serif] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${p1TimeLeft <= 5 ? 'text-rose-400' : 'text-cyan-300'}`}>
                    {p1TimeLeft}s
                  </span>
                  <div className="w-24 sm:w-32 h-2 bg-slate-900/60 backdrop-blur-xs border border-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        p1TimeLeft <= 5 ? 'bg-rose-500' : p1TimeLeft <= 10 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${p1TimerPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Question Banner */}
            <div className="bg-slate-950/25 backdrop-blur-xs border border-white/25 p-5 md:p-6 rounded-3xl shadow-md text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              <h2 className="text-lg md:text-2xl font-black text-white leading-snug tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {p1CurrentQ.question}
              </h2>
              <div className="text-[11px] text-cyan-200 mt-2 font-mono flex items-center justify-center gap-1 drop-shadow">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                Arahkan telunjuk ke sasaran lalu <strong className="text-white underline decoration-cyan-400 decoration-2">turunkan jempol ke bawah (DOR!)</strong> untuk menembak.
              </div>
            </div>
          </div>

          {/* 4 Targets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 my-auto">
            {p1CurrentQ.options.map((opt) => {
              const hitAnim = targetHitAnimationRef.current.get(`p1-${opt.key}`);
              const isRecentlyHit = hitAnim && performance.now() - hitAnim.time < 500;

              return (
                <div
                  key={opt.key}
                  id={`p1-target-${opt.key}`}
                  className={`group relative p-4 md:p-5 rounded-3xl backdrop-blur-xs border-2 transition-all transform duration-150 shadow-md overflow-hidden ${
                    isRecentlyHit
                      ? hitAnim.type === 'correct'
                        ? 'bg-emerald-950/60 border-emerald-400 scale-105 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                        : 'bg-rose-950/60 border-rose-500 scale-95 shadow-[0_0_30px_rgba(244,63,94,0.7)]'
                      : 'bg-slate-950/25 hover:bg-slate-900/40 border-white/20 hover:border-cyan-400'
                  }`}
                >
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black font-['Rajdhani',sans-serif] text-2xl shrink-0 border-2 backdrop-blur-xs shadow-md bg-cyan-500/25 border-cyan-400 text-cyan-200">
                      {opt.key}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-1 drop-shadow">
                        SASARAN {opt.key}
                      </span>
                      <p className="text-base md:text-lg font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                        {opt.text}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full border border-white/30 backdrop-blur-xs bg-white/5 flex items-center justify-center text-slate-200 group-hover:border-cyan-400 group-hover:text-cyan-300 transition-colors shrink-0">
                      <Crosshair className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* ========================================================= */
        /* MODE 2: TRUE SPLIT-SCREEN 2-PLAYER DUEL                  */
        /* Ultra-Bening Transparan Kaca & Latar Belakang Webcam Terang */
        /* ========================================================= */
        <div className="relative z-20 w-full h-full flex flex-col justify-between p-3 md:p-4 pb-10">
          
          {/* Universal Duel Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-white/20">
            <button
              onClick={onExitToMenu}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950/25 hover:bg-slate-900/40 backdrop-blur-xs border border-white/20 hover:border-cyan-400 text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              Keluar
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-slate-950/25 backdrop-blur-xs border border-white/20 text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-amber-400" />
                DUEL SPLIT-SCREEN 2 PEMAIN (SOAL ACAK)
              </span>
            </div>

            <div className="text-xs text-white backdrop-blur-xs bg-slate-950/25 border border-white/20 px-3 py-1 rounded-full">
              {handsDetectedCount > 0 ? `${handsDetectedCount} Tangan Terlacak` : 'Mouse Kiri (P1) / Kanan (P2)'}
            </div>
          </div>

          {/* SPLIT SCREEN MAIN CONTAINER */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 relative">
            
            {/* Center VS Divider Badge */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex-col items-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border-2 border-amber-400 text-amber-400 font-black font-['Rajdhani'] text-lg tracking-wider flex items-center justify-center shadow-[0_0_20px_#f59e0b] animate-pulse">
                VS
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* SISI KIRI: PEMAIN 1 (CYAN / BIRU NEON)                */}
            {/* Transparan Kaca Bening (Latar Webcam Tampak Jelas)    */}
            {/* ----------------------------------------------------- */}
            <div className="flex flex-col justify-between p-3.5 md:p-4 rounded-3xl bg-slate-950/15 backdrop-blur-xs border-2 border-cyan-400/50 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent"></div>

              {/* P1 Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                    <span className="font-black text-sm md:text-base text-cyan-300 font-['Rajdhani'] tracking-wide drop-shadow">
                      PEMAIN 1 (KIRI)
                    </span>
                    {p1Stats.streak > 1 && (
                      <span className="text-[10px] font-bold text-orange-300 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-400/40 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" /> {p1Stats.streak}x
                      </span>
                    )}
                  </div>

                  {/* P1 Score */}
                  <div className="text-xl md:text-2xl font-black font-['Rajdhani'] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {p1Stats.score} <span className="text-xs font-normal text-cyan-300">Poin</span>
                  </div>
                </div>

                {/* P1 Hearts & Timer */}
                <div className="flex items-center justify-between bg-slate-950/25 backdrop-blur-xs p-2 rounded-xl border border-white/15">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: settings.maxLives }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-4 h-4 drop-shadow ${i < p1Stats.lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600/70'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300 font-mono drop-shadow">Soal {p1QIndex + 1}/{p1Questions.length}</span>
                    <span className="text-xs font-black text-cyan-300 font-mono drop-shadow">{p1TimeLeft}s</span>
                    <div className="w-16 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${p1TimerPercent}%` }} />
                    </div>
                  </div>
                </div>

                {/* P1 Question Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950/25 backdrop-blur-xs border border-white/20 text-center shadow-sm">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 uppercase">
                    {p1CurrentQ.category}
                  </span>
                  <h3 className="text-sm md:text-base font-extrabold text-white mt-1.5 leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {p1CurrentQ.question}
                  </h3>
                </div>
              </div>

              {/* P1 Targets A, B, C, D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {p1CurrentQ.options.map((opt) => {
                  const hitAnim = targetHitAnimationRef.current.get(`p1-${opt.key}`);
                  const isRecentlyHit = hitAnim && performance.now() - hitAnim.time < 500;

                  return (
                    <div
                      key={opt.key}
                      id={`p1-target-${opt.key}`}
                      className={`group p-3 rounded-2xl backdrop-blur-xs border-2 transition-all transform duration-150 flex items-center gap-3 ${
                        isRecentlyHit
                          ? hitAnim.type === 'correct'
                            ? 'bg-emerald-950/70 border-emerald-400 scale-105 shadow-[0_0_25px_rgba(16,185,129,0.7)]'
                            : 'bg-rose-950/70 border-rose-500 scale-95 shadow-[0_0_25px_rgba(244,63,94,0.7)]'
                          : 'bg-slate-950/25 hover:bg-slate-900/40 border-white/20 hover:border-cyan-400'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black font-['Rajdhani'] text-lg shrink-0 bg-cyan-500/25 border border-cyan-400 text-cyan-200">
                        {opt.key}
                      </div>
                      <p className="text-xs md:text-sm font-bold text-white group-hover:text-cyan-200 leading-tight flex-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                        {opt.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* SISI KANAN: PEMAIN 2 (ROSE / MERAH CRIMSON)           */}
            {/* Transparan Kaca Bening (Latar Webcam Tampak Jelas)    */}
            {/* ----------------------------------------------------- */}
            <div className="flex flex-col justify-between p-3.5 md:p-4 rounded-3xl bg-slate-950/15 backdrop-blur-xs border-2 border-rose-400/50 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent to-rose-400"></div>

              {/* P2 Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
                    <span className="font-black text-sm md:text-base text-rose-300 font-['Rajdhani'] tracking-wide drop-shadow">
                      PEMAIN 2 (KANAN)
                    </span>
                    {p2Stats.streak > 1 && (
                      <span className="text-[10px] font-bold text-orange-300 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-400/40 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" /> {p2Stats.streak}x
                      </span>
                    )}
                  </div>

                  {/* P2 Score */}
                  <div className="text-xl md:text-2xl font-black font-['Rajdhani'] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {p2Stats.score} <span className="text-xs font-normal text-rose-300">Poin</span>
                  </div>
                </div>

                {/* P2 Hearts & Timer */}
                <div className="flex items-center justify-between bg-slate-950/25 backdrop-blur-xs p-2 rounded-xl border border-white/15">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: settings.maxLives }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-4 h-4 drop-shadow ${i < p2Stats.lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600/70'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-300 font-mono drop-shadow">Soal {p2QIndex + 1}/{p2Questions.length}</span>
                    <span className="text-xs font-black text-rose-300 font-mono drop-shadow">{p2TimeLeft}s</span>
                    <div className="w-16 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${p2TimerPercent}%` }} />
                    </div>
                  </div>
                </div>

                {/* P2 Question Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950/25 backdrop-blur-xs border border-white/20 text-center shadow-sm">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-200 border border-rose-400/40 uppercase">
                    {p2CurrentQ.category}
                  </span>
                  <h3 className="text-sm md:text-base font-extrabold text-white mt-1.5 leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {p2CurrentQ.question}
                  </h3>
                </div>
              </div>

              {/* P2 Targets A, B, C, D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {p2CurrentQ.options.map((opt) => {
                  const hitAnim = targetHitAnimationRef.current.get(`p2-${opt.key}`);
                  const isRecentlyHit = hitAnim && performance.now() - hitAnim.time < 500;

                  return (
                    <div
                      key={opt.key}
                      id={`p2-target-${opt.key}`}
                      className={`group p-3 rounded-2xl backdrop-blur-xs border-2 transition-all transform duration-150 flex items-center gap-3 ${
                        isRecentlyHit
                          ? hitAnim.type === 'correct'
                            ? 'bg-emerald-950/70 border-emerald-400 scale-105 shadow-[0_0_25px_rgba(16,185,129,0.7)]'
                            : 'bg-rose-950/70 border-rose-500 scale-95 shadow-[0_0_25px_rgba(244,63,94,0.7)]'
                          : 'bg-slate-950/25 hover:bg-slate-900/40 border-white/20 hover:border-rose-400'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black font-['Rajdhani'] text-lg shrink-0 bg-rose-500/25 border border-rose-400 text-rose-200">
                        {opt.key}
                      </div>
                      <p className="text-xs md:text-sm font-bold text-white group-hover:text-rose-200 leading-tight flex-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                        {opt.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Bottom helper pill */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-1.5 rounded-full bg-slate-950/30 backdrop-blur-xs border border-white/20 shadow-md text-[11px] text-white">
        <span>Tekuk jempol = <strong>DOR!</strong></span>
        <span className="text-white/40">•</span>
        <span>Angkat jempol = <strong>Reload</strong></span>
        <span className="text-white/40">•</span>
        <span className="hidden sm:inline">Cadangan: Klik Layar Kiri (P1) / Kanan (P2)</span>
      </div>

    </div>
  );
};
