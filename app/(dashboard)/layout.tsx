import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { getAdminState } from "@/lib/admin";
import { lock } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  const admin = await getAdminState();
  return <div className="min-h-screen lg:flex">
    <Sidebar/>
    <main className="min-w-0 flex-1">
      <header className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4 lg:px-8">
        <div><p className="text-xs text-white/35">NeoPeptis</p><p className="text-sm font-medium">Commerce analytics</p></div>
        {admin.unlocked ? <div className="flex items-center gap-2">
          <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">Privé déverrouillé</span>
          <form action={lock}><button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55">Verrouiller</button></form>
        </div> : <Link href="/admin" className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Déverrouiller privé</Link>}
      </header>
      <div className="p-5 lg:p-8">{children}</div>
    </main>
  </div>;
}
