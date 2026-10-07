import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { haptic } from '@/lib/native'
import { Button } from '@/components/ui'
import { toast } from '@/components/toast'
import { useAuth } from '@/contexts/AuthContext'
import { useMembershipStore } from '@/stores/membershipStore'
import { getNativePlans, isNative, manageNativeSubscription, purchaseNative, restoreNative } from '@/services/purchaseService'

export type Plan = 'monthly' | 'annual'

export interface Plans {
  configured: boolean
  trialDays: number
  plans: { plan: Plan; label: string }[]
  store: 'stripe' | 'app_store'
}

interface BillingError {
  error: string
  message?: string
}

/** Calls the billing Edge Function as the signed-in player. */
async function billing<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T | BillingError>('billing', { body })
  if (error) {
    const ctx = (error as { context?: Response }).context
    const detail = ctx ? ((await ctx.json().catch(() => null)) as BillingError | null) : null
    throw new Error(detail?.message ?? detail?.error ?? error.message)
  }
  return data as T
}

/** Redirect the browser. Isolated so tests can stub it. */
export const navigateTo = { assign: (url: string) => window.location.assign(url) }

/** Prices: from the App Store on iPhone, from Stripe (via the billing function) on the web. */
export function usePlans() {
  const [plans, setPlans] = useState<Plans | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (isNative()) {
      getNativePlans().then((p) => setPlans({ configured: p.length > 0, trialDays: 0, plans: p, store: 'app_store' }), (e: Error) => setError(e.message))
    } else {
      billing<Omit<Plans, 'store'>>({ action: 'config' }).then((c) => setPlans({ ...c, store: 'stripe' }), (e: Error) => setError(e.message))
    }
  }, [])
  return { plans, error }
}

/** Buy a plan: StoreKit on iPhone, Stripe Checkout on the web. Membership itself is granted server-side. */
export function UpgradeButton({ plan, children, variant }: { plan: Plan; children: React.ReactNode; variant?: 'outline' }) {
  const { user } = useAuth()
  const fetchMembership = useMembershipStore((s) => s.fetch)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const go = async () => {
    if (!user) return
    haptic('tap')
    setBusy(true)
    setError(null)
    try {
      if (isNative()) {
        const outcome = await purchaseNative(plan, user.id)
        if (outcome === 'purchased') {
          await fetchMembership(user.id)
          haptic('success')
          toast({ title: 'Welcome aboard', description: "You're a member. The expedition awaits." })
        }
        setBusy(false)
      } else {
        const { url } = await billing<{ url: string }>({ action: 'checkout', plan })
        navigateTo.assign(url)
      }
    } catch (e) {
      haptic('error')
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <Button onClick={() => void go()} disabled={busy} variant={variant} className="h-12 px-6">
        {busy ? <Loader2 className="animate-spin" /> : null}
        {busy ? (isNative() ? 'Contacting the App Store…' : 'Opening checkout…') : children}
      </Button>
      {error && <span className="max-w-xs text-xs text-destructive">{error}</span>}
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
      if (isNative()) {
        await manageNativeSubscription()
        setBusy(false)
      } else {
        const { url } = await billing<{ url: string }>({ action: 'portal' })
        navigateTo.assign(url)
      }
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }
  return (
    <span className="inline-flex flex-col gap-2">
      <Button variant="outline" onClick={() => void go()} disabled={busy}>
        {busy ? 'Opening…' : isNative() ? 'Manage subscription' : 'Manage billing'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}

/** App Review requires a visible way to restore App Store purchases. */
export function RestorePurchasesButton() {
  const { user } = useAuth()
  const fetchMembership = useMembershipStore((s) => s.fetch)
  const [busy, setBusy] = useState(false)
  if (!isNative()) return null
  const go = async () => {
    if (!user) return
    setBusy(true)
    try {
      const found = await restoreNative()
      await fetchMembership(user.id)
      toast(found ? { title: 'Purchases restored' } : { title: 'Nothing to restore', description: 'No active 80 Ways subscription on this Apple ID.' })
    } catch (e) {
      toast({ title: 'Restore failed', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <button type="button" onClick={() => void go()} disabled={busy} className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
      {busy ? 'Restoring…' : 'Restore purchases'}
    </button>
  )
}
