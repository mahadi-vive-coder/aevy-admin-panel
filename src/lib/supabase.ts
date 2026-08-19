import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'aevy_supabase_url';
const STORAGE_KEY_ANON = 'aevy_supabase_anon_key';

// Default project configuration
const DEFAULT_SUPABASE_URL = 'https://ypixntqllgqjzcoyafix.supabase.co';
const DEFAULT_SUPABASE_ANON = 'sb_publishable_RgtrxBhQTFhcoPX8roM0rg_ZZ0f_sNH';

// Declare a single global variable on globalThis to guarantee exactly ONE GoTrueClient
declare global {
  // eslint-disable-next-line no-var
  var __AEVY_SUPABASE_SINGLETON__: SupabaseClient | null | undefined;
  // eslint-disable-next-line no-var
  var __AEVY_SUPABASE_SINGLETON_CONFIG__: { url: string; anonKey: string } | undefined;
}

export function getStoredSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
  const savedAnon = localStorage.getItem(STORAGE_KEY_ANON);

  const url = savedUrl || (envUrl && !envUrl.includes('your-project-id') ? envUrl : DEFAULT_SUPABASE_URL);
  const anonKey =
  savedAnon ||
  (envAnon && !envAnon.includes('your-anon-public-key')
    ? envAnon
    : DEFAULT_SUPABASE_ANON);

  const isConfigured = Boolean(url && anonKey && url.startsWith('https://'));

  return {
    url,
    anonKey,
    isConfigured,
  };
}

export function getSupabase(): SupabaseClient | null {
  const cfg = getStoredSupabaseConfig();
  if (!cfg.isConfigured) {
    return null;
  }

  // Reuse existing singleton if configuration has not changed
  if (
    globalThis.__AEVY_SUPABASE_SINGLETON__ &&
    globalThis.__AEVY_SUPABASE_SINGLETON_CONFIG__?.url === cfg.url &&
    globalThis.__AEVY_SUPABASE_SINGLETON_CONFIG__?.anonKey === cfg.anonKey
  ) {
    return globalThis.__AEVY_SUPABASE_SINGLETON__;
  }

  try {
    const client = createClient(cfg.url, cfg.anonKey, {
      auth: {
        storageKey: 'aevy_admin_auth_token_v1',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    globalThis.__AEVY_SUPABASE_SINGLETON__ = client;
    globalThis.__AEVY_SUPABASE_SINGLETON_CONFIG__ = { url: cfg.url, anonKey: cfg.anonKey };
    return client;
  } catch (err) {
    console.error('Error initializing Supabase singleton:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  const trimmedUrl = url.trim();
  const trimmedAnon = anonKey.trim();

  localStorage.setItem(STORAGE_KEY_URL, trimmedUrl);
  localStorage.setItem(STORAGE_KEY_ANON, trimmedAnon);

  // If already matches, keep instance
  if (
    globalThis.__AEVY_SUPABASE_SINGLETON__ &&
    globalThis.__AEVY_SUPABASE_SINGLETON_CONFIG__?.url === trimmedUrl &&
    globalThis.__AEVY_SUPABASE_SINGLETON_CONFIG__?.anonKey === trimmedAnon
  ) {
    return;
  }

  // Otherwise reset singleton to reinitialize with new credentials on next getSupabase()
  globalThis.__AEVY_SUPABASE_SINGLETON__ = null;
  globalThis.__AEVY_SUPABASE_SINGLETON_CONFIG__ = undefined;
  getSupabase();
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  globalThis.__AEVY_SUPABASE_SINGLETON__ = null;
  globalThis.__AEVY_SUPABASE_SINGLETON_CONFIG__ = undefined;
}

export async function uploadProductImageToSupabase(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please configure credentials in Settings.');
  }

  const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    throw new Error(uploadError.message || 'Storage upload failed');
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Failed to retrieve public URL from Supabase Storage');
  }
  return data.publicUrl;
}

export async function deleteProductImageFromSupabase(imageUrl: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !imageUrl || !imageUrl.includes('/product-images/')) {
    return true;
  }

  try {
    const parts = imageUrl.split('/product-images/');
    if (parts.length > 1) {
      const filePath = parts[1].split('?')[0];
      const { error } = await supabase.storage.from('product-images').remove([filePath]);
      if (error) {
        console.warn('Failed to delete image from storage:', error.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('Error deleting image from storage:', err);
    return false;
  }
}
