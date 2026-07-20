/**
  * Pure Web Audio API Sound Synthesizer for MAGI System
 * Generates futuristic audio alerts without requiring external mp3/wav files.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play emergency human intervention alert sound (CODE: 999 Alert)
 */
export function playAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Emergency Dual Beep (High frequency alarm tone)
  const createBeep = (timeOffset: number, freq: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + timeOffset);

    gain.gain.setValueAtTime(0.15, now + timeOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + timeOffset);
    osc.stop(now + timeOffset + 0.12);
  };

  createBeep(0, 880);      // A5
  createBeep(0.15, 1174);  // D6
  createBeep(0.3, 880);    // A5
  createBeep(0.45, 1174);  // D6
}

/**
 * Play consensus completion chime (Cyber Chord)
 */
export function playCompletionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major Arpeggio)

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.12, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.6);
  });
}

/**
 * Play consensus initiation tone
 */
export function playStartSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.28);
}
