import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import type { Favorite } from './favorites';

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_PUBLISHABLE_KEY__: string;

export type CloudFavorite = { signature: string; ids: string[]; grams: Record<string, number>; created_at: string };
export const cloud: SupabaseClient | null = __SUPABASE_URL__ && __SUPABASE_PUBLISHABLE_KEY__ && location.protocol === 'https:'
  ? createClient(__SUPABASE_URL__, __SUPABASE_PUBLISHABLE_KEY__, { auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, storageKey: 'mediterranean-mixer-auth' } })
  : null;

export function onSessionChange(callback: (session: Session | null) => void): void {
  cloud?.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') queueMicrotask(() => callback(session));
  });
}

export async function sendLoginLink(email: string): Promise<void> {
  if (!cloud) throw new Error('云端尚未配置。');
  const redirect = new URL('/mediterranean-meal-mixer/', location.origin).href;
  const { error } = await cloud.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!cloud) return;
  const { error } = await cloud.auth.signOut();
  if (error) throw error;
}

export async function listCloudFavorites(userId: string): Promise<CloudFavorite[]> {
  if (!cloud) throw new Error('云端尚未配置。');
  const { data, error } = await cloud.from('recipe_favorites').select('signature,ids,grams,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as CloudFavorite[];
}

export async function saveCloudFavorite(userId: string, signature: string, favorite: Favorite): Promise<void> {
  if (!cloud) throw new Error('云端尚未配置。');
  const { error } = await cloud.from('recipe_favorites').upsert({ user_id: userId, signature, ids: favorite.ids, grams: favorite.grams }, { onConflict: 'user_id,signature', ignoreDuplicates: true });
  if (error) throw error;
}

export async function deleteCloudFavorite(userId: string, signature: string): Promise<void> {
  if (!cloud) throw new Error('云端尚未配置。');
  const { error } = await cloud.from('recipe_favorites').delete().eq('user_id', userId).eq('signature', signature);
  if (error) throw error;
}
