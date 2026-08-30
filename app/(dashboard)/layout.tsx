import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  return <div className="min-h-screen lg:flex"><Sidebar/><main className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-white/8 px-5 py-4 lg:px-8"><div><p className="text-xs text-white/35">NeoPeptis</p><p className="text-sm font-medium">Commerce analytics</p></div><span className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Mode test</span></header><div className="p-5 lg:p-8">{children}</div></main></div>;
}
