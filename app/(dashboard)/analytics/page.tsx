import { RevenueChart } from "@/components/revenue-chart";
import { PaymentShareChart, ProductVolumeChart } from "@/components/analytics-charts";
import { StatCard } from "@/components/stat-card";
import { eur,loadOverview,paymentMethodLabel } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function Analytics(){
  const x=await loadOverview("all");
  const s=await createClient();
  const [{data:orders},{data:items}]=await Promise.all([
    s.from("sales_episodes").select("customer_id,ordered_at,total,refund_amount,classification,revenue_eligible,payment_method").eq("classification","confirmed").eq("revenue_eligible",true).order("ordered_at"),
    s.from("order_items").select("product_name,quantity,sales_episodes!inner(classification,revenue_eligible)").eq("sales_episodes.classification","confirmed").eq("sales_episodes.revenue_eligible",true),
  ]);

  const byCustomer=new Map<string,Date[]>();
  const byPayment=new Map<string,{orders:number,revenue:number}>();
  for(const o of (orders||[]) as any[]){
    if(o.customer_id&&o.ordered_at){const a=byCustomer.get(o.customer_id)||[];a.push(new Date(o.ordered_at));byCustomer.set(o.customer_id,a);}
    if(o.total!=null){const label=paymentMethodLabel(o.payment_method);const p=byPayment.get(label)||{orders:0,revenue:0};p.orders+=1;p.revenue+=Math.max(Number(o.total)-Number(o.refund_amount||0),0);byPayment.set(label,p);}
  }

  const delays:number[]=[];
  for(const a of byCustomer.values()){a.sort((a,b)=>+a-+b);if(a.length>1)delays.push((+a[1]-+a[0])/86400000);}
  const avgDelay=delays.length?delays.reduce((a,b)=>a+b,0)/delays.length:0;
  const distribution=new Map<number,number>();
  for(const a of byCustomer.values())distribution.set(a.length,(distribution.get(a.length)||0)+1);
  const paymentRows=[...byPayment.entries()].map(([method,v])=>({method,...v,share:x.confirmed?v.revenue/x.confirmed:0})).sort((a,b)=>b.revenue-a.revenue);
  const unknown=paymentRows.find(p=>p.method==="Inconnu");
  const topPayment=paymentRows[0];

  const byProduct=new Map<string,number>();
  for(const item of (items||[]) as any[]){if(!item.product_name)continue;byProduct.set(item.product_name,(byProduct.get(item.product_name)||0)+Number(item.quantity||0));}
  const productRows=[...byProduct.entries()].map(([name,quantity])=>({name,quantity})).sort((a,b)=>b.quantity-a.quantity).slice(0,10);

  return <div className="space-y-6">
    <div><p className="text-xs uppercase tracking-[.18em] text-violet-300">Analytics</p><h1 className="mt-1 text-3xl font-semibold">Analyse commerciale</h1><p className="mt-2 text-sm text-white/40">CA, clients, paiements et produits. Les chiffres utilisent uniquement les ventes confirmées éligibles lorsqu’il s’agit de revenu.</p></div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="CA historique confirmé" value={eur(x.confirmed)}/>
      <StatCard label="Ventes confirmées" value={String(x.confirmedOrders)}/>
      <StatCard label="Panier moyen" value={eur(x.aov)}/>
      <StatCard label="Taux de réachat" value={`${(x.repurchaseRate*100).toFixed(1)} %`}/>
      <StatCard label="Reviews encore ouvertes" value={String(x.reviews)}/>
      <StatCard label="CA paiement inconnu" value={eur(unknown?.revenue||0)} hint={`${((unknown?.share||0)*100).toFixed(1)} % du CA`}/>
      <StatCard label="1er moyen de paiement" value={topPayment?.method||"—"} hint={topPayment?`${(topPayment.share*100).toFixed(1)} % du CA`:undefined}/>
      <StatCard label="Délai moyen avant 2e commande" value={delays.length?`${avgDelay.toFixed(1)} jours`:"—"}/>
    </div>

    <section className="panel rounded-2xl p-5"><h2 className="font-medium">CA par jour</h2><p className="mt-1 text-xs text-white/35">Le potentiel reste visuellement et comptablement séparé.</p><div className="mt-4"><RevenueChart data={x.chart}/></div></section>

    <section className="panel rounded-2xl p-5"><h2 className="font-medium">Parts par moyen de paiement</h2><p className="mt-1 text-xs text-white/35">À gauche, répartition du CA. À droite, nombre de commandes. Une tarte et des barres, parce que même les chiffres finissent par réclamer de la décoration.</p><div className="mt-4"><PaymentShareChart data={paymentRows}/></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-white/8 text-xs text-white/35"><tr><th className="px-3 py-3 font-medium">Méthode</th><th className="px-3 py-3 font-medium">Commandes</th><th className="px-3 py-3 font-medium">CA</th><th className="px-3 py-3 font-medium">Part du CA</th></tr></thead><tbody>{paymentRows.map(p=><tr key={p.method} className="border-b border-white/5"><td className="px-3 py-3 font-medium">{p.method}</td><td className="px-3 py-3 text-white/60">{p.orders}</td><td className="px-3 py-3">{eur(p.revenue)}</td><td className="px-3 py-3 text-white/60">{(p.share*100).toFixed(1)} %</td></tr>)}</tbody></table></div></section>

    <section className="panel rounded-2xl p-5"><h2 className="font-medium">Top produits par volume</h2><p className="mt-1 text-xs text-white/35">Quantités structurées sur les ventes confirmées qui entrent au CA.</p><div className="mt-4">{productRows.length?<ProductVolumeChart data={productRows}/>:<p className="py-10 text-center text-sm text-white/35">Pas assez de quantités structurées.</p>}</div></section>

    <section className="panel rounded-2xl p-5"><h2 className="font-medium">Distribution des commandes par client</h2><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[...distribution.entries()].sort((a,b)=>a[0]-b[0]).map(([count,customers])=><div key={count} className="rounded-xl border border-white/7 bg-white/[.02] p-4"><p className="text-2xl font-semibold">{customers}</p><p className="mt-1 text-xs text-white/40">clients avec {count} commande{count>1?"s":""}</p></div>)}</div></section>

    <section className="panel rounded-2xl p-5"><h2 className="font-medium">Taux de conversion</h2><p className="mt-2 text-sm leading-6 text-white/45">Non publié tant que tous les chats n’ont pas reçu un <code>chat_kind</code> fiable. Les broadcasts, tests et conversations non commerciales doivent être exclus avant de produire ce ratio.</p></section>
  </div>;
}
