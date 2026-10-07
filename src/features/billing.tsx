import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui'
import { isNative, NATIVE_PURCHASES_ENABLED } from '@/services/purchaseService'

export type Plan = 'monthly' | 'annual'

export interface BillingConfig {
  configured: boolean
  trialDays: number
  plans: { plan: Plan; label: string }[]
}

interface BillingError {
  error: string
  message?: string
}

/** Calls the billing Edge Function as the signed-in player. */
async function billing<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T | BillingError>('billing', { body })
  if (error) {
    // FunctionsHttpError carries the response; surface its message when there is one.
    const ctx = (error as { context?: Response }).context
    const detail = ctx ? ((await ctx.json().catch(() => null)) as BillingError | null) : null
    throw new Error(detail?.message ?? detail?.error ?? error.message)
  }
  return data as T
}

export const fetchBillingConfig = () => billing<BillingConfig>({ action: 'config' })

/** Redirect the browser. Isolated so tests can stub it. */
export const navigateTo = { assign: (url: string) => window.location.assign(url) }

export function useBillingConfig() {
  const [config, setConfig] = useState<BillingConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetchBillingConfig().then(setConfig, (e: Error) => setError(e.message))
  }, [])
  return { config, error }
}

/** Starts Stripe Checkout. The server refuses if the player is already a member. */
export function UpgradeButton({ plan, children, variant }: { plan: Plan; children: React.ReactNode; variant?: 'outline' }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isNative() && !NATIVE_PURCHASES_ENABLED) {
    return <p className="text-xs text-muted-foreground">Memberships can't be bought in the app yet.</p>
  }

  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      const { url } = await billing<{ url: string }>({ action: 'checkout', plan })
      navigateTo.assign(url)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <Button onClick={() => void go()} disabled={busy} variant={variant}>
        {busy ? <Loader2 className="animate-spin" /> : null}
        {busy ? 'Opening checkout…' : children}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}

export function ManageBillingButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      const { url } = await billing<{ url: string }>({ action: 'portal' })
      navigateTo.assign(url)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }
  return (
    <span className="inline-flex flex-col gap-2">
      <Button variant="outline" onClick={() => void go()} disabled={busy}>
        {busy ? 'Opening…' : 'Manage billing'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}
