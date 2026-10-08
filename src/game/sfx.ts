/**
 * Game sounds, synthesised with Web Audio so there are no files to ship. Short, bright and quiet:
 * they sit under the haptics, not over the player's music.
 */
type Sound = 'tick' | 'coin' | 'collect' | 'chime' | 'levelUp' | 'stamp' | 'chest' | 'whoosh' | 'hit';

const MUTE_KEY = 'atw80-muted';
let ctx: AudioContext | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

export const isMuted = () => muted;
export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
}

function audio(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, opts: { type?: OscillatorType; gain?: number; slideTo?: number } = {}) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, ac.currentTime + start + dur);
  const peak = opts.gain ?? 0.08;
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(peak, ac.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.02);
}

function noise(ac: AudioContext, start: number, dur: number, gain = 0.05, from = 800, to = 3000) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(from, ac.currentTime + start);
  filter.frequency.exponentialRampToValueAtTime(to, ac.currentTime + start + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(ac.currentTime + start);
}

/** Notes of a major arpeggio from C5. */
const C5 = 523.25;
const step = (n: number) => C5 * Math.pow(2, n / 12);

export function play(sound: Sound, pitch = 0) {
  const ac = audio();
  if (!ac) return;
  switch (sound) {
    case 'tick':
      tone(ac, step(12 + pitch), 0, 0.05, { type: 'triangle', gain: 0.05 });
      break;
    case 'coin':
      tone(ac, step(7 + pitch), 0, 0.08, { type: 'square', gain: 0.035 });
      tone(ac, step(12 + pitch), 0.07, 0.18, { type: 'square', gain: 0.035 });
      break;
    case 'collect':
      tone(ac, step(pitch), 0, 0.12, { type: 'triangle', gain: 0.07, slideTo: step(pitch + 12) });
      break;
    case 'chime':
      [0, 4, 7, 12].forEach((n, i) => tone(ac, step(n + pitch), i * 0.06, 0.35, { type: 'triangle', gain: 0.06 }));
      break;
    case 'levelUp':
      [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(ac, step(n), i * 0.07, 0.5, { type: 'triangle', gain: 0.07 }));
      tone(ac, step(-12), 0, 0.9, { type: 'sine', gain: 0.08 });
      break;
    case 'stamp':
      tone(ac, 110, 0, 0.18, { type: 'sine', gain: 0.25, slideTo: 55 });
      noise(ac, 0, 0.08, 0.08, 400, 200);
      break;
    case 'chest':
      noise(ac, 0, 0.25, 0.05, 300, 2500);
      [0, 7, 12, 16].forEach((n, i) => tone(ac, step(n), 0.2 + i * 0.05, 0.4, { type: 'triangle', gain: 0.06 }));
      break;
    case 'whoosh':
      noise(ac, 0, 0.35, 0.05, 300, 4000);
      break;
    case 'hit':
      tone(ac, 180, 0, 0.12, { type: 'sawtooth', gain: 0.06, slideTo: 60 });
      noise(ac, 0, 0.1, 0.06, 1500, 500);
      break;
  }
}
