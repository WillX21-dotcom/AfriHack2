import { dataStore } from '@supabase-pkg/client';

type Option = [value: string, label: string];

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'textarea' | 'checkbox';
  options?: Option[];
  required?: boolean;
  /** Empty select value maps to null instead of being rejected. */
  nullable?: boolean;
  placeholder?: string;
  half?: boolean;
}

export interface RecordSchema {
  table: string;
  singular: string;
  /** Rows belong to a client and get `client_id` injected. */
  clientScoped: boolean;
  fields: FieldDef[];
  /** Extra values written on create only. */
  onCreate?: () => Record<string, unknown>;
}

const FREQUENCIES: Option[] = [
  ['monthly', 'Monthly'],
  ['weekly', 'Weekly'],
  ['fortnightly', 'Fortnightly'],
  ['quarterly', 'Quarterly'],
  ['annually', 'Annually'],
];

const providerOptions = (): Option[] => [['', 'Not specified'], ...dataStore.getState().providers.map((p): Option => [p.id, p.name])];

const staffOptions = (): Option[] =>
  dataStore
    .getState()
    .profiles.filter((p) => p.role !== 'client' && p.is_active)
    .map((p): Option => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || p.id]);

export function getRecordSchema(table: string): RecordSchema | null {
  switch (table) {
    case 'assets':
      return {
        table, singular: 'Asset', clientScoped: true,
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Primary residence' },
          { name: 'asset_type', label: 'Type', type: 'select', required: true, half: true, options: [['property', 'Property'], ['vehicle', 'Vehicle'], ['investment', 'Investment'], ['cash', 'Cash'], ['business', 'Business'], ['pension', 'Pension'], ['other', 'Other']] },
          { name: 'current_value', label: 'Current value (ZAR)', type: 'number', required: true, half: true },
          { name: 'institution', label: 'Institution', type: 'text' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ],
      };
    case 'liabilities':
      return {
        table, singular: 'Liability', clientScoped: true,
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Home loan' },
          { name: 'liability_type', label: 'Type', type: 'select', required: true, half: true, options: [['bond', 'Home loan / bond'], ['vehicle_finance', 'Vehicle finance'], ['personal_loan', 'Personal loan'], ['credit_card', 'Credit card'], ['business_loan', 'Business loan'], ['other', 'Other']] },
          { name: 'institution', label: 'Institution', type: 'text', half: true },
          { name: 'outstanding_balance', label: 'Outstanding balance (ZAR)', type: 'number', required: true, half: true },
          { name: 'monthly_payment', label: 'Monthly payment (ZAR)', type: 'number', half: true },
          { name: 'interest_rate', label: 'Interest rate (%)', type: 'number', nullable: true, half: true },
        ],
      };
    case 'income':
      return {
        table, singular: 'Income source', clientScoped: true,
        fields: [
          { name: 'source', label: 'Source', type: 'text', required: true, placeholder: 'e.g. Salary' },
          { name: 'amount', label: 'Amount (ZAR)', type: 'number', required: true, half: true },
          { name: 'frequency', label: 'Frequency', type: 'select', required: true, half: true, options: FREQUENCIES },
        ],
      };
    case 'expenses':
      return {
        table, singular: 'Expense', clientScoped: true,
        fields: [
          { name: 'category', label: 'Category', type: 'text', required: true, placeholder: 'e.g. Groceries' },
          { name: 'amount', label: 'Amount (ZAR)', type: 'number', required: true, half: true },
          { name: 'frequency', label: 'Frequency', type: 'select', required: true, half: true, options: FREQUENCIES },
        ],
      };
    case 'policies':
      return {
        table, singular: 'Policy', clientScoped: true,
        fields: [
          { name: 'policy_type', label: 'Policy type', type: 'text', required: true, placeholder: 'e.g. Comprehensive motor' },
          { name: 'policy_number', label: 'Policy number', type: 'text', half: true },
          { name: 'provider_id', label: 'Provider', type: 'select', nullable: true, half: true, options: providerOptions() },
          { name: 'premium', label: 'Premium (ZAR)', type: 'number', half: true },
          { name: 'premium_frequency', label: 'Premium frequency', type: 'select', half: true, options: FREQUENCIES },
          { name: 'sum_assured', label: 'Sum assured (ZAR)', type: 'number', half: true },
          { name: 'status', label: 'Status', type: 'select', required: true, half: true, options: [['active', 'Active'], ['lapsed', 'Lapsed'], ['cancelled', 'Cancelled']] },
          { name: 'start_date', label: 'Start date', type: 'date', nullable: true, half: true },
          { name: 'renewal_date', label: 'Renewal date', type: 'date', nullable: true, half: true },
          { name: 'debit_order_day', label: 'Debit order day (1-31)', type: 'number', nullable: true, half: true },
        ],
      };
    case 'investments':
      return {
        table, singular: 'Investment', clientScoped: true,
        fields: [
          { name: 'investment_name', label: 'Investment name', type: 'text', required: true },
          { name: 'provider_id', label: 'Provider', type: 'select', nullable: true, half: true, options: providerOptions() },
          { name: 'account_number', label: 'Account number', type: 'text', half: true },
          { name: 'investment_type', label: 'Type', type: 'text', half: true, placeholder: 'e.g. Retirement annuity' },
          { name: 'current_value', label: 'Current value (ZAR)', type: 'number', required: true, half: true },
          { name: 'monthly_contribution', label: 'Monthly contribution (ZAR)', type: 'number', half: true },
        ],
      };
    case 'goals':
      return {
        table, singular: 'Goal', clientScoped: true,
        fields: [
          { name: 'name', label: 'Goal name', type: 'text', required: true },
          { name: 'goal_type', label: 'Type', type: 'select', required: true, half: true, options: [['retirement', 'Retirement'], ['property', 'Property'], ['vehicle', 'Vehicle'], ['education', 'Education'], ['emergency_fund', 'Emergency fund'], ['travel', 'Travel'], ['investment', 'Investment'], ['business', 'Business'], ['other', 'Other']] },
          { name: 'status', label: 'Status', type: 'select', required: true, half: true, options: [['active', 'Active'], ['achieved', 'Achieved'], ['paused', 'Paused'], ['cancelled', 'Cancelled']] },
          { name: 'target_amount', label: 'Target (ZAR)', type: 'number', required: true, half: true },
          { name: 'current_amount', label: 'Saved so far (ZAR)', type: 'number', half: true },
          { name: 'target_date', label: 'Target date', type: 'date', nullable: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'is_shared', label: 'Shared with the client', type: 'checkbox' },
        ],
      };
    case 'dependants':
      return {
        table, singular: 'Dependant', clientScoped: true,
        fields: [
          { name: 'full_name', label: 'Full name', type: 'text', required: true },
          { name: 'relationship', label: 'Relationship', type: 'text', half: true },
          { name: 'date_of_birth', label: 'Date of birth', type: 'date', nullable: true, half: true },
          { name: 'id_number', label: 'ID number', type: 'text' },
          { name: 'is_dependent', label: 'Financially dependent', type: 'checkbox' },
        ],
      };
    case 'beneficiaries':
      return {
        table, singular: 'Beneficiary', clientScoped: true,
        fields: [
          { name: 'full_name', label: 'Full name', type: 'text', required: true },
          { name: 'relationship', label: 'Relationship', type: 'text', half: true },
          { name: 'percentage', label: 'Share (%)', type: 'number', nullable: true, half: true },
          { name: 'id_number', label: 'ID number', type: 'text', half: true },
          { name: 'date_of_birth', label: 'Date of birth', type: 'date', nullable: true, half: true },
          { name: 'contact_number', label: 'Contact number', type: 'text', half: true },
          { name: 'email', label: 'Email', type: 'text', half: true },
        ],
      };
    case 'reminders':
      return {
        table, singular: 'Reminder', clientScoped: true,
        onCreate: () => ({ created_by: dataStore.getState().currentUser?.id ?? null }),
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. FICA re-verification' },
          { name: 'reminder_date', label: 'Due', type: 'datetime', required: true, half: true },
          { name: 'frequency', label: 'Repeats', type: 'select', required: true, half: true, options: [['once', 'Once'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['six_monthly', 'Every 6 months'], ['yearly', 'Yearly'], ['every_two_years', 'Every 2 years']] },
          { name: 'description', label: 'Details', type: 'textarea' },
          { name: 'notify_client', label: 'Also notify the client', type: 'checkbox' },
          { name: 'notify_adviser', label: 'Notify the adviser', type: 'checkbox' },
        ],
      };
    case 'tasks':
      return {
        table, singular: 'Task', clientScoped: true,
        onCreate: () => ({ assigned_to: dataStore.getState().currentUser?.id ?? null }),
        fields: [
          { name: 'title', label: 'Task', type: 'text', required: true },
          { name: 'priority', label: 'Priority', type: 'select', required: true, half: true, options: [['low', 'Low'], ['normal', 'Normal'], ['high', 'High'], ['urgent', 'Urgent']] },
          { name: 'due_date', label: 'Due', type: 'datetime', nullable: true, half: true },
          { name: 'assigned_to', label: 'Assigned to', type: 'select', nullable: true, options: staffOptions() },
          { name: 'description', label: 'Details', type: 'textarea' },
        ],
      };
    default:
      return null;
  }
}

/** ISO timestamp -> value for <input type="datetime-local"> in the user's timezone. */
export function toDateTimeLocal(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Turn submitted form values into a row payload, following the schema. Throws with a readable message on bad input. */
export function readRecordForm(schema: RecordSchema, form: HTMLFormElement): Record<string, unknown> {
  const data = new FormData(form);
  const out: Record<string, unknown> = {};

  for (const field of schema.fields) {
    if (field.type === 'checkbox') {
      out[field.name] = data.get(field.name) === 'on';
      continue;
    }
    const value = String(data.get(field.name) ?? '').trim();

    if (value === '') {
      if (field.required) throw new Error(`${field.label} is required.`);
      if (field.type === 'number') out[field.name] = field.nullable ? null : 0;
      else if (field.type === 'select') out[field.name] = field.nullable ? null : undefined; // undefined: let the DB default apply
      else out[field.name] = null;
      continue;
    }

    if (field.type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new Error(`${field.label} must be a number.`);
      if (n < 0 && field.name !== 'interest_rate') throw new Error(`${field.label} cannot be negative.`);
      out[field.name] = n;
    } else if (field.type === 'datetime') {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) throw new Error(`${field.label} is not a valid date.`);
      out[field.name] = d.toISOString();
    } else {
      out[field.name] = value;
    }
  }

  if (schema.table === 'beneficiaries' && typeof out.percentage === 'number' && out.percentage > 100) {
    throw new Error('Beneficiary share cannot exceed 100%.');
  }

  for (const key of Object.keys(out)) if (out[key] === undefined) delete out[key];
  return out;
}
