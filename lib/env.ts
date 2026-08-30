const TEST_SUPABASE_URL = "https://yufiknfqnuqlyrpxzamz.supabase.co";
const TEST_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ZxSs8Zu-nQj5Ahi3h4eE0g_fNZXJLFQ";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || TEST_SUPABASE_URL;
}

export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || TEST_SUPABASE_PUBLISHABLE_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
