import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Crown, Loader2 } from 'lucide-react'
import { HoloCard } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { selectIsMember, useMembershipStore } from '@/stores/membershipStore'
import { isNative } from '@/services/purchaseService'
import { ManageBillingButton, RestorePurchasesButton, UpgradeButton, usePlans } from '@/features/billing'

/** What's free and what the pass adds, as two columns. */
const TRACKS: { label: string; free: boolean }[] = [
  { label: 'Lift Off, daily quests and chests', free: true },
  { label: 'Weekly telegrams and gold chests', free: true },
  { label: 'The 80-day voyage, 11 legs', free: false },
  { label: 'Passport stamps in every city', free: false },
  { label: 'Raids against Detective Fix', free: false },
  { label: 'The season leaderboard', free: false },
]

/** How long to wait for Stripe's webhook after a successful checkout before saying so. */
const CONFIRM_ATTEMPTS = 10
const CONFIRM_INTERVAL_MS = 2000

export default function Membership() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const { membership, loaded, fetch } = useMembershipStore()
  const isMember = useMembershipStore(selectIsMember)
  const { plans: config, error } = usePlans()
  const checkout = params.get('checkout')
  const [confirming, setConfirming] = useState(checkout === 'success')

  // Back from Checkout: the webhook grants membership, usually within seconds. Poll until it lands.
  useEffect(() => {
    if (checkout !== 'success' || !user) return
    let cancelled = false
    ;(async () => {
      for (let i = 0; i < CONFIRM_ATTEMPTS && !cancelled; i++) {
        const m = await fetch(user.id)
        if (m.tier === 'member') break
        await new Promise((r) => setTimeout(r, CONFIRM_INTERVAL_MS))
      }
      if (!cancelled) setConfirming(false)
    })()
    return () => {
      cancelled = true
    }
  }, [checkout, user, fetch])

  const renews = membership?.currentPeriodEnd ? new Date(membership.currentPeriodEnd).toLocaleDateString() : null

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-heading text-glow-magenta">Season Pass</h1>
        <p className="text-muted-foreground">Quests are free. The voyage is on the pass.</p>
      </div>

      {checkout === 'cancelled' && (
        <HoloCard glow="none" corners={false} className="mb-6 p-4 text-sm text-muted-foreground">
          Checkout cancelled. Nothing was charged.
        </HoloCard>
      )}

      {confirming && (
        <HoloCard glow="cyan" className="mb-6 flex items-center gap-3 p-4 text-sm">
          <Loader2 className="size-4 animate-spin text-primary" /> Confirming your payment with Stripe…
        </HoloCard>
      )}
      {checkout === 'success' && !confirming && !isMember && (
        <HoloCard glow="none" corners={false} className="mb-6 p-4 text-sm text-warning">
          Payment received, but your Season Pass hasn't come through yet. Refresh in a minute. If it still hasn't, get in touch and we'll sort it.
        </HoloCard>
      )}

      {!loaded ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : isMember ? (
        <HoloCard glow="magenta" className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <Crown className="size-8 text-secondary" />
            <div>
              <p className="text-xl font-heading font-bold">Season Pass active</p>
              <p className="text-sm text-muted-foreground">
                {membership?.billingStatus === 'trialing' && renews ? `Free trial until ${renews}. ` : null}
                {membership?.billingStatus === 'past_due' ? 'Your last payment failed. Update your card to keep your place. ' : null}
                {membership?.cancelAtPeriodEnd && renews ? `Ends ${renews}.` : renews ? `Renews ${renews}.` : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Back to the expedition
            </Link>
            {membership?.source === 'app_store' ? (
              isNative() ? <ManageBillingButton /> : <p className="self-center text-xs text-muted-foreground">Billed by Apple. Manage it on your iPhone: Settings, your name, Subscriptions.</p>
            ) : (
              membership?.hasBillingAccount && <ManageBillingButton />
            )}
          </div>
        </HoloCard>
      ) : (
        <HoloCard glow="cyan" className="space-y-6 p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-bold" />
                <th className="w-14 pb-2 text-center font-bold">Free</th>
                <th className="w-14 pb-2 text-center font-bold text-secondary">Pass</th>
              </tr>
            </thead>
            <tbody>
              {TRACKS.map((t) => (
                <tr key={t.label} className="border-t border-border">
                  <td className="py-3 pr-2 font-medium">{t.label}</td>
                  <td className="text-center">{t.free ? <Check className="mx-auto size-5 text-success" /> : <span className="text-muted-foreground">–</span>}</td>
                  <td className="text-center">
                    <Check className="mx-auto size-5 text-secondary" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {error ? (
            <p className="text-sm text-destructive">Couldn't load prices: {error}</p>
          ) : !config ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : !config.configured || config.plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">The Season Pass opens soon.</p>
          ) : (
            <div className="space-y-3">
              {config.trialDays > 0 && !membership?.hasBillingAccount && (
                <p className="text-sm text-primary">{config.trialDays}-day free trial. Cancel any time before it ends and you won't be charged.</p>
              )}
              <div className="flex flex-wrap gap-3">
                {config.plans.map((p, i) => (
                  <UpgradeButton key={p.plan} plan={p.plan} variant={i === 0 ? undefined : 'outline'}>
                    {p.plan === 'annual' ? 'Annual' : 'Monthly'}, {p.label}
                  </UpgradeButton>
                ))}
              </div>
              {membership?.hasBillingAccount && <ManageBillingButton />}
            </div>
          )}

          {config?.store === 'app_store' && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Payment is charged to your Apple ID at confirmation. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the
              current period, and your account is charged for renewal within 24 hours before it ends. Manage or cancel in Settings, your name, Subscriptions.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <RestorePurchasesButton />
            <Link to="/terms" className="text-muted-foreground hover:text-primary">Terms</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary">Privacy</Link>
          </div>
        </HoloCard>
      )}
    </div>
  )
}
