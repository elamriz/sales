import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";
export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  if(!isSupabaseConfigured()) redirect("/setup");
  const supabase=await createClient(); const {data,error}=await supabase.auth.getClaims(); const sub=data?.claims?.sub;
  if(error||!sub) redirect("/login");
  const {data:access}=await supabase.from("dashboard_users").select("user_id").eq("user_id",sub).maybeSingle();
  if(!access) return <main className="min-h-screen grid place-items-center p-6"><section className="panel max-w-lg rounded-3xl p-8"><h1 className="text-2xl font-semibold">Accès non autorisé</h1><p className="mt-3 text-sm text-white/50">La session existe, mais ce compte n’est pas présent dans <code>dashboard_users</code>.</p><form action={logout}><button className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">Se déconnecter</button></form></section></main>;
  return <div className="min-h-screen lg:flex"><Sidebar/><main className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-white/8 px-5 py-4 lg:px-8"><div><p className="text-xs text-white/35">NeoPeptis</p><p className="text-sm font-medium">Commerce analytics</p></div><form action={logout}><button className="rounded-lg border border-white/8 px-3 py-2 text-xs text-white/55 hover:bg-white/5">Déconnexion</button></form></header><div className="p-5 lg:p-8">{children}</div></main></div>;
}
