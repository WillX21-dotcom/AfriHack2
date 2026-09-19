export function formatCurrencyZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactZAR(amount: number): string {
  if (amount >= 1_000_000) {
    return `R ${(amount / 1_000_000).toFixed(1)}m`;
  }
  if (amount >= 1_000) {
    return `R ${(amount / 1_000).toFixed(0)}k`;
  }
  return `R ${amount.toFixed(0)}`;
}

export function maskIDNumber(idNumber: string | null | undefined): string {
  if (!idNumber || idNumber.length < 10) return idNumber || '—';
  return idNumber.slice(0, 6) + '••••' + idNumber.slice(-3);
}
