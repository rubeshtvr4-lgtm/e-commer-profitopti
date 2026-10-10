import { describe, it, expect } from 'vitest';
import { formatINR, formatNumber, formatPercent } from '../src/lib/currency.js';

describe('Client Currency & Metric Formatting Tests', () => {
  it('formats positive rupee amounts correctly', () => {
    const formatted = formatINR(1499.5);
    expect(formatted).toContain('1,499.50');
  });

  it('formats zero and empty inputs gracefully', () => {
    expect(formatINR(0)).toContain('0.00');
    expect(formatINR(undefined)).toBe('₹0.00');
    expect(formatINR(null)).toBe('₹0.00');
    expect(formatINR(NaN)).toBe('₹0.00');
  });

  it('formats negative amounts for net loss reporting', () => {
    const formatted = formatINR(-450);
    expect(formatted).toContain('450.00');
    expect(formatted).toContain('-');
  });

  it('formats counts with Indian locale separator', () => {
    expect(formatNumber(12500)).toContain('12,500');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(null)).toBe('0');
  });

  it('formats margin percentages with explicit plus/minus prefixes', () => {
    expect(formatPercent(35.2)).toBe('+35.2%');
    expect(formatPercent(-12.4)).toBe('-12.4%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(undefined)).toBe('0.0%');
  });
});
