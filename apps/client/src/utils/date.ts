export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  } catch {
    return dateString;
  }
}

export function formatSimpleDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
