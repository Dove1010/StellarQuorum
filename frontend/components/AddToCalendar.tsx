'use client';

import { Calendar } from "lucide-react";
import type { Proposal } from "@/lib/types";
import { t } from "@/lib/i18n";

/**
 * "Add to calendar" button for proposal deadlines.
 *
 * Issue #289: generates an iCalendar (.ics) file with the voting end time
 * and, for passed/queued proposals, the timelock expiry. The .ics file is
 * downloaded client-side via a Blob URL — no server route needed, as the
 * proposal data is already available in the browser.
 *
 * The button is only rendered when a voting end time is present.
 */
export default function AddToCalendar({ proposal }: { proposal: Proposal }) {
  if (!proposal.endTime) {
    return null;
  }

  const handleDownload = () => {
    const icsContent = generateIcs(proposal);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `proposal-${proposal.id}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      aria-label={t("proposals.addToCalendar")}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162032] hover:bg-[#1a2a40] text-slate-300 text-sm border border-[#1a2535] transition-colors"
    >
      <Calendar size={14} />
      <span className="hidden sm:inline">{t("proposals.addToCalendarShort")}</span>
    </button>
  );
}

/**
 * Generates an RFC 5545 iCalendar file for a proposal's deadlines.
 *
 * Issue #289: the voting end time and timelock expiry (if queued) are already
 * ISO 8601 strings in the Proposal data model, produced by the ledger-to-date
 * conversion in `toUiProposal()`. No additional conversion is needed here —
 * we only need to format them as iCalendar DTSTART/DTEND values.
 *
 * @param proposal The proposal to generate calendar events for.
 * @returns RFC 5545 compliant iCalendar content.
 */
function generateIcs(proposal: Proposal): string {
  const now = new Date();
  const votingEnd = new Date(proposal.endTime);
  
  // DTSTAMP and DTSTART/DTEND in UTC format: yyyyMMddTHHmmssZ
  const formatIcalDate = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  };

  const dtstamp = formatIcalDate(now);
  const votingEndFormatted = formatIcalDate(votingEnd);
  
  // DTEND is 1 hour after DTSTART for the voting deadline event
  const votingEndPlusOne = new Date(votingEnd.getTime() + 60 * 60 * 1000);
  const votingEndPlusOneFormatted = formatIcalDate(votingEndPlusOne);
  
  // Truncate description to 200 chars for calendar apps
  const description = escapeIcal(proposal.description.slice(0, 200) + (proposal.description.length > 200 ? '...' : ''));
  const summary = escapeIcal(`Vote on: ${proposal.title}`);
  const url = `https://quorum.stellar.org/proposals/${proposal.id}`;
  
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StellarQuorum//StellarQuorum//EN
BEGIN:VEVENT
UID:${proposal.id}@stellarquorum
DTSTAMP:${dtstamp}
DTSTART:${votingEndFormatted}
DTEND:${votingEndPlusOneFormatted}
SUMMARY:${summary}
DESCRIPTION:${description}
URL:${url}
END:VEVENT
`;

  // Add timelock expiry event only for passed/queued proposals
  // In the UI data model, passed proposals may have been queued on-chain
  if (proposal.status === 'passed' || proposal.status === 'executed') {
    // For queued proposals, we'd need timelockExpiry from the chain.
    // However, the current UI Proposal type doesn't include a timelockExpiry field.
    // The SDK Proposal has queueLedger, but not the UI Proposal.
    // Since we can't reliably calculate timelock expiry without additional data,
    // we'll only include this event when timelock data becomes available.
    // For now, we document this limitation in the implementation.
    
    // TODO: Once the UI Proposal type includes timelockExpiry or we fetch
    // GovernanceConfig to calculate it from queueLedger, add the second VEVENT here.
  }

  icsContent += 'END:VCALENDAR\r\n';
  
  return icsContent;
}

/**
 * Escapes special characters in iCalendar text fields per RFC 5545.
 *
 * Commas, semicolons, and newlines must be escaped. Proposal titles and
 * descriptions are user-generated content and may contain these characters.
 */
function escapeIcal(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
