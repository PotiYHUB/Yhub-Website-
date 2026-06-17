/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a date string from YYYY-MM-DD format to Day-Month-Year (DD-MM-YYYY) format.
 * Examples:
 *   "2026-06-17" -> "17-06-2026"
 *   "2026-06-17 12:30" -> "17-06-2026 12:30"
 *   "2026-06-17T12:30:00Z" -> "17-06-2026 12:30"
 *   "2026-06-17, 2026-06-18" -> "17-06-2026, 18-06-2026"
 */
export function formatToDayMonthYear(dateStr: string | undefined | null, includeTime: boolean = false): string {
  if (!dateStr) return '';

  // If there are multiple comma-separated dates
  if (dateStr.includes(',')) {
    return dateStr
      .split(',')
      .map(d => formatToDayMonthYear(d.trim(), includeTime))
      .join(', ');
  }

  // Handle ISO string contains T
  let normalized = dateStr;
  if (dateStr.includes('T')) {
    normalized = dateStr.replace('T', ' ').split('.')[0];
  }

  // Extract date part (first 10 characters: YYYY-MM-DD or custom)
  const datePart = normalized.substring(0, 10);
  const remainder = includeTime ? normalized.substring(10) : '';

  const regex = /^(\d{4})[-/](\d{2})[-/](\d{2})$/;
  const match = datePart.match(regex);

  if (match) {
    const [, lYear, lMonth, lDay] = match;
    // Strip trailing seconds if present (e.g., " 12:30:00" -> " 12:30")
    let cleanedRemainder = remainder;
    if (includeTime && remainder.match(/^\s\d{2}:\d{2}:\d{2}$/)) {
      cleanedRemainder = remainder.substring(0, 6);
    }
    return `${lDay}-${lMonth}-${lYear}${cleanedRemainder}`;
  }

  // Fallback check: if dateStr resembles "YYYY-MM-DD HH:MM:SS" or similar, extract the date part
  const dateRegex = /^(\d{4})[-/](\d{2})[-/](\d{2})/;
  const dateMatch = dateStr.match(dateRegex);
  if (dateMatch) {
    const [, lYear, lMonth, lDay] = dateMatch;
    return `${lDay}-${lMonth}-${lYear}`;
  }

  return dateStr;
}
