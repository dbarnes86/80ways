import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { env } from './env'

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. Copy .env.example to .env.local.')
}

/** One client per page. Sessions persist in the browser and refresh themselves. */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
