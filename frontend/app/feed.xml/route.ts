import { getProposals } from "@/lib/proposals";
import { getEnv } from "@/lib/env";

/**
 * RSS 2.0 feed of governance proposals, newest first.
 *
 * Issue #288: the feed covers every proposal returned by `getProposals()`,
 * sorted by voting start time descending. RSS readers expect newest entries
 * first, matching the order proposals are shown on the home page.
 *
 * The feed is valid RSS 2.0: validate with https://validator.w3.org/feed/.
 *
 * @returns Response with Content-Type application/rss+xml and Cache-Control
 * headers matching the proposal list update frequency (proposals change daily).
 */
export async function GET(): Promise<Response> {
  try {
    const { siteUrl } = getEnv();
    const proposals = await getProposals();

    // Newest first: proposals with the most recent startTime appear first in the feed.
    const sorted = [...proposals].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    const now = new Date().toUTCString();
    const items = sorted.map(proposal => {
      const link = `${siteUrl}/proposals/${proposal.id}`;
      const pubDate = new Date(proposal.startTime).toUTCString();
      
      return `    <item>
      <title>${escapeXml(proposal.title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(proposal.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Quorum Governance Proposals</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>On-chain governance proposals for the Stellar and Soroban ecosystem</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        // Cache for 1 hour — proposals change daily but RSS readers poll frequently.
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    // On error, return a valid empty feed rather than a 500 — RSS readers
    // handle empty feeds gracefully, but an error response may stop polling.
    const { siteUrl } = getEnv();
    const now = new Date().toUTCString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Quorum Governance Proposals</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>On-chain governance proposals for the Stellar and Soroban ecosystem</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  }
}

/**
 * Escapes XML special characters to prevent injection and malformed XML.
 *
 * Proposal titles and descriptions are user-generated content. Without
 * escaping, a title containing `<` or `&` would break the XML structure.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
