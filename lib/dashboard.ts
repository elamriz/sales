import { createClient } from "@/lib/supabase/server";

export type RangeKey = "7d"|"30d"|"3m"|"year"|"all";
export function rangeStart(range: RangeKey) { const d=new Date(); if(range==="all") return null; if(range==="7d") d.setDate(d.getDate()-7); if(range==="30d") d.setDate(d.getDate()-30); if(range==="3m") d.setMonth(d.getMonth()-3); if(range==="year") d.setMonth(0,1); return d.toISOString(); }
export const eur=(n:number)=>new Intl.NumberFormat("fr-BE",{style:"currency",currency:"EUR"}).format(n);

export function paymentMethodLabel(method: unknown) {
  const raw=String(method??"").trim();
  const m=raw.toLowerCase();
  if(!m) return "Inconnu";
  if(m.includes("vinted")) return "Vinted";
  if(m==="cash"||m.includes("espèce")||m.includes("espece")) return "Cash";
  if(m==="bank_transfer"||m.includes("bank transfer")||m.includes("virement")||m.includes("transfer")) return "Virement";
  if(m.includes("payment_link")||m.includes("payment link")||m.includes("apple pay")||m.includes("card /")) return "Lien de paiement";
  if(m.includes("paypal")) return "PayPal";
  if(m.includes("lydia")) return "Lydia";
  if(m.includes("western")) return "Western Union";
  if(m==="revolut") return "Revolut (à préciser)";
  return raw;
}

export async function loadOverview(range: RangeKey) {
  const supabase=await createClient(); const start=rangeStart(range);
  let q=supabase.from("sales_episodes").select("id,customer_id,ordered_at,total,refund_amount,classification,revenue_eligible,review_required,status").neq("status","not_sale").order("ordered_at");
  if(start) q=q.gte("ordered_at",start);
  const {data,error}=await q; if(error) throw error; const rows=data||[];
  const confirmedRows=rows.filter((r:any)=>r.classification==="confirmed"&&r.revenue_eligible&&r.total!=null);
  const confirmed=confirmedRows.reduce((s:number,r:any)=>s+Math.max(Number(r.total)-Number(r.refund_amount||0),0),0);
  const potential=rows.filter((r:any)=>r.classification==="probable"&&r.total!=null).reduce((s:number,r:any)=>s+Number(r.total),0);
  const byCustomer=new Map<string,number>(); confirmedRows.forEach((r:any)=>r.customer_id&&byCustomer.set(r.customer_id,(byCustomer.get(r.customer_id)||0)+1));
  const repeat=[...byCustomer.values()].filter(v=>v>1).length; const unique=byCustomer.size;
  const map=new Map<string,{date:string,confirmed:number,potential:number}>(); rows.forEach((r:any)=>{ if(!r.ordered_at)return; const date=String(r.ordered_at).slice(0,10); const x=map.get(date)||{date,confirmed:0,potential:0}; if(r.classification==="confirmed"&&r.revenue_eligible&&r.total!=null)x.confirmed+=Math.max(Number(r.total)-Number(r.refund_amount||0),0); if(r.classification==="probable"&&r.total!=null)x.potential+=Number(r.total); map.set(date,x); });
  return { confirmed,potential,confirmedOrders:confirmedRows.length,reviews:rows.filter((r:any)=>r.review_required||r.classification==="probable").length,aov:confirmedRows.length?confirmed/confirmedRows.length:0,unique,repeat,repurchaseRate:unique?repeat/unique:0,chart:[...map.values()] };
}

export async function loadEpisodes(limit=100) { const supabase=await createClient(); const {data,error}=await supabase.from("sales_episodes").select("id,ordered_at,total,currency,payment_method,payment_status,status,classification,confidence,revenue_eligible,analysis_summary,customers(display_name),order_items(product_name,quantity)").order("ordered_at",{ascending:false}).limit(limit); if(error) throw error; return data||[]; }
export async function loadReviews() { const supabase=await createClient(); const {data,error}=await supabase.from("sales_episodes").select("id,ordered_at,total,confidence,analysis_summary,uncertainty,customers(display_name)").or("classification.eq.probable,review_required.eq.true").order("ordered_at",{ascending:false}); if(error) throw error; return data||[]; }
export async function loadTable(table:string, columns:string) { const supabase=await createClient(); const {data,error}=await supabase.from(table).select(columns).limit(200); if(error) throw error; return data||[]; }
