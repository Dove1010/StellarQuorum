'use client';

import { useState } from "react";

export default function GlossaryTooltip({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button type="button" className="border-b border-dotted border-slate-500 text-slate-300 hover:text-white" aria-expanded={open} onClick={() => setOpen(value => !value)}>{term}</button>
      {open && <span role="tooltip" className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-md border border-[#1e2d40] bg-[#0d1520] p-3 text-xs text-slate-300 shadow-xl">{definition}</span>}
    </span>
  );
}
