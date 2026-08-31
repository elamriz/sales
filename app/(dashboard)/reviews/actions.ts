"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminState } from "@/lib/admin";

async function adminCode() {
  const state = await getAdminState();
  if (!state.unlocked || !state.code) redirect("/admin");
  return state.code;
}

function amountFrom(formData: FormData) {
  const raw = String(formData.get("amount") || "").replace(",", ".").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error("Montant invalide");
  return n;
}

async function refresh() {
  revalidatePath("/reviews");
  revalidatePath("/overview");
  revalidatePath("/sales");
  revalidatePath("/analytics");
  revalidatePath("/customers");
}

export async function saveAmount(formData: FormData) {
  const code = await adminCode();
  const id = String(formData.get("id") || "");
  const amount = amountFrom(formData);
  if (amount == null) throw new Error("Montant requis");
  const s = await createClient();
  const { error } = await s.rpc("admin_set_review_amount", { p_code: code, p_episode_id: id, p_amount: amount });
  if (error) throw error;
  await refresh();
}

async function resolve(formData: FormData, action: "approve_revenue"|"approve_no_revenue"|"reject") {
  const code = await adminCode();
  const id = String(formData.get("id") || "");
  const amount = amountFrom(formData);
  const note = String(formData.get("note") || "").trim() || null;
  if (action === "approve_revenue" && amount == null) throw new Error("Indique un montant avant de valider dans le CA");
  const s = await createClient();
  const { error } = await s.rpc("admin_resolve_review", {
    p_code: code,
    p_episode_id: id,
    p_action: action,
    p_amount: amount,
    p_note: note,
  });
  if (error) throw error;
  await refresh();
}

export async function approveRevenue(formData: FormData) { await resolve(formData, "approve_revenue"); }
export async function approveNoRevenue(formData: FormData) { await resolve(formData, "approve_no_revenue"); }
export async function reject(formData: FormData) { await resolve(formData, "reject"); }
