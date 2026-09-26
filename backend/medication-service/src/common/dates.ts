/**
 * Helpers for calendar dates in "YYYY-MM-DD" form. Dates are handled as UTC
 * calendar days so results never depend on the server's timezone. Strings in
 * this format also compare correctly with <, > and ===.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMs(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The UTC calendar date of a moment, e.g. 2026-09-26T23:30Z -> "2026-09-26". */
export function toDateString(moment: Date): string {
  return moment.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

/** Number of days from `from` to `to`, counting both ends; 0 if `to` < `from`. */
export function daysInclusive(from: string, to: string): number {
  return Math.max(0, (toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY + 1);
}

export function minDate(...dates: string[]): string {
  return dates.reduce((a, b) => (b < a ? b : a));
}

export function maxDate(...dates: string[]): string {
  return dates.reduce((a, b) => (b > a ? b : a));
}
