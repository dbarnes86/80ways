/**
 * In-app account deletion (App Store guideline 5.1.1(v)).
 *
 * Deletes the signed-in player's game data and then the auth user. Tables with a foreign key to
 * auth.users cascade; the older game tables keyed only by user_id are cleared explicitly first.
 * A store subscription is not cancelled by this: the app tells the player to cancel it with Apple
 * or Stripe, which is the only place that can.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405)

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return reply({ error: 'unauthenticated' }, 401)

  for (const table of ['energy_deployments', 'season_participation', 'player_progression', 'raid_contributions', 'activities', 'entitlements', 'profiles']) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id)
    if (error) {
      console.error('delete-account: failed on', table, error.message)
      return reply({ error: 'delete_failed' }, 500)
    }
  }
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('delete-account: auth delete failed', error.message)
    return reply({ error: 'delete_failed' }, 500)
  }
  return reply({ deleted: true })
})
