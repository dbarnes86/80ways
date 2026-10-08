import { COMPANY } from '@/data/company';
import { cn } from '@/components/ui';

/** The studio wordmark: type, not an image, so a rename is one line in COMPANY. */
export function StudioMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex flex-col items-center font-heading font-bold uppercase leading-none', className)}>
      <span className="tracking-[0.35em] [margin-right:-0.35em]">{COMPANY.brand}</span>
      <span className="mt-[0.45em] text-[0.28em] tracking-[0.5em] text-muted-foreground [margin-right:-0.5em]">Games</span>
    </span>
  );
}
