/**
 * Sign in with Apple. On the iPhone it's the native sheet (AppleSignInPlugin in the iOS target)
 * and Supabase checks Apple's token; on the web it's Supabase's Apple OAuth redirect.
 */
import { registerPlugin } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { isNativeApp } from '@/lib/native';

interface AppleSignInPlugin {
  signIn(options: { nonce: string }): Promise<{ idToken: string; givenName: string; fullName: string; email: string }>;
}

const AppleSignIn = registerPlugin<AppleSignInPlugin>('AppleSignIn');

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');

export type AppleResult = { ok: true } | { ok: false; cancelled?: boolean; message: string };

export async function signInWithApple(): Promise<AppleResult> {
  if (!isNativeApp()) {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}/dashboard` } });
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  // Apple gets the hash; Supabase gets the raw value and checks they match.
  const raw = hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const hashed = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)));

  let apple: Awaited<ReturnType<AppleSignInPlugin['signIn']>>;
  try {
    apple = await AppleSignIn.signIn({ nonce: hashed });
  } catch (e) {
    const code = (e as { code?: string }).code;
    return { ok: false, cancelled: code === 'CANCELLED', message: e instanceof Error ? e.message : String(e) };
  }

  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: apple.idToken, nonce: raw });
  if (error || !data.user) return { ok: false, message: error?.message ?? 'Sign in failed.' };

  await nameNewPlayer(data.user.id, apple.givenName || apple.fullName);
  return { ok: true };
}

/**
 * Apple shares a name only on the very first sign-in, and the email is often a private relay
 * address, which makes a poor leaderboard name. Use the first name, or a friendly placeholder the
 * player can change in Profile.
 */
async function nameNewPlayer(userId: string, appleName: string) {
  const { data } = await supabase.from('profiles').select('display_name').eq('user_id', userId).maybeSingle();
  const current = data?.display_name ?? '';
  const isPlaceholder = !current || current.includes('@');
  if (!isPlaceholder) return;

  const name = appleName.trim() || `Explorer ${userId.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
  await supabase.from('profiles').upsert({ user_id: userId, display_name: name }, { onConflict: 'user_id' });
  await supabase.auth.updateUser({ data: { display_name: name } });
}
