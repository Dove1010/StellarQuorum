import Link from "next/link";
import { formatDate, formatNumber, t } from "@/lib/i18n";

const HISTORY = [
  { date: "2026-05-14T09:30:00Z", delegator: "GABC...3XZK", delegate: "GDEF...8YPQ", amount: 150000, status: "Active" },
  { date: "2026-04-02T12:00:00Z", delegator: "GABC...3XZK", delegate: "GHIJ...2WNM", amount: 75000, status: "Revoked" },
];

export default function DelegationPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">← Quorum</Link>
      <h1 className="mt-6 text-3xl font-bold text-white">Delegation history</h1>
      <p className="mt-2 text-slate-400">Review delegation changes recorded by the governance client.</p>
      <div className="mt-8 overflow-x-auto rounded-xl border border-[#1a2535] bg-[#0d1520]">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Delegation history</caption>
          <thead className="border-b border-[#1a2535] text-slate-400"><tr><th className="p-4">Date</th><th className="p-4">Delegator</th><th className="p-4">Delegate</th><th className="p-4">Amount</th><th className="p-4">Status</th></tr></thead>
          <tbody>{HISTORY.map(row => <tr key={`${row.date}-${row.delegate}`} className="border-b border-[#1a2535] last:border-0"><td className="p-4 text-slate-300">{formatDate(row.date)}</td><td className="p-4 font-mono text-slate-400">{row.delegator}</td><td className="p-4 font-mono text-slate-400">{row.delegate}</td><td className="p-4 text-white">{formatNumber(row.amount)} QUORUM</td><td className="p-4 text-slate-300">{row.status}</td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
