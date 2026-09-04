/**
 * Global Date Formatting Utility
 * Standardizes other date strings to DD.MM.YYYY (Day-Month-Year) format.
 * Keeps raw database dates (YYYY-MM-DD) untouched for correct query operations and sorting,
 * but presents beautiful local formats to endpoints/frontend views.
 */

const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
];

/**
 * Normalizes single date string to ISO YYYY-MM-DD format if possible.
 * Supports: YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
 */
export function normalizeDateToISO(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

/**
 * Parses raw booking date string (comma, newline, or semicolon separated)
 * into a sorted, unique array of clean date strings (normalized to YYYY-MM-DD).
 */
export function parseBookingDates(dateStr: string | undefined | null): string[] {
  if (!dateStr) return [];

  // Split by comma, newline, or semicolon
  const rawParts = dateStr.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  const normalizedSet = new Set<string>();

  rawParts.forEach(part => {
    // Check if it's a range like "2026-09-01 - 2026-09-05" or "01.09.2026 - 05.09.2026"
    if (part.includes(' - ') || part.includes(' — ') || part.includes(' to ')) {
      const [startRaw, endRaw] = part.split(/\s*(?:-|—|to)\s*/);
      const startIso = normalizeDateToISO(startRaw);
      const endIso = normalizeDateToISO(endRaw);
      if (/^\d{4}-\d{2}-\d{2}$/.test(startIso) && /^\d{4}-\d{2}-\d{2}$/.test(endIso)) {
        const cur = new Date(startIso);
        const end = new Date(endIso);
        if (cur <= end) {
          while (cur <= end) {
            normalizedSet.add(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
          }
          return;
        }
      }
    }

    const iso = normalizeDateToISO(part);
    if (iso) {
      normalizedSet.add(iso);
    }
  });

  return Array.from(normalizedSet).sort();
}

/**
 * Format date for display: DD.MM.YYYY
 */
export function formatSingleDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const [_, year, month, day, hours, minutes] = isoMatch;
    let formatted = `${day}.${month}.${year}`;
    if (hours && minutes) {
      formatted += ` ${hours}:${minutes}`;
    }
    return formatted;
  }

  // Already DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

export function formatDisplayDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  
  if (dateStr.includes(',') || dateStr.includes('\n')) {
    const dates = parseBookingDates(dateStr);
    return dates.map(d => formatSingleDisplayDate(d)).join(', ');
  }

  return formatSingleDisplayDate(dateStr);
}

/**
 * Smart date summary for tables, bookings lists, or cards.
 * If 1-3 dates, shows them all.
 * If 4+ dates, shows "DD.MM.YYYY – DD.MM.YYYY (სულ N დღე)"
 */
export function formatBookingDateSummary(dateStr: string | undefined | null): {
  summary: string;
  count: number;
  isMultiDay: boolean;
  firstDate: string;
  lastDate: string;
  dates: string[];
} {
  const dates = parseBookingDates(dateStr);
  const count = dates.length;

  if (count === 0) {
    return { summary: dateStr || '—', count: 0, isMultiDay: false, firstDate: '', lastDate: '', dates: [] };
  }

  const firstDate = formatSingleDisplayDate(dates[0]);
  const lastDate = formatSingleDisplayDate(dates[dates.length - 1]);

  if (count === 1) {
    return { summary: firstDate, count: 1, isMultiDay: false, firstDate, lastDate, dates };
  }

  if (count <= 3) {
    return {
      summary: dates.map(d => formatSingleDisplayDate(d)).join(', '),
      count,
      isMultiDay: true,
      firstDate,
      lastDate,
      dates
    };
  }

  return {
    summary: `${firstDate} – ${lastDate} (${count} დღე)`,
    count,
    isMultiDay: true,
    firstDate,
    lastDate,
    dates
  };
}

/**
 * Groups an array of YYYY-MM-DD dates into consecutive ranges
 * e.g., ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-10"] ->
 * [{ start: "2026-09-01", end: "2026-09-03", count: 3 }, { start: "2026-09-10", end: "2026-09-10", count: 1 }]
 */
export function getBookingConsecutiveRanges(dates: string[]): {
  start: string;
  end: string;
  count: number;
  formattedStart: string;
  formattedEnd: string;
}[] {
  if (!dates || dates.length === 0) return [];
  const sorted = [...dates].sort();
  const ranges: { start: string; end: string; count: number; formattedStart: string; formattedEnd: string }[] = [];

  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  let count = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(rangeEnd);
    const nextDate = new Date(sorted[i]);
    const diffTime = nextDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      rangeEnd = sorted[i];
      count++;
    } else {
      ranges.push({
        start: rangeStart,
        end: rangeEnd,
        count,
        formattedStart: formatSingleDisplayDate(rangeStart),
        formattedEnd: formatSingleDisplayDate(rangeEnd)
      });
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
      count = 1;
    }
  }

  ranges.push({
    start: rangeStart,
    end: rangeEnd,
    count,
    formattedStart: formatSingleDisplayDate(rangeStart),
    formattedEnd: formatSingleDisplayDate(rangeEnd)
  });

  return ranges;
}

/**
 * Groups dates by Month and Year in Georgian for clear invoice and schedule display
 */
export function groupDatesByMonth(dates: string[]): {
  monthKey: string;
  monthLabel: string;
  year: number;
  dates: string[];
}[] {
  if (!dates || dates.length === 0) return [];
  const sorted = [...dates].sort();
  const groups: Record<string, { monthLabel: string; year: number; dates: string[] }> = {};

  sorted.forEach(d => {
    const parts = d.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthName = GEORGIAN_MONTHS[monthIdx] || parts[1];
      const key = `${year}-${parts[1]}`;
      if (!groups[key]) {
        groups[key] = {
          monthLabel: `${monthName} ${year}`,
          year,
          dates: []
        };
      }
      groups[key].dates.push(d);
    }
  });

  return Object.keys(groups).sort().map(key => ({
    monthKey: key,
    monthLabel: groups[key].monthLabel,
    year: groups[key].year,
    dates: groups[key].dates
  }));
}

