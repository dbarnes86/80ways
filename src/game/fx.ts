/**
 * Imperative effects that fly across the screen (orbs into the HUD). Done with plain DOM nodes so
 * dozens of them don't re-render React.
 */
import type { EnergyType } from '@/data/gameConstants';
import { orbColor } from './art';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Where flying rewards land: the HUD element with this id, else the top centre. */
function target(id: string): { x: number; y: number } {
  const el = document.getElementById(id);
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth / 2, y: 40 };
}

/** Burst `count` glowing orbs from a point and fly them to the HUD. Resolves when the last lands. */
export function flyOrbs(from: { x: number; y: number }, type: EnergyType, count = 8, to = 'hud-energy'): Promise<void> {
  if (typeof document === 'undefined' || reducedMotion()) return Promise.resolve();
  const dest = target(to);
  const color = orbColor(type);
  const done: Promise<void>[] = [];

  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    const size = 10 + Math.random() * 8;
    Object.assign(orb.style, {
      position: 'fixed',
      left: `${from.x - size / 2}px`,
      top: `${from.y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '9999px',
      background: `radial-gradient(circle at 35% 35%, #fff, ${color} 55%)`,
      boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
      zIndex: '97',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(orb);

    // Scatter out, then home in on the HUD.
    const angle = Math.random() * Math.PI * 2;
    const spread = 30 + Math.random() * 50;
    const anim = orb.animate(
      [
        { transform: 'translate(0,0) scale(0.4)', opacity: 0 },
        { transform: `translate(${Math.cos(angle) * spread}px, ${Math.sin(angle) * spread}px) scale(1.1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${dest.x - from.x}px, ${dest.y - from.y}px) scale(0.5)`, opacity: 0.9 },
      ],
      { duration: 650 + Math.random() * 250, delay: i * 35, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' },
    );
    done.push(
      anim.finished.then(
        () => orb.remove(),
        () => orb.remove(),
      ),
    );
  }
  return Promise.all(done).then(() => {
    // The HUD pulses as they land.
    document.getElementById(to)?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
  });
}

export const centreOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

const COIN_HTML =
  '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="10" fill="#f5b83d" stroke="#ffe08a" stroke-width="1.5"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#b9791b" stroke-width="1.5"/></svg>';
const XP_HTML =
  '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="#6ff6ff" stroke="#fff" stroke-width="1"/></svg>';

/**
 * Fly reward icons along an arc into a HUD element, calling onLand as each one arrives.
 * Resolves when the last lands (immediately, with no landings, under reduced motion).
 */
export function flyIcons(opts: { kind: 'coin' | 'xp'; count: number; to: string; from?: { x: number; y: number }; onLand: (i: number) => void }): Promise<void> {
  if (typeof document === 'undefined' || reducedMotion() || !document.getElementById(opts.to)) return Promise.resolve();
  const from = opts.from ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.55 };
  const dest = target(opts.to);
  const glowColor = opts.kind === 'coin' ? '#f5b83d' : '#6ff6ff';
  const jobs: Promise<void>[] = [];

  for (let i = 0; i < opts.count; i++) {
    const el = document.createElement('div');
    const size = opts.kind === 'coin' ? 26 : 20;
    el.innerHTML = opts.kind === 'coin' ? COIN_HTML : XP_HTML;
    Object.assign(el.style, {
      position: 'fixed',
      left: `${from.x - size / 2}px`,
      top: `${from.y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      zIndex: '97',
      pointerEvents: 'none',
      filter: `drop-shadow(0 0 6px ${glowColor})`,
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(el);

    const spreadX = (Math.random() - 0.5) * 140;
    const spreadY = -40 - Math.random() * 80;
    const dx = dest.x - from.x;
    const dy = dest.y - from.y;
    const anim = el.animate(
      [
        { transform: 'translate(0,0) scale(0.3) rotate(0deg)', opacity: 0 },
        { transform: `translate(${spreadX}px, ${spreadY}px) scale(1.15) rotate(90deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx * 0.6 + spreadX * 0.3}px, ${dy * 0.6}px) scale(1) rotate(200deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.55) rotate(320deg)`, opacity: 0.9 },
      ],
      { duration: 750, delay: i * 70, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' },
    );
    jobs.push(
      anim.finished.then(
        () => {
          el.remove();
          opts.onLand(i);
          document.getElementById(opts.to)?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 180 });
        },
        () => el.remove(),
      ),
    );
  }
  return Promise.all(jobs).then(() => undefined);
}

const COIN_FACE =
  '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="10" fill="#D9A441" stroke="#efc66e" stroke-width="1.5"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#8a6320" stroke-width="1.5"/></svg>';

/** A spill of coins from a point: up, over, and down with gravity, then gone. Nothing is counted. */
export function burstCoins(from: { x: number; y: number }, count = 14): void {
  if (typeof document === 'undefined' || reducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = 16 + Math.random() * 12;
    el.innerHTML = COIN_FACE;
    Object.assign(el.style, {
      position: 'fixed',
      left: `${from.x - size / 2}px`,
      top: `${from.y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      zIndex: '97',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(el);
    const dx = (Math.random() - 0.5) * 260;
    const up = -(80 + Math.random() * 120);
    const spin = (Math.random() - 0.5) * 900;
    const anim = el.animate(
      [
        { transform: 'translate(0,0) scale(0.4) rotate(0deg)', opacity: 0 },
        { transform: `translate(${dx * 0.5}px, ${up}px) scale(1) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${dx}px, ${-up * 0.3 + 120}px) scale(0.9) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 300, delay: i * 25, easing: 'cubic-bezier(.3,.6,.6,1)', fill: 'forwards' },
    );
    anim.finished.then(
      () => el.remove(),
      () => el.remove(),
    );
  }
}

/** A puff of cream steam rising from a point and thinning out. */
export function puff(from: { x: number; y: number }, count = 3): void {
  if (typeof document === 'undefined' || reducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = 18 + Math.random() * 14;
    Object.assign(el.style, {
      position: 'fixed',
      left: `${from.x - size / 2}px`,
      top: `${from.y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '9999px',
      background: 'radial-gradient(circle at 40% 40%, #F2EAD8, rgba(242,234,216,0.3) 70%)',
      zIndex: '97',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(el);
    const drift = (Math.random() - 0.3) * 40;
    const anim = el.animate(
      [
        { transform: 'translate(0,0) scale(0.5)', opacity: 0 },
        { transform: `translate(${drift * 0.4}px, -22px) scale(1)`, opacity: 0.9, offset: 0.25 },
        { transform: `translate(${drift}px, -70px) scale(1.8)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 300, delay: i * 140, easing: 'ease-out', fill: 'forwards' },
    );
    anim.finished.then(
      () => el.remove(),
      () => el.remove(),
    );
  }
}
