/**
 * Global Date Formatting Utility
 * Standardizes other date strings to DD.MM.YYYY (Day-Month-Year) format.
 * Keeps raw database dates (YYYY-MM-DD) untouched for correct query operations and sorting,
 * but presents beautiful local formats to endpoints/frontend views.
 */

export function formatDisplayDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  
  // If it's a comma-separated list of dates (like in bookings)
  if (dateStr.includes(',')) {
    return dateStr.split(',').map(d => formatDisplayDate(d.trim())).join(', ');
  }

  // Check if it matches YYYY-MM-DD (optionally followed by time or T...)
  // E.g., "2026-06-18" or "2026-06-18T09:21:41Z" or "2026-06-18 09:21:41"
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const [_, year, month, day, hours, minutes] = isoMatch;
    let formatted = `${day}.${month}.${year}`;
    if (hours && minutes) {
      formatted += ` ${hours}:${minutes}`;
    }
    return formatted;
  }

  // Fallback for already correct formats or other strings
  return dateStr;
}
