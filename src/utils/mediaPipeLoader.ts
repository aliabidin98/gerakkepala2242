/**
 * Utility to load MediaPipe Hands and Camera scripts dynamically with CDN fallbacks.
 * Ensures the app never hangs on loading, even with network restrictions.
 */

const JSDELIVR_HANDS = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
const JSDELIVR_CAMERA = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';

const UNPKG_HANDS = 'https://unpkg.com/@mediapipe/hands/hands.js';
const UNPKG_CAMERA = 'https://unpkg.com/@mediapipe/camera_utils/camera_utils.js';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already in document
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));

    document.head.appendChild(script);
  });
}

let loadPromise: Promise<boolean> | null = null;

export async function ensureMediaPipeLoaded(): Promise<boolean> {
  const win = window as any;
  if (win.Hands && win.Camera) {
    return true;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    // Attempt 1: jsdelivr
    try {
      await Promise.all([
        loadScript(JSDELIVR_CAMERA),
        loadScript(JSDELIVR_HANDS),
      ]);
      if ((window as any).Hands && (window as any).Camera) {
        return true;
      }
    } catch (e) {
      console.warn('Primary CDN (jsdelivr) failed for MediaPipe, trying unpkg fallback...', e);
    }

    // Attempt 2: unpkg fallback
    try {
      await Promise.all([
        loadScript(UNPKG_CAMERA),
        loadScript(UNPKG_HANDS),
      ]);
      if ((window as any).Hands && (window as any).Camera) {
        return true;
      }
    } catch (e) {
      console.error('All CDNs failed for MediaPipe:', e);
    }

    return typeof (window as any).Hands !== 'undefined';
  })();

  return loadPromise;
}
