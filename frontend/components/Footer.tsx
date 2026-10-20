'use client';

import { EXTERNAL_LINKS } from "@/lib/links";
import { t } from "@/lib/i18n";
import RpcHealthIndicator from "./RpcHealthIndicator";
import { useRpcHealthCheck } from "@/lib/useRpcHealthCheck";
import { USE_FIXTURE } from "@/lib/config";

// Issue #140: the footer is the only chrome on every page, so it is where a
// reader looks for the docs, the source and a way to reach the maintainers.
export default function Footer() {
  // Only run health checks when not in fixture mode
  if (!USE_FIXTURE) {
    useRpcHealthCheck();
  }

  return (
    <footer className="border-t border-[#1a2535] py-8 text-center text-sm text-slate-600">
      <nav aria-label={t("footer.resources")} className="max-w-6xl mx-auto px-6">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {EXTERNAL_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                title={link.description}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-200 focus-visible:text-slate-200 hover:underline focus-visible:underline underline-offset-4 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-4 flex items-center justify-center gap-4">
        <p>{t("footer.tagline")}</p>
        <RpcHealthIndicator />
      </div>
    </footer>
  );
}
