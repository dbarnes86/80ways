/** Build-time configuration. Vite inlines VITE_* at build, so these are fixed per deploy. */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  /** Sign in with Apple, once the provider is configured in Supabase Auth. */
  appleAuth: import.meta.env.VITE_AUTH_APPLE === 'true',
}
