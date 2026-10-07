import { create } from 'zustand'
import { X } from 'lucide-react'
import { cn } from './ui'

export interface ToastInput {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastItem extends ToastInput {
  id: number
}

const DURATION_MS = 3500
let nextId = 1

const useToasts = create<{ items: ToastItem[]; dismiss: (id: number) => void }>((set) => ({
  items: [],
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

/** Show a toast. Callable from anywhere, components or not. */
export function toast(input: ToastInput) {
  const id = nextId++
  // Newest on top, two at most.
  useToasts.setState((s) => ({ items: [{ ...input, id }, ...s.items].slice(0, 2) }))
  setTimeout(() => useToasts.getState().dismiss(id), DURATION_MS)
}

export function Toaster() {
  const { items, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:items-end" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto relative w-full max-w-sm animate-fade-up rounded-lg border px-4 py-3 pr-8 shadow-[0_8px_30px_rgb(0_0_0/0.6)] backdrop-blur-md',
            t.variant === 'destructive' ? 'border-destructive bg-destructive/90 text-white' : 'border-primary/30 bg-card/95',
          )}
        >
          <p className="text-sm font-semibold">{t.title}</p>
          {t.description && <p className="mt-1 text-sm opacity-90">{t.description}</p>}
          <button type="button" onClick={() => dismiss(t.id)} className="absolute right-2 top-2 opacity-60 hover:opacity-100" aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
