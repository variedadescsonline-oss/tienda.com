/**
 * Web Audio API synthesizer for instant retail POS barcode scanner sounds
 * Zero external audio files, runs locally and works offline.
 */
export function playScannerBeep(success = true) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      // Crisp, pleasant register beep (1450Hz sine wave)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, ctx.currentTime);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else {
      // Low dual warning buzzer (320Hz sawtooth)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch {
    // AudioContext might be blocked until first user interaction
  }

  // Also trigger physical haptic feedback on mobile devices
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(success ? [60, 40, 60] : 180);
    } catch {
      // ignore
    }
  }
}
