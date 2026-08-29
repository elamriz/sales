export function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="panel rounded-2xl p-5"><p className="text-xs text-white/40">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>{note && <p className="mt-2 text-xs text-white/35">{note}</p>}</div>;
}
