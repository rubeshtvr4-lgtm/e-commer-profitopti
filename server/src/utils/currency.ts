/**
 * Currency Utility for ProfitPilot
 * All internal financial calculations store currency as integer minor units (paise).
 * 1 INR = 100 paise.
 */

export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  MINOR_UNIT_RATIO: 100, // 100 paise per INR
};

/**
 * Converts major currency units (e.g. 150.50 INR) to minor currency units (15050 paise).
 * Applies deterministic Math.round to avoid floating point precision artifacts.
 */
export function toPaise(amountInMajor: number): number {
  if (isNaN(amountInMajor)) return 0;
  return Math.round(amountInMajor * CURRENCY.MINOR_UNIT_RATIO);
}

/**
 * Converts minor currency units (e.g. 15050 paise) to major currency units (150.50 INR).
 */
export function toRupees(amountInPaise: number): number {
  if (isNaN(amountInPaise)) return 0;
  return Number((amountInPaise / CURRENCY.MINOR_UNIT_RATIO).toFixed(2));
}

/**
 * Formats minor currency units into human-readable INR format (e.g. ₹1,250.50).
 */
export function formatCurrency(
  amountInPaise: number,
  currencyCode = 'INR',
  currencySymbol = '₹'
): string {
  const major = toRupees(amountInPaise);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);

  return `${currencySymbol}${formatted}`;
}

/**
 * Calculates profit margin percentage safely: (profit / revenue) * 100.
 * Handles cases where revenue is 0 or negative.
 */
export function calculateProfitMargin(profitInPaise: number, revenueInPaise: number): number {
  if (revenueInPaise <= 0) {
    if (profitInPaise < 0) return -100;
    return 0;
  }
  const margin = (profitInPaise / revenueInPaise) * 100;
  return Number(margin.toFixed(2));
}
