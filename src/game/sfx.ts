/**
 * Game sounds, synthesised with Web Audio so there are no files to ship. Short, bright and quiet:
 * they sit under the haptics, not over the player's music.
 */
type Sound = 'tick' | 'coin' | 'collect' | 'chime' | 'levelUp' | 'stamp' | 'chest' | 'whoosh' | 'hit' | 'whistle' | 'spill' | 'flip';

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
      // A brass swell under the arpeggio: fifths on a sawtooth, quiet, so it reads as a fanfare.
      [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(ac, step(n), i * 0.07, 0.5, { type: 'triangle', gain: 0.07 }));
      tone(ac, step(-12), 0, 1.1, { type: 'sine', gain: 0.09 });
      tone(ac, step(-5), 0.1, 1.0, { type: 'sawtooth', gain: 0.02 });
      tone(ac, step(0), 0.1, 1.0, { type: 'sawtooth', gain: 0.02 });
      break;
    case 'stamp':
      // Thud, then the slap of ink on paper.
      tone(ac, 120, 0, 0.2, { type: 'sine', gain: 0.3, slideTo: 50 });
      noise(ac, 0, 0.06, 0.1, 500, 200);
      noise(ac, 0.03, 0.12, 0.04, 2500, 900);
      break;
    case 'chest':
      // Creak of the lid, then the spill.
      tone(ac, 160, 0, 0.3, { type: 'sawtooth', gain: 0.025, slideTo: 240 });
      noise(ac, 0, 0.3, 0.04, 300, 1800);
      [0, 7, 12, 16].forEach((n, i) => tone(ac, step(n), 0.25 + i * 0.05, 0.4, { type: 'triangle', gain: 0.06 }));
      break;
    case 'spill':
      // A handful of coins landing: fast, falling ticks.
      for (let i = 0; i < 9; i++) tone(ac, step(19 - i + Math.round(Math.random() * 3)), 0.03 * i, 0.07, { type: 'square', gain: 0.025 });
      break;
    case 'whistle':
      // A steam whistle: two tones with a breathy start.
      noise(ac, 0, 0.5, 0.03, 1200, 3000);
      tone(ac, 660, 0.02, 0.55, { type: 'triangle', gain: 0.07, slideTo: 700 });
      tone(ac, 880, 0.02, 0.55, { type: 'triangle', gain: 0.045, slideTo: 930 });
      break;
    case 'flip':
      // A departure-board flap.
      noise(ac, 0, 0.04, 0.06, 900, 300);
      tone(ac, 200, 0, 0.04, { type: 'square', gain: 0.02 });
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
