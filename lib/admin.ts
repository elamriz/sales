import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_COOKIE = "sales_admin_code";

export async function getAdminCode() {
  return (await cookies()).get(ADMIN_COOKIE)?.value || null;
}

export async function getAdminState() {
  const code = await getAdminCode();
  if (!code) return { unlocked: false, code: null as string | null };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_dashboard_admin", { p_code: code });
  if (error || !data) return { unlocked: false, code: null as string | null };
  return { unlocked: true, code };
}

export async function requireAdminCode() {
  const state = await getAdminState();
  if (!state.unlocked || !state.code) throw new Error("ADMIN_LOCKED");
  return state.code;
}

export async function loadPrivateContacts() {
  const state = await getAdminState();
  if (!state.unlocked || !state.code) return { unlocked: false, contacts: [] as any[] };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_customer_private_contacts", { p_code: state.code });
  if (error) return { unlocked: false, contacts: [] as any[] };
  return { unlocked: true, contacts: (data || []) as any[] };
}
