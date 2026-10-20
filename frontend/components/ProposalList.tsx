'use client';

import { useState } from "react";
import ProposalCard from "@/components/ProposalCard";
import type { Proposal, ProposalStatus } from "@/lib/types";
import { formatNumber, t } from "@/lib/i18n";

const FILTERS: { label: string; value: ProposalStatus | "all" }[] = [
  { label: t("proposals.all"), value: "all" },
  { label: t("common.active"), value: "active" },
  { label: t("common.passed"), value: "passed" },
  { label: t("common.failed"), value: "failed" },
  { label: t("common.pending"), value: "pending" },
];

export default function ProposalList({ proposals }: { proposals: Proposal[] }) {
  const [filter, setFilter] = useState<ProposalStatus | "all">("all");
  const [sort, setSort] = useState<"recent" | "votes" | "title">("recent");
  const activeCount = proposals.filter(p => p.status === 'active').length;

  const filtered = [...(filter === "all" ? proposals : proposals.filter(p => p.status === filter))].sort((a, b) => {
    if (sort === "votes") return (b.forVotes + b.againstVotes + b.abstainVotes) - (a.forVotes + a.againstVotes + a.abstainVotes);
    if (sort === "title") return a.title.localeCompare(b.title);
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t("proposals.title")}</h1>
        <p className="text-slate-400">{t("proposals.summary", { total: formatNumber(proposals.length), active: formatNumber(activeCount) })}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-[#0d1520] border border-[#1a2535] text-slate-400 hover:border-blue-800 focus-visible:border-blue-800"
            }`}
          >
            {f.label}
            {f.value !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                {proposals.filter(p => p.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="proposal-sort" className="text-sm text-slate-400">Sort proposals</label>
        <select id="proposal-sort" value={sort} onChange={event => setSort(event.target.value as typeof sort)} className="rounded-md border border-[#1e2d40] bg-[#0d1520] px-3 py-2 text-sm text-slate-300">
          <option value="recent">Most recent</option>
          <option value="votes">Most votes</option>
          <option value="title">Title</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">{t("proposals.empty")}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(p => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
}
