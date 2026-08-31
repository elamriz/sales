import Link from "next/link";
import { getAdminState } from "@/lib/admin";
import { lock, unlock } from "./actions";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const state = await getAdminState();

  return <main className="min-h-screen grid place-items-center p-6">
    <section className="panel w-full max-w-md rounded-3xl p-7">
      <p className="text-xs uppercase tracking-[.22em] text-violet-300">Accès privé</p>
      <h1 className="mt-2 text-2xl font-semibold">Données sensibles & validations</h1>
      <p className="mt-2 text-sm leading-6 text-white/45">Le code privé permet d’afficher les numéros clients et d’effectuer les validations manuelles. Les données commerciales publiques de test restent séparées.</p>

      {state.unlocked ? <div className="mt-6">
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-200">Mode privé déverrouillé.</div>
        <div className="mt-4 flex gap-2">
          <Link href="/customers" className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-medium text-black">Voir les clients</Link>
          <form action={lock}><button className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60">Verrouiller</button></form>
        </div>
      </div> : <form action={unlock} className="mt-6">
        {params.error && <p className="mb-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">Code incorrect.</p>}
        <label className="text-xs text-white/50">Code privé</label>
        <input name="code" type="password" required autoComplete="off" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 outline-none focus:border-violet-400/50" />
        <button className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 font-medium text-black hover:bg-white/90">Déverrouiller</button>
      </form>}

      <Link href="/overview" className="mt-5 block text-center text-xs text-white/35 hover:text-white/60">Retour au dashboard</Link>
    </section>
  </main>;
}
