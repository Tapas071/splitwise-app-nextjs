import { CURRENCIES, formatCurrency } from '../../src/lib/currencies';

describe('currency utilities', () => {
  it('includes INR as a supported currency', () => {
    expect(CURRENCIES).toContainEqual({ code: 'INR', name: 'Indian Rupee', symbol: '₹' });
  });

  it('formats an amount using the requested currency', () => {
    expect(formatCurrency(1250, 'INR')).toContain('₹');
    expect(formatCurrency(1250, 'INR')).toContain('1,250');
  });

  it('formats invalid numeric amounts as zero', () => {
    expect(formatCurrency(Number.NaN, 'USD')).toContain('0');
    expect(formatCurrency(Number.POSITIVE_INFINITY, 'USD')).toContain('0');
  });

  it('falls back to a code-prefixed amount for unsupported currency codes', () => {
    expect(formatCurrency(5, 'NOTACURRENCY')).toBe('NOTACURRENCY 5.00');
  });
});
