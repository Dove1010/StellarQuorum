import { EXTERNAL_LINKS } from "@/lib/links";
import { t } from "@/lib/i18n";

// Issue #140: the footer is the only chrome on every page, so it is where a
// reader looks for the docs, the source and a way to reach the maintainers.
// Issue #288: the RSS feed link is also part of this chrome.
export default function Footer() {
  return (
    <footer className="border-t border-[#1a2535] py-8 text-center text-sm text-slate-600">
      <nav aria-label={t("footer.resources")} className="max-w-6xl mx-auto px-6">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {EXTERNAL_LINKS.map((link) => {
            const isExternal = link.href.startsWith("http");
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  title={link.description}
                  {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
                  className="text-slate-400 hover:text-slate-200 focus-visible:text-slate-200 hover:underline focus-visible:underline underline-offset-4 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <p className="mt-4">{t("footer.tagline")}</p>
    </footer>
  );
}
