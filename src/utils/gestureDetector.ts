import { HandTrackingState } from '../types/game';

export interface RawHandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface PlayerHandTracker {
  smoothedX: number;
  smoothedY: number;
  isCocked: boolean;
  lastShotTime: number;
  handSide: 'Left' | 'Right' | 'Unknown';
  justShot: boolean;
  thumbValue: number;
  isIndexPointing: boolean;
  hasTracked: boolean;
  // History for tracking trigger velocity
  lastThumbLift: number;
}

export function createHandTracker(side: 'Left' | 'Right' | 'Unknown' = 'Unknown'): PlayerHandTracker {
  return {
    smoothedX: 0.5,
    smoothedY: 0.5,
    isCocked: false,
    lastShotTime: 0,
    handSide: side,
    justShot: false,
    thumbValue: 0,
    isIndexPointing: false,
    hasTracked: false,
    lastThumbLift: 0,
  };
}

/**
 * Accurately projects normalized video coordinates to screen pixels
 * accounting for CSS object-cover scaling and cropping!
 */
export function projectVideoToScreen(
  normX: number,
  normY: number,
  videoW: number,
  videoH: number,
  containerW: number,
  containerH: number,
  mirrorX: boolean = true
): { screenX: number; screenY: number } {
  const effectiveX = mirrorX ? 1.0 - normX : normX;
  const videoAspect = (videoW || 640) / (videoH || 480);
  const containerAspect = containerW / containerH;

  let renderedW = containerW;
  let renderedH = containerH;
  let offsetX = 0;
  let offsetY = 0;

  if (containerAspect > videoAspect) {
    // Video is scaled to fit width; top and bottom cropped
    renderedW = containerW;
    renderedH = containerW / videoAspect;
    offsetY = (renderedH - containerH) / 2;
  } else {
    // Video is scaled to fit height; sides cropped
    renderedH = containerH;
    renderedW = containerH * videoAspect;
    offsetX = (renderedW - containerW) / 2;
  }

  const screenX = effectiveX * renderedW - offsetX;
  const screenY = normY * renderedH - offsetY;

  return { screenX, screenY };
}

/**
 * Process a set of 21 MediaPipe Hand landmarks with:
 * - Scale-invariant palm-normalized metrics
 * - Object-cover compensation for pinpoint fingertip accuracy
 * - Dynamic exponential smoothing (zero input latency + zero jitter)
 */
export function processHandLandmarks(
  landmarks: RawHandLandmark[],
  tracker: PlayerHandTracker,
  viewportWidth: number,
  viewportHeight: number,
  sensitivity: number = 1.35,
  videoW: number = 640,
  videoH: number = 480
): {
  state: HandTrackingState;
  didShoot: boolean;
  didCock: boolean;
  fingertipX: number;
  fingertipY: number;
  thumbTipX: number;
  thumbTipY: number;
} {
  let didShoot = false;
  let didCock = false;

  if (!landmarks || landmarks.length < 21) {
    return {
      state: {
        x: tracker.smoothedX,
        y: tracker.smoothedY,
        rawX: tracker.smoothedX,
        rawY: tracker.smoothedY,
        isIndexPointing: false,
        isCocked: tracker.isCocked,
        thumbValue: tracker.thumbValue,
        justShot: false,
        lastShotTime: tracker.lastShotTime,
        handSide: tracker.handSide,
      },
      didShoot: false,
      didCock: false,
      fingertipX: tracker.smoothedX,
      fingertipY: tracker.smoothedY,
      thumbTipX: tracker.smoothedX,
      thumbTipY: tracker.smoothedY,
    };
  }

  // Key landmarks
  // 0: Wrist
  // 2: Thumb MCP, 3: Thumb IP, 4: Thumb Tip
  // 5: Index MCP, 6: Index PIP, 7: Index DIP, 8: Index Tip
  // 9: Middle MCP, 12: Middle Tip
  const wrist = landmarks[0];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];
  const middleMcp = landmarks[9];

  // 1. Calculate hand scale (distance from wrist to index MCP) for distance-invariant metrics
  const handScale = Math.hypot(indexMcp.x - wrist.x, indexMcp.y - wrist.y) || 0.15;

  // 2. Project index fingertip (Landmark 8) precisely into viewport pixel space with object-cover compensation
  const { screenX: rawPxX, screenY: rawPxY } = projectVideoToScreen(
    indexTip.x,
    indexTip.y,
    videoW,
    videoH,
    viewportWidth,
    viewportHeight,
    true // mirrored
  );

  const { screenX: thumbPxX, screenY: thumbPxY } = projectVideoToScreen(
    thumbTip.x,
    thumbTip.y,
    videoW,
    videoH,
    viewportWidth,
    viewportHeight,
    true
  );

  // 3. Ergonomic amplification from viewport center so player can comfortably reach screen corners
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const targetX = (rawPxX - centerX) * sensitivity + centerX;
  const targetY = (rawPxY - centerY) * sensitivity + centerY;

  const clampedTargetX = Math.max(15, Math.min(viewportWidth - 15, targetX));
  const clampedTargetY = Math.max(15, Math.min(viewportHeight - 15, targetY));

  // 4. Dynamic responsive Lerp:
  // Instant tracking when moving fast, velvety smooth when holding still
  if (!tracker.hasTracked) {
    tracker.smoothedX = clampedTargetX;
    tracker.smoothedY = clampedTargetY;
    tracker.hasTracked = true;
  } else {
    const dx = clampedTargetX - tracker.smoothedX;
    const dy = clampedTargetY - tracker.smoothedY;
    const distPx = Math.hypot(dx, dy);

    // Adaptive factor: from 0.45 when still up to 0.92 when moving briskly
    const adaptiveLerp = Math.min(0.92, Math.max(0.48, distPx / 120));
    tracker.smoothedX += dx * adaptiveLerp;
    tracker.smoothedY += dy * adaptiveLerp;
  }

  // 5. Index finger pointing verification
  const distWristToIndexTip = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
  const distWristToIndexPip = Math.hypot(indexPip.x - wrist.x, indexPip.y - wrist.y);
  const isIndexPointing = distWristToIndexTip > distWristToIndexPip * 1.08;
  tracker.isIndexPointing = isIndexPointing;

  // 6. Scale-Invariant Thumb Hammer & Trigger Mechanics:
  // Normalize thumb height relative to player's hand size
  const thumbLiftNormalized = (thumbMcp.y - thumbTip.y) / handScale;
  const thumbExtensionFromPalm = Math.hypot(thumbTip.x - middleMcp.x, thumbTip.y - middleMcp.y) / handScale;
  tracker.thumbValue = thumbLiftNormalized;

  const now = performance.now();
  const MIN_REFIRE_DELAY_MS = 180; // Fast and snappy refire delay

  // Cocked threshold: Thumb is raised up like a pistol hammer
  const COCK_THRESHOLD = 0.16;
  // Fire threshold: Thumb drops down or folds towards palm
  const FIRE_THRESHOLD = 0.05;

  if (!tracker.isCocked) {
    // Player raises thumb up to cock gun
    if ((thumbLiftNormalized > COCK_THRESHOLD || thumbExtensionFromPalm > 0.65) && isIndexPointing) {
      tracker.isCocked = true;
      didCock = true;
    }
  } else {
    // Gun is ready to fire
    // Trigger condition 1: Thumb drops below threshold
    // Trigger condition 2: Thumb drops below IP knuckle
    // Trigger condition 3: Rapid downward thumb movement (hammer snap)
    const thumbDropped = thumbLiftNormalized < FIRE_THRESHOLD || thumbTip.y >= thumbIp.y;
    const rapidDrop = tracker.lastThumbLift - thumbLiftNormalized > 0.12;

    if ((thumbDropped || rapidDrop) && (now - tracker.lastShotTime > MIN_REFIRE_DELAY_MS)) {
      tracker.isCocked = false;
      tracker.lastShotTime = now;
      tracker.justShot = true;
      didShoot = true;
    } else {
      tracker.justShot = false;
    }
  }

  tracker.lastThumbLift = thumbLiftNormalized;

  return {
    state: {
      x: tracker.smoothedX,
      y: tracker.smoothedY,
      rawX: rawPxX,
      rawY: rawPxY,
      isIndexPointing: tracker.isIndexPointing,
      isCocked: tracker.isCocked,
      thumbValue: tracker.thumbValue,
      justShot: tracker.justShot,
      lastShotTime: tracker.lastShotTime,
      handSide: tracker.handSide,
    },
    didShoot,
    didCock,
    fingertipX: rawPxX,
    fingertipY: rawPxY,
    thumbTipX: thumbPxX,
    thumbTipY: thumbPxY,
  };
}
