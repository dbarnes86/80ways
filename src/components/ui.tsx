/**
 * The whole component kit. Small, native elements styled with the theme tokens in styles.css.
 * No component library: a native <dialog>, <select>, range input and checkbox do the work.
 */
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { X } from 'lucide-react'

/** Join class names, skipping falsy ones. */
export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

/** Utility families a caller may override on a variant: background, text colour, border colour. */
const OVERRIDABLE = [/^(hover:)?bg-/, /^(hover:)?text-(?!xs|sm|base|lg|xl|\d|\[)/, /^border-(?!\d|t-|b-|l-|r-|x-|y-)/]

/**
 * Drop variant classes that the caller's className overrides, so `<Button className="bg-secondary">`
 * reliably wins without pulling in tailwind-merge.
 */
function withOverrides(variant: string, className?: string) {
  if (!className) return variant
  const given = className.split(/\s+/)
  return variant
    .split(/\s+/)
    .filter((v) => !OVERRIDABLE.some((re) => re.test(v) && given.some((g) => re.test(g) && g.startsWith('hover:') === v.startsWith('hover:'))))
    .join(' ')
}

// ─── Button ─────────────────────────────────────────────────────
type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-foreground text-background shadow-[0_4px_0_#a89a7c] active:translate-y-[3px] active:shadow-[0_1px_0_#a89a7c]',
  secondary: 'bg-secondary text-secondary-foreground shadow-[0_4px_0_#46285f] active:translate-y-[3px] active:shadow-[0_1px_0_#46285f]',
  outline: 'border-2 border-foreground/30 bg-transparent hover:bg-foreground/10 text-foreground active:translate-y-px',
  ghost: 'bg-transparent hover:bg-muted/50 text-foreground',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: 'h-12 px-5 text-base',
  sm: 'h-10 px-4 text-sm',
  lg: 'h-14 px-8 text-lg',
  icon: 'h-11 w-11',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-heading font-bold tracking-wide transition-[transform,box-shadow,background-color] duration-75',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0',
        withOverrides(BUTTON_VARIANTS[variant], className),
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

// ─── Badge ──────────────────────────────────────────────────────
export function Badge({ className, variant = 'default', ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' }) {
  const styles = {
    default: 'border-transparent bg-accent text-background',
    secondary: 'border-transparent bg-muted text-foreground',
    outline: 'text-foreground',
  }[variant]
  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', withOverrides(styles, className), className)}
      {...props}
    />
  )
}

// ─── Cards ──────────────────────────────────────────────────────
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />
}

export type GlowColor = 'cyan' | 'magenta' | 'purple' | 'none'

const GLOW: Record<GlowColor, string> = {
  // Printed, not lit: a brass rule for the hero card, plum for the Pass, a plain rule otherwise.
  cyan: 'border-accent/50 shadow-[0_10px_30px_-14px_rgb(0_0_0/0.9)]',
  magenta: 'border-secondary/60 shadow-[0_10px_30px_-14px_rgb(0_0_0/0.9)]',
  purple: 'border-secondary/60 shadow-[0_10px_30px_-14px_rgb(0_0_0/0.9)]',
  none: 'border-border',
}

const CORNER_COLOR: Record<GlowColor, string> = {
  cyan: 'border-accent',
  magenta: 'border-secondary',
  purple: 'border-secondary',
  none: 'border-accent',
}

export interface HoloCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: GlowColor
  scanLines?: boolean
  corners?: boolean
  animated?: boolean
}

/** The neon card: glow, scan lines and corner brackets. */
export function HoloCard({ glow = 'cyan', scanLines = false, corners = true, animated = true, className, children, ...props }: HoloCardProps) {
  const corner = CORNER_COLOR[glow]
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card text-card-foreground transition-shadow duration-300',
        GLOW[glow],
        animated && 'animate-fade-up',
        className,
      )}
      {...props}
    >
      {scanLines && <div className="scan-lines pointer-events-none absolute inset-0 z-10" />}
      {corners && (
        <>
          <span className={cn('pointer-events-none absolute left-1 top-1 z-20 size-3 border-l-2 border-t-2', corner)} />
          <span className={cn('pointer-events-none absolute right-1 top-1 z-20 size-3 border-r-2 border-t-2', corner)} />
          <span className={cn('pointer-events-none absolute bottom-1 left-1 z-20 size-3 border-b-2 border-l-2', corner)} />
          <span className={cn('pointer-events-none absolute bottom-1 right-1 z-20 size-3 border-b-2 border-r-2', corner)} />
        </>
      )}
      <div className="relative z-20">{children}</div>
    </div>
  )
}

// ─── Progress ───────────────────────────────────────────────────
export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('relative h-3 w-full overflow-hidden rounded-full bg-muted', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)] transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

type SegmentGlow = 'cyan' | 'magenta' | 'purple' | 'success' | 'warning'
const SEGMENT: Record<SegmentGlow, { bar: string; shadow: string }> = {
  cyan: { bar: 'bg-primary', shadow: 'shadow-[0_0_8px_hsl(var(--primary)/0.6)]' },
  magenta: { bar: 'bg-secondary', shadow: 'shadow-[0_0_8px_hsl(var(--secondary)/0.6)]' },
  purple: { bar: 'bg-accent', shadow: 'shadow-[0_0_8px_hsl(var(--accent)/0.6)]' },
  success: { bar: 'bg-success', shadow: 'shadow-[0_0_8px_hsl(var(--success)/0.6)]' },
  warning: { bar: 'bg-warning', shadow: 'shadow-[0_0_8px_hsl(var(--warning)/0.6)]' },
}

/** Segmented "battery" progress bar. */
export function SegmentedProgress({
  value,
  max = 100,
  segments = 10,
  glow = 'cyan',
  size = 'md',
  showLabel = false,
  className,
}: {
  value: number
  max?: number
  segments?: number
  glow?: SegmentGlow
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const filled = Math.round((pct / 100) * segments)
  const height = { sm: 'h-2 gap-px', md: 'h-4 gap-0.5', lg: 'h-6 gap-0.5' }[size]
  const colors = SEGMENT[glow]
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex w-full overflow-hidden rounded-sm', height)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-[1px] transition-all duration-300',
              i < filled ? cn(colors.bar, i === filled - 1 && colors.shadow) : 'bg-muted/40',
            )}
          />
        ))}
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{value.toFixed(1)} / {max}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      )}
    </div>
  )
}

// ─── Form controls ──────────────────────────────────────────────
const FIELD = 'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(FIELD, 'h-10', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(FIELD, 'min-h-20', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD, 'h-12 appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a6a6a6' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}>
      {children}
    </select>
  )
}

export function Checkbox({ checked, onChange, className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & { onChange: (checked: boolean) => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn('size-4 shrink-0 accent-[hsl(var(--primary))]', className)}
      {...props}
    />
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span className={cn('block size-5 rounded-full bg-background shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  )
}

/** Native range input; `--fill` paints the filled part of the track. */
export function Slider({ value, max, step = 0.1, onChange, disabled, label }: { value: number; max: number; step?: number; onChange: (v: number) => void; disabled?: boolean; label?: string }) {
  const fill = max > 0 ? (value / max) * 100 : 0
  return (
    <input
      type="range"
      className="range"
      min={0}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={label}
      style={{ '--fill': `${fill}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

// ─── Dialog ─────────────────────────────────────────────────────
/** Modal on a native <dialog>: focus trapping, Escape and the backdrop come from the browser. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      // jsdom has no showModal.
      if (typeof el.showModal === 'function') el.showModal()
      else el.setAttribute('open', '')
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={cn(
        'modal fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border-2 border-primary/50 bg-background p-6 text-foreground shadow-lg backdrop:bg-black/80',
        open && 'animate-scale-in',
        className,
      )}
      aria-labelledby={title ? titleId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          {(title || description) && (
            <div className="mb-4 space-y-1.5 pr-6">
              {title && <h2 id={titleId} className="text-xl font-heading font-bold leading-tight">{title}</h2>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          )}
          {children}
        </>
      )}
    </dialog>
  )
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 space-y-1.5 pr-6', className)} {...props} />
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-xl font-heading font-bold leading-tight', className)} {...props} />
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}
