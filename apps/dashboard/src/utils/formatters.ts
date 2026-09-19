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
    return `R ${(amount / 1_000_000).toFixed(2)}m`;
  }
  if (amount >= 1_000) {
    return `R ${(amount / 1_000).toFixed(0)}k`;
  }
  return `R ${amount.toFixed(0)}`;
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
