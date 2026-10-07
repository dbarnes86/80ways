import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Membership {
  tier: 'free' | 'member'
  billingStatus: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  hasBillingAccount: boolean
}

interface MembershipStore {
  membership: Membership | null
  loaded: boolean
  fetch: (userId: string) => Promise<Membership>
  reset: () => void
}

const FREE: Membership = { tier: 'free', billingStatus: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, hasBillingAccount: false }

/**
 * The player's entitlement, read from the row the Stripe webhook writes. Display only:
 * the database enforces membership itself, so a stale value here can't unlock anything.
 */
export const useMembershipStore = create<MembershipStore>((set) => ({
  membership: null,
  loaded: false,

  fetch: async (userId) => {
    const { data, error } = await supabase.from('entitlements').select('*').eq('user_id', userId).maybeSingle()
    if (error) console.warn('Membership unavailable:', error.message)
    const membership: Membership = data
      ? {
          tier: data.tier === 'member' ? 'member' : 'free',
          billingStatus: data.billing_status,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end,
          hasBillingAccount: !!data.stripe_customer_id,
        }
      : FREE
    set({ membership, loaded: true })
    return membership
  },

  reset: () => set({ membership: null, loaded: false }),
}))

export const selectIsMember = (s: MembershipStore) => s.membership?.tier === 'member'
