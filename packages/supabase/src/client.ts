import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../../shared/src/types/user';
import type { Client } from '../../shared/src/types/client';
import type { Dependant, Beneficiary } from '../../shared/src/types/dependant';
import type { Asset } from '../../shared/src/types/asset';
import type { Liability } from '../../shared/src/types/liability';
import type { Income } from '../../shared/src/types/income';
import type { Expense } from '../../shared/src/types/expense';
import type { Policy } from '../../shared/src/types/policy';
import type { Investment } from '../../shared/src/types/investment';
import type { Goal } from '../../shared/src/types/goal';
import type { Request } from '../../shared/src/types/request';
import type { RequestWorkflow } from '../../shared/src/types/workflow';
import type { Claim, ClaimTimeline, ClaimVehicle, ClaimWitness } from '../../shared/src/types/claim';
import type { Task } from '../../shared/src/types/task';
import type { Reminder } from '../../shared/src/types/reminder';
import type { Notification } from '../../shared/src/types/notification';
import type { Message } from '../../shared/src/types/message';
import type { DocumentRecord } from '../../shared/src/types/document';
import type { Provider } from '../../shared/src/types/provider';
import type { AuditLog } from '../../shared/src/types/audit';

const getEnv = (key: string): string | undefined => {
  const fromVite = (import.meta as any)?.env?.[key];
  if (fromVite) return fromVite as string;
  const g = globalThis as Record<string, any>;
  return g.process?.env?.[key];
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

/** False until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY point at a real project. The apps show a setup screen instead of running. */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project') && !SUPABASE_ANON_KEY.includes('your-anon-key')
);

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? SUPABASE_URL! : 'http://localhost:54321',
  isSupabaseConfigured ? SUPABASE_ANON_KEY! : 'supabase-not-configured',
  { auth: { persistSession: true, autoRefreshToken: true } }
);

export type ClientRecord = Client & { profile?: Profile; adviser?: Profile };
export type AuditRecord = AuditLog & { user_name?: string };

/**
 * In-memory copy of everything the signed-in user is allowed to see. It is rebuilt from Supabase
 * (Row Level Security decides what comes back) after every change and whenever realtime reports one,
 * so the client app and the adviser dashboard always render the same underlying records.
 */
export interface AppDatabaseState {
  currentUser: Profile | null;
  profiles: Profile[];
  clients: ClientRecord[];
  dependants: Dependant[];
  beneficiaries: Beneficiary[];
  assets: Asset[];
  liabilities: Liability[];
  income: Income[];
  expenses: Expense[];
  policies: Policy[];
  investments: Investment[];
  goals: Goal[];
  requests: Request[];
  request_workflows: RequestWorkflow[];
  claims: Claim[];
  claim_timeline: ClaimTimeline[];
  claim_witnesses: ClaimWitness[];
  claim_vehicles: ClaimVehicle[];
  tasks: Task[];
  reminders: Reminder[];
  notifications: Notification[];
  messages: Message[];
  documents: DocumentRecord[];
  providers: Provider[];
  audit_logs: AuditRecord[];
}

function emptyState(): AppDatabaseState {
  return {
    currentUser: null,
    profiles: [],
    clients: [],
    dependants: [],
    beneficiaries: [],
    assets: [],
    liabilities: [],
    income: [],
    expenses: [],
    policies: [],
    investments: [],
    goals: [],
    requests: [],
    request_workflows: [],
    claims: [],
    claim_timeline: [],
    claim_witnesses: [],
    claim_vehicles: [],
    tasks: [],
    reminders: [],
    notifications: [],
    messages: [],
    documents: [],
    providers: [],
    audit_logs: [],
  };
}

class DataStore {
  private state: AppDatabaseState = emptyState();
  private listeners = new Set<() => void>();

  getState(): AppDatabaseState {
    return this.state;
  }

  replace(next: AppDatabaseState): void {
    this.state = next;
    this.notify();
  }

  reset(): void {
    this.replace(emptyState());
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  notify(): void {
    for (const fn of [...this.listeners]) {
      try {
        fn();
      } catch (error) {
        console.error(error);
      }
    }
  }
}

export const dataStore = new DataStore();

type TableName = Exclude<keyof AppDatabaseState, 'currentUser'>;

interface TableQuery {
  table: TableName;
  order: string;
  ascending?: boolean;
  limit?: number;
}

// PostgREST returns at most 1000 rows per request; newest-first tables are capped explicitly.
const TABLE_QUERIES: TableQuery[] = [
  { table: 'profiles', order: 'created_at', ascending: true },
  { table: 'clients', order: 'created_at', ascending: true },
  { table: 'dependants', order: 'created_at', ascending: true },
  { table: 'beneficiaries', order: 'created_at', ascending: true },
  { table: 'assets', order: 'created_at', ascending: true },
  { table: 'liabilities', order: 'created_at', ascending: true },
  { table: 'income', order: 'created_at', ascending: true },
  { table: 'expenses', order: 'created_at', ascending: true },
  { table: 'policies', order: 'created_at', ascending: true },
  { table: 'investments', order: 'created_at', ascending: true },
  { table: 'goals', order: 'created_at', ascending: true },
  { table: 'requests', order: 'created_at', ascending: false },
  { table: 'request_workflows', order: 'step_number', ascending: true },
  { table: 'claims', order: 'created_at', ascending: false },
  { table: 'claim_timeline', order: 'created_at', ascending: false },
  { table: 'claim_witnesses', order: 'created_at', ascending: true },
  { table: 'claim_vehicles', order: 'created_at', ascending: true },
  { table: 'tasks', order: 'created_at', ascending: false },
  { table: 'reminders', order: 'reminder_date', ascending: true },
  { table: 'notifications', order: 'created_at', ascending: false, limit: 200 },
  { table: 'messages', order: 'created_at', ascending: false, limit: 1000 },
  { table: 'documents', order: 'created_at', ascending: false },
  { table: 'providers', order: 'name', ascending: true },
  { table: 'audit_logs', order: 'created_at', ascending: false, limit: 500 },
];

export class AccountError extends Error {}

async function loadState(): Promise<AppDatabaseState> {
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  if (!authUser) return emptyState();

  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  if (profileError) throw profileError;
  if (!profile) {
    throw new AccountError('Your account has no profile yet. Please contact Royal Square support.');
  }
  if (!profile.is_active) {
    throw new AccountError('This account has been deactivated. Please contact Royal Square support.');
  }

  const results = await Promise.all(
    TABLE_QUERIES.map(async (q) => {
      let query = supabase.from(q.table).select('*').order(q.order, { ascending: q.ascending ?? true });
      if (q.limit) query = query.limit(q.limit);
      const { data, error } = await query;
      return { table: q.table, data: (data ?? []) as any[], error };
    })
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(`Unable to load ${failed.table}: ${failed.error.message}`);
  }

  const next = emptyState();
  next.currentUser = profile as Profile;
  for (const r of results) {
    (next as any)[r.table] = r.data;
  }

  // Newest-first tables that are consumed oldest-first (threads)
  next.messages = [...next.messages].reverse();

  // Denormalise the joins the screens need so both apps agree on names.
  const profilesById = new Map(next.profiles.map((p) => [p.id, p]));
  const providersById = new Map(next.providers.map((p) => [p.id, p]));

  next.clients = next.clients.map((c) => ({ ...c, profile: profilesById.get(c.profile_id), adviser: c.adviser_id ? profilesById.get(c.adviser_id) : undefined }));
  next.policies = next.policies.map((p) => ({ ...p, provider_name: p.provider_id ? providersById.get(p.provider_id)?.name : undefined }));
  next.investments = next.investments.map((i) => ({ ...i, provider_name: i.provider_id ? providersById.get(i.provider_id)?.name : undefined }));
  next.claims = next.claims.map((c) => ({ ...c, provider_name: c.provider_id ? providersById.get(c.provider_id)?.name : undefined }));
  next.messages = next.messages.map((m) => {
    const sender = profilesById.get(m.sender_id);
    return { ...m, sender_name: sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.email || undefined : undefined };
  });
  next.audit_logs = next.audit_logs.map((a) => {
    const actor = a.user_id ? profilesById.get(a.user_id) : undefined;
    return {
      ...a,
      user_email: actor?.email ?? undefined,
      user_name: actor ? `${actor.first_name || ''} ${actor.last_name || ''}`.trim() || actor.email || undefined : undefined,
    };
  });

  return next;
}

let inflight: Promise<void> | null = null;
let queued: Promise<void> | null = null;

/**
 * Reload everything the current user may see. Calls made while a load is running are coalesced into
 * a single follow-up load, and the returned promise always resolves with data at least as new as the call.
 */
export function hydrateRemoteState(): Promise<void> {
  if (!inflight) {
    inflight = loadState()
      .then((next) => dataStore.replace(next))
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }
  if (!queued) {
    queued = inflight
      .catch(() => undefined)
      .then(() => {
        queued = null;
        return hydrateRemoteState();
      });
  }
  return queued;
}

const REALTIME_TABLES: TableName[] = [
  'profiles', 'clients', 'dependants', 'beneficiaries', 'assets', 'liabilities', 'income', 'expenses',
  'policies', 'investments', 'goals', 'requests', 'request_workflows', 'claims', 'claim_timeline',
  'claim_witnesses', 'claim_vehicles', 'tasks', 'reminders', 'notifications', 'messages', 'documents',
  'providers', 'audit_logs',
];

let channel: RealtimeChannel | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/** Keep both apps live: any change the database reports triggers a (debounced) reload. */
export function startRealtime(): void {
  if (channel || !isSupabaseConfigured) return;

  const scheduleRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      hydrateRemoteState().catch((error) => console.warn('Realtime refresh failed:', error));
    }, 350);
  };

  let next = supabase.channel('royal-square-sync');
  for (const table of REALTIME_TABLES) {
    next = next.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh);
  }
  channel = next.subscribe();
}

export function stopRealtime(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
}

/** Throw the Supabase error from a mutation so callers can surface it. */
export function unwrap<T extends { error: { message: string } | null }>(result: T): T {
  if (result.error) throw new Error(result.error.message);
  return result;
}
