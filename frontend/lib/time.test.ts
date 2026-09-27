import { describeDeadline, formatAbsolute, formatRelative } from "./time";

const NOW = Date.parse("2026-06-01T00:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const at = (offset: number) => new Date(NOW + offset).toISOString();

describe("formatRelative", () => {
  it("phrases future and past moments in the largest whole unit", () => {
    expect(formatRelative(at(2 * DAY), NOW)).toBe("in 2 days");
    expect(formatRelative(at(-3 * HOUR), NOW)).toBe("3 hours ago");
    expect(formatRelative(at(45 * MINUTE), NOW)).toBe("in 45 minutes");
    expect(formatRelative(at(-65 * DAY), NOW)).toBe("2 months ago");
  });

  it("never shows a deadline as further away than it is", () => {
    expect(formatRelative(at(2 * DAY - MINUTE), NOW)).toBe("in 1 day");
    expect(formatRelative(at(DAY + 6 * HOUR), NOW)).toBe("in 1 day");
  });

  it("uses numbers rather than calendar words", () => {
    expect(formatRelative(at(DAY), NOW)).toBe("in 1 day");
    expect(formatRelative(at(-DAY), NOW)).toBe("1 day ago");
  });

  it("covers the last minute on either side", () => {
    expect(formatRelative(at(30_000), NOW)).toBe("in under a minute");
    expect(formatRelative(at(-30_000), NOW)).toBe("just now");
  });
});

describe("formatAbsolute", () => {
  it("renders the exact moment in UTC", () => {
    expect(formatAbsolute("2026-06-06T15:30:00Z")).toBe("Jun 6, 2026, 3:30 PM UTC");
  });
});

describe("describeDeadline", () => {
  const window = { startTime: at(2 * DAY), endTime: at(9 * DAY) };

  it("counts down to the end of an active vote", () => {
    expect(describeDeadline({ ...window, status: "active", startTime: at(-DAY) }, NOW)).toEqual({
      label: "Ends in 9 days",
      iso: window.endTime,
    });
  });

  it("counts down to the start of a pending vote", () => {
    expect(describeDeadline({ ...window, status: "pending" }, NOW)).toEqual({
      label: "Starts in 2 days",
      iso: window.startTime,
    });
  });

  it("falls back to the end for a pending vote whose start has passed", () => {
    const opened = { ...window, status: "pending" as const, startTime: at(-HOUR) };
    expect(describeDeadline(opened, NOW).label).toBe("Ends in 9 days");
  });

  it("reports how long ago a vote closed", () => {
    expect(describeDeadline({ ...window, status: "passed", endTime: at(-3 * DAY) }, NOW).label).toBe(
      "Ended 3 days ago",
    );
  });

  it("says ended once the window has closed even if the status lags", () => {
    expect(describeDeadline({ ...window, status: "active", endTime: at(-HOUR) }, NOW).label).toBe(
      "Ended 1 hour ago",
    );
  });
});
