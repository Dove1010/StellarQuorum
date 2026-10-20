import Link from "next/link";
import { Scale, Vote, CheckSquare, ArrowRight } from "lucide-react";
import { formatNumber, t } from "@/lib/i18n";
import { getProposals } from "@/lib/proposals";
import ProposalCard from "@/components/ProposalCard";
import DigestSignup from "@/components/DigestSignup";
import GlossaryTooltip from "@/components/GlossaryTooltip";

// Read on-chain state per request rather than baking it in at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const proposals = await getProposals();
  const activeCount = proposals.filter(p => p.status === "active").length;
  const recentProposals = proposals.slice(0, 4);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 text-center border-b border-[#1a2535]">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700/50 text-blue-400 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {t("home.activeProposals", { count: formatNumber(activeCount) })}
          </div>
          <h1 className="text-5xl font-bold text-white mb-5 leading-tight">
            {t("home.titleLead")}{" "}
            <span className="text-blue-400">{t("home.titleAccent")}</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 leading-relaxed">
            {t("home.intro")}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/proposals" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors">
              {t("home.viewProposals")}
            </Link>
            <Link href="/create" className="px-8 py-3 border border-[#1a2535] hover:border-blue-700 text-slate-300 rounded-lg font-semibold transition-colors">
              {t("home.createProposal")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 border-b border-[#1a2535] bg-[#0a0f18]">
        <div className="max-w-4xl mx-auto px-6 flex justify-center gap-16 text-center">
          {[
            { value: formatNumber(proposals.length), label: t("home.totalProposals") },
            { value: formatNumber(activeCount), label: t("home.activeVotes") },
            { value: "1.2M XLM", label: t("home.totalGoverned") },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-blue-400">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Proposals */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">{t("home.recent")}</h2>
            <Link href="/proposals" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              {t("home.viewAll")} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recentProposals.map(p => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 border-t border-[#1a2535] bg-[#0a0f18]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">{t("home.how")}</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: <Scale size={28} className="text-blue-400 mx-auto" />, step: "01", title: t("home.stepCreate"), desc: t("home.stepCreateDescription") },
              { icon: <Vote size={28} className="text-blue-400 mx-auto" />, step: "02", title: t("home.stepVote"), desc: t("home.stepVoteDescription") },
              { icon: <CheckSquare size={28} className="text-blue-400 mx-auto" />, step: "03", title: t("home.stepExecute"), desc: t("home.stepExecuteDescription") },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#0d1520] border border-[#1a2535] flex items-center justify-center">
                  {s.icon}
                </div>
                <div className="text-xs text-blue-500 font-mono">{s.step}</div>
                <h3 className="font-semibold text-white">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <DigestSignup />
          <div className="rounded-xl border border-[#1a2535] bg-[#0d1520] p-5 text-sm text-slate-400">
            <p><GlossaryTooltip term="Snapshot ledger" definition="The ledger recorded when a proposal opened; voting power is measured at this point in history." /> is the balance checkpoint used to weight votes.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
