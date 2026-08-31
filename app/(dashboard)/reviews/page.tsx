import Link from "next/link";
import { loadReviews, eur, paymentMethodLabel } from "@/lib/dashboard";
import { getAdminState } from "@/lib/admin";
import { approveNoRevenue, approveRevenue, reject, saveAmount } from "./actions";

export default async function Reviews(){
  const [rows,admin]=await Promise.all([loadReviews(),getAdminState()]);
  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[.18em] text-amber-300">Reviews</p><h1 className="mt-1 text-3xl font-semibold">À valider</h1><p className="mt-2 text-sm text-white/40">Tu peux maintenant corriger le montant, l’enregistrer, puis décider s’il entre ou non dans le CA.</p></div>
      <span className="rounded-full border border-white/8 bg-white/[.03] px-3 py-1.5 text-xs text-white/50">{rows.length} en attente</span>
    </div>

    {!admin.unlocked && <div className="mb-5 rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4 text-sm text-amber-100">Les décisions manuelles sont verrouillées. <Link href="/admin" className="font-semibold underline">Déverrouiller le mode privé</Link> pour éditer et valider.</div>}

    <div className="grid gap-4">{rows.map((r:any)=><article key={r.id} className="panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium">{r.customers?.display_name||"Client"}</p>
          <p className="mt-1 text-xs text-white/35">{r.ordered_at?new Date(r.ordered_at).toLocaleString("fr-BE"):"Date incertaine"} · confiance {Math.round(Number(r.confidence)*100)}%</p>
          <p className="mt-1 text-xs text-white/35">{r.order_items?.map((i:any)=>`${i.quantity||"?"}× ${i.product_name}`).join(", ")||"Produit non structuré"} · {paymentMethodLabel(r.payment_method)}</p>
        </div>
        <p className="text-lg font-semibold">{r.total==null?"Montant incertain":eur(Number(r.total))}</p>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/60">{r.analysis_summary}</p>
      {r.review?.reason && <div className="mt-3 rounded-xl border border-amber-400/10 bg-amber-400/[.05] p-3 text-sm text-amber-100/70"><span className="font-medium">Raison :</span> {r.review.reason}</div>}
      {r.review?.review_note && <div className="mt-3 rounded-xl bg-black/20 p-3 text-xs leading-5 text-white/45"><span className="font-medium text-white/60">Audit :</span> {r.review.review_note}</div>}
      <details className="mt-3"><summary className="cursor-pointer text-xs text-white/35">Voir l’incertitude structurée</summary><pre className="mt-2 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-white/40">{JSON.stringify(r.uncertainty||{},null,2)}</pre></details>

      <form className="mt-5 grid gap-3" action={saveAmount}>
        <input type="hidden" name="id" value={r.id}/>
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <label className="block"><span className="text-xs text-white/45">Montant final (€)</span><input name="amount" inputMode="decimal" type="number" min="0" step="0.01" defaultValue={r.total??""} placeholder="Ex. 95.00" disabled={!admin.unlocked} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none disabled:opacity-40 focus:border-violet-400/50"/></label>
          <label className="block"><span className="text-xs text-white/45">Note manuelle (optionnel)</span><input name="note" type="text" disabled={!admin.unlocked} placeholder="Pourquoi tu valides / rejettes" className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none disabled:opacity-40 focus:border-violet-400/50"/></label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!admin.unlocked} formAction={saveAmount} className="rounded-lg border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-40">Enregistrer montant</button>
          <button disabled={!admin.unlocked} formAction={approveRevenue} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">Valider + CA</button>
          <button disabled={!admin.unlocked} formAction={approveNoRevenue} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-40">Confirmer hors CA</button>
          <button disabled={!admin.unlocked} formAction={reject} className="rounded-lg border border-red-400/15 bg-red-400/[.06] px-3 py-2 text-xs text-red-200 disabled:opacity-40">Rejeter</button>
        </div>
      </form>
    </article>)}{!rows.length&&<div className="panel rounded-2xl p-8 text-center text-sm text-white/35">Aucune validation en attente.</div>}</div>
  </div>;
}
