import { useEffect, useRef, useState } from 'react';
import { StudioMark } from '@/components/StudioMark';
import { cn } from '@/components/ui';
import { haptic } from '@/lib/native';

/**
 * The opening titles: the studio mark, then the story in four shots, each fading in from black
 * with its own line, and a final card that asks the question the crest picker then answers. One
 * tap skips. The video is the shots stitched with fades (scripts/intro/stitch.sh); the stills are
 * the same frames and stand in when the video can't play (reduced motion, a failed load, a browser
 * that refuses autoplay).
 */
export const INTRO_SHOTS = [
  { still: 'london', kicker: 'London, 1872', line: 'Phileas Fogg bets £20,000' },
  { still: 'ship-profile', kicker: 'The wager', line: 'that he can circle the world in 80 days.' },
  { still: 'train-profile', kicker: 'The journey', line: 'By ship. By rail. By any means at all.' },
  { still: 'runner-road', kicker: 'You', line: 'Every workout you do moves him on.' },
] as const;

/** Each shot is SHOT seconds long, fades included; the stitch script uses the same number. */
export const SHOT = 4.0;
export const shotStart = (i: number) => i * SHOT;

const MARK_MS = 2400;
const VIDEO = '/intro/intro.mp4';

type Phase = 'mark' | 'film' | 'end';

export function Intro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('mark');
  const [shot, setShot] = useState(0);
  const [stills, setStills] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    haptic('tap');
    onDone();
  };

  // The mark holds, then the film starts.
  useEffect(() => {
    const t = setTimeout(() => setPhase('film'), MARK_MS);
    return () => clearTimeout(t);
  }, []);

  // Film: try to play; anything that stops it (autoplay refused, missing file) falls back to stills.
  useEffect(() => {
    if (phase !== 'film' || stills) return;
    const v = video.current;
    if (!v) return;
    v.play().catch(() => setStills(true));
  }, [phase, stills]);

  // Stills: advance on the same clock the film would.
  useEffect(() => {
    if (phase !== 'film' || !stills) return;
    if (shot >= INTRO_SHOTS.length - 1) {
      const t = setTimeout(() => setPhase('end'), SHOT * 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShot(shot + 1), SHOT * 1000);
    return () => clearTimeout(t);
  }, [phase, stills, shot]);

  const onTime = () => {
    const t = video.current?.currentTime ?? 0;
    let i = 0;
    while (i + 1 < INTRO_SHOTS.length && t >= shotStart(i + 1)) i++;
    if (i !== shot) setShot(i);
  };

  const cue = INTRO_SHOTS[shot];
  const ended = phase === 'end';

  // One stage for the whole sequence: the frame sits in a fixed place and never moves, the line
  // under it has a fixed-height slot, and the mark and the closing question both appear inside
  // the frame, so the eye stays in one spot from the first fade to the last.
  return (
    <div className="fixed inset-0 z-50 bg-background" role="dialog" aria-label="Opening titles">
      <div className="mx-auto flex h-full w-full max-w-md flex-col pt-[max(18dvh,calc(env(safe-area-inset-top)+4rem))]">
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {phase !== 'mark' &&
            (stills ? (
              INTRO_SHOTS.map((s, i) => (
                <img
                  key={s.still}
                  src={`/intro/${s.still}.webp`}
                  alt=""
                  className={cn('absolute inset-0 size-full object-cover transition-opacity duration-500', i === shot && !ended ? 'opacity-100' : 'opacity-0')}
                />
              ))
            ) : (
              <video
                ref={video}
                src={VIDEO}
                muted
                playsInline
                preload="auto"
                onTimeUpdate={onTime}
                onEnded={() => setPhase('end')}
                onError={() => setStills(true)}
                className={cn('absolute inset-0 size-full object-cover transition-opacity duration-500', ended && 'opacity-0')}
              />
            ))}

          {phase === 'mark' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <StudioMark className="animate-mark text-4xl" />
            </div>
          )}

          {ended && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background px-6 text-center">
              <p className="kicker animate-fade-up text-accent">Your turn</p>
              <p className="animate-fade-up mt-3 font-heading text-5xl font-bold leading-none text-accent" style={{ animationDelay: '0.15s' }}>
                What moves you?
              </p>
            </div>
          )}
        </div>

        {/* Fixed-height slot: a two- or three-line caption never pushes the frame around. */}
        <div className="flex h-48 flex-col items-center px-8 pt-8 text-center">
          {phase === 'film' && (
            <div key={shot} className="animate-caption" style={{ animationDuration: `${SHOT}s` }} aria-live="polite">
              <p className="kicker text-accent">{cue.kicker}</p>
              <p className="mt-3 font-heading text-[2rem] font-bold leading-tight">{cue.line}</p>
            </div>
          )}
          {ended && (
            <button type="button" onClick={finish} className="btn-game btn-primary animate-fade-up px-10" style={{ animationDelay: '0.4s' }}>
              Begin
            </button>
          )}
        </div>
      </div>

      {!ended && (
        <button type="button" onClick={finish} className="kicker absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] text-muted-foreground">
          Skip
        </button>
      )}
    </div>
  );
}
