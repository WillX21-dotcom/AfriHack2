import type { Profile } from './types/user';

export function fullName(profile: Pick<Profile, 'first_name' | 'last_name' | 'email'> | null | undefined, fallback = 'Unknown'): string {
  if (!profile) return fallback;
  const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  return name || profile.email || fallback;
}

export function initials(profile: Pick<Profile, 'first_name' | 'last_name' | 'email'> | null | undefined): string {
  if (!profile) return '?';
  const value = `${(profile.first_name || '').charAt(0)}${(profile.last_name || '').charAt(0)}`.toUpperCase();
  return value || (profile.email || '?').charAt(0).toUpperCase();
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatZAR(amount: number | string | null | undefined): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 30) return formatDate(value);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function titleCase(value: string | null | undefined): string {
  return (value || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function maskIdNumber(idNumber: string | null | undefined): string {
  if (!idNumber) return '—';
  if (idNumber.length < 10) return idNumber;
  return `${idNumber.slice(0, 6)}••••${idNumber.slice(-3)}`;
}

/** Monthly equivalent of an income/expense line. */
export function monthlyAmount(amount: number | string, frequency: string): number {
  const value = Number(amount) || 0;
  switch (frequency) {
    case 'weekly': return (value * 52) / 12;
    case 'fortnightly': return (value * 26) / 12;
    case 'quarterly': return value / 3;
    case 'annually':
    case 'yearly': return value / 12;
    default: return value;
  }
}

export function isOpenRequest(status: string): boolean {
  return status !== 'completed' && status !== 'cancelled';
}

export function isOpenClaim(status: string): boolean {
  return status !== 'completed' && status !== 'rejected' && status !== 'cancelled';
}
