"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_COOKIE } from "@/lib/admin";

export async function unlock(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_dashboard_admin", { p_code: code });
  if (error || !data) redirect("/admin?error=1");

  (await cookies()).set(ADMIN_COOKIE, code, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/customers");
}

export async function lock() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/overview");
}
