import { t } from "./i18n";
// Canonical off-site destinations, kept in one place so the footer cannot drift
// from the repository these links point at. Issue #140.
//
// Deliberately free of any `process.env` read: this module is imported by the
// footer, so it ends up in the client bundle. The site's own origin comes from
// the validated environment (see lib/env.ts) and is used by the server-rendered
// robots.txt and sitemap only.

export const REPO_URL = "https://github.com/StellarQuorum/StellarQuorum";
export const DOCS_URL = `${REPO_URL}/tree/main/docs`;
export const DISCUSSIONS_URL = `${REPO_URL}/discussions`;
export const ISSUES_URL = `${REPO_URL}/issues`;
export const CONTRIBUTING_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;

export interface ExternalLink {
  /** Link text, and the accessible name of the link. */
  label: string;
  href: string;
  /** One line on what the destination is, for the title attribute. */
  description: string;
}

/** The footer and the sitemap's off-site links, in the order they are shown. */
export const EXTERNAL_LINKS: readonly ExternalLink[] = [
  { label: t("footer.docs"), href: DOCS_URL, description: t("footer.docsDescription") },
  { label: t("footer.source"), href: REPO_URL, description: t("footer.sourceDescription") },
  { label: t("footer.discussions"), href: DISCUSSIONS_URL, description: t("footer.discussionsDescription") },
  { label: t("footer.issues"), href: ISSUES_URL, description: t("footer.issuesDescription") },
  { label: t("footer.contributing"), href: CONTRIBUTING_URL, description: t("footer.contributingDescription") },
  { label: t("footer.rss"), href: "/feed.xml", description: t("footer.rssDescription") },
];
