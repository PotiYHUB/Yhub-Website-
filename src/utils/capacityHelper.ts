/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

/**
 * Parses a capacity string or number and returns the maximum number of people allowed.
 * For ranges like "10-15", it extracts the upper bound (15).
 * If the capacity is 0/empty, it returns 0 (indicating disabled capacity restrictions).
 */
export function getMaxCapacity(capacity: string | number | undefined | null): number {
  if (capacity === undefined || capacity === null) return 0;
  const capStr = String(capacity).trim();
  if (!capStr || capStr === '0') return 0;
  
  // Check range like "10-15" or "10 - 15"
  const parts = capStr.split('-');
  if (parts.length > 1) {
    const maxPart = parts[parts.length - 1].trim();
    const parsed = parseInt(maxPart, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  const parsed = parseInt(capStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}
