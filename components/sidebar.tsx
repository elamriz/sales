import Link from "next/link";
import { BarChart3, Boxes, ChartNoAxesCombined, CircleDollarSign, ClipboardCheck, LayoutDashboard, PackageSearch, RefreshCcw, Users } from "lucide-react";

const links = [
  ["Overview","/overview",LayoutDashboard], ["Sales","/sales",CircleDollarSign], ["Reviews","/reviews",ClipboardCheck],
  ["Customers","/customers",Users], ["Products","/products",Boxes], ["Stock","/stock",PackageSearch],
  ["Follow-ups","/followups",RefreshCcw], ["Analytics","/analytics",ChartNoAxesCombined],
] as const;

export function Sidebar() {
  return <aside className="border-b border-white/8 bg-black/15 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r"><div className="flex items-center gap-3 px-5 py-5"><div className="grid size-9 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><BarChart3 size={18}/></div><div><div className="text-sm font-semibold">Sales Intelligence</div><div className="text-[11px] text-white/35">WhatsApp audit layer</div></div></div><nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1">{links.map(([label,href,Icon]) => <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"><Icon size={16}/><span>{label}</span></Link>)}</nav></aside>;
}
