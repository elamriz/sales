import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { eur } from "@/lib/dashboard";
import { loadPrivateContacts } from "@/lib/admin";
import { StatCard } from "@/components/stat-card";

export default async function Customers(){
  const s=await createClient();
  const [{data},privateData]=await Promise.all([
    s.from("customers").select("id,display_name,first_seen_at,last_seen_at,first_order_at,last_order_at,sales_episodes(id,total,refund_amount,classification,revenue_eligible,ordered_at)").order("last_seen_at",{ascending:false}).limit(200),
    loadPrivateContacts(),
  ]);
  const contactMap=new Map((privateData.contacts||[]).map((c:any)=>[c.customer_id,c.phone_e164||c.whatsapp_number]));
  const rows=(data||[]).map((c:any)=>{const orders=(c.sales_episodes||[]).filter((o:any)=>o.classification==="confirmed"&&o.revenue_eligible&&o.total!=null);const ca=orders.reduce((n:number,o:any)=>n+Math.max(Number(o.total)-Number(o.refund_amount||0),0),0);return {...c,orders:orders.length,ca,aov:orders.length?ca/orders.length:0,status:orders.length>=5?"VIP":orders.length>1?"Récurrent":"Nouveau",phone:contactMap.get(c.id)||null};});
  const withPhone=rows.filter((c:any)=>c.phone).length;

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[.18em] text-violet-300">Customers</p><h1 className="mt-1 text-3xl font-semibold">Clients</h1><p className="mt-2 text-sm text-white/40">Noms, historique d’achat et téléphone privé lorsqu’il est disponible.</p></div>{!privateData.unlocked&&<Link href="/admin" className="rounded-xl border border-amber-400/15 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Déverrouiller les numéros</Link>}</div>

    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Clients" value={String(rows.length)}/>
      <StatCard label="Contacts privés visibles" value={privateData.unlocked?String(withPhone):"🔒"}/>
      <StatCard label="Couverture téléphone" value={privateData.unlocked&&rows.length?`${((withPhone/rows.length)*100).toFixed(1)} %`:"Privé"}/>
      <StatCard label="Clients récurrents" value={String(rows.filter((c:any)=>c.orders>1).length)}/>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((c:any)=>{
      const wa=c.phone?String(c.phone).replace(/\D/g,""):null;
      return <article key={c.id} className="panel rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-medium">{c.display_name||"Client"}</h2><p className="mt-1 text-xs text-white/35">{c.status}</p>{privateData.unlocked?<div className="mt-2">{c.phone?<a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-300 hover:underline">{c.phone}</a>:<span className="text-xs text-white/30">Numéro non disponible</span>}</div>:<Link href="/admin" className="mt-2 inline-block text-xs text-amber-200/70 hover:text-amber-200">🔒 Téléphone privé</Link>}</div><span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-xs text-white/45">{c.orders} commandes</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-white/35">LTV confirmée</p><p className="mt-1 font-medium">{eur(c.ca)}</p></div><div><p className="text-xs text-white/35">Panier moyen</p><p className="mt-1 font-medium">{eur(c.aov)}</p></div><div><p className="text-xs text-white/35">Première commande</p><p className="mt-1 text-white/60">{c.first_order_at?new Date(c.first_order_at).toLocaleDateString("fr-BE"):"—"}</p></div><div><p className="text-xs text-white/35">Dernière commande</p><p className="mt-1 text-white/60">{c.last_order_at?new Date(c.last_order_at).toLocaleDateString("fr-BE"):"—"}</p></div></div>
      </article>})}{!rows.length&&<div className="panel rounded-2xl p-8 text-sm text-white/35">Aucun client structuré dans la base dédiée.</div>}</div>
  </div>;
}
