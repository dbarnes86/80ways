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
