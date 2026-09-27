import type { Proposal } from "./types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Largest unit first. Weeks are skipped on purpose: "in 12 days" tells a voter
 * more than "in 2 weeks", and voting windows are rarely longer than a month.
 */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * DAY],
  ["month", 30 * DAY],
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
];

// Pinned to English because the phrases around it ("Ends", "Voting") are.
// `numeric: "always"` keeps "in 1 day" rather than "tomorrow", which would be
// wrong for a deadline 30 hours out that lands two calendar days away.
const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "always" });

// UTC so the exact time reads the same on the server and in every browser.
const absolute = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/**
 * "in 2 days", "3 hours ago". Amounts are truncated rather than rounded so a
 * deadline is never shown as further away than it is: 1 day 23 hours left
 * reads "in 1 day", not "in 2 days".
 */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  for (const [unit, ms] of UNITS) {
    if (abs >= ms) {
      return relative.format(Math.sign(diff) * Math.floor(abs / ms), unit);
    }
  }
  return diff >= 0 ? "in under a minute" : "just now";
}

/** "Jun 6, 2026, 12:00 AM UTC" — the exact moment behind a relative phrase. */
export function formatAbsolute(iso: string): string {
  return `${absolute.format(new Date(iso))} UTC`;
}

/**
 * The single timing a voter needs to decide whether to act now: when voting
 * opens for a pending proposal, when it closes for an active one, and when it
 * closed for everything else.
 */
export function describeDeadline(
  proposal: Pick<Proposal, "status" | "startTime" | "endTime">,
  now: number = Date.now(),
): { label: string; iso: string } {
  if (proposal.status === "pending" && new Date(proposal.startTime).getTime() > now) {
    return { label: `Starts ${formatRelative(proposal.startTime, now)}`, iso: proposal.startTime };
  }
  const ended = new Date(proposal.endTime).getTime() <= now;
  const verb = ended ? "Ended" : "Ends";
  return { label: `${verb} ${formatRelative(proposal.endTime, now)}`, iso: proposal.endTime };
}
