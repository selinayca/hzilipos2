/**
 * Formats integer cents into a locale-aware currency string.
 *
 * Uses TRY by default; can be extended to read from tenant settings later.
 * All amounts in the system are in the smallest unit (kuruş for TRY).
 */
export function formatCents(cents: number, currency = 'TRY', locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
