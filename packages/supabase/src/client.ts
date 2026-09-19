import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  const g = globalThis as Record<string, any>;
  if (typeof g.process !== 'undefined' && g.process?.env?.[key]) {
    return g.process.env[key];
  }
  return undefined;
};

// Environment credentials
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('demo.supabase.co') &&
  !SUPABASE_ANON_KEY.includes('mock-key') &&
  !SUPABASE_URL.includes('your-project')
);

if (!isSupabaseConfigured && typeof console !== 'undefined') {
  console.info(
    'Supabase live mode is disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect to a live project.'
  );
}

// Standard Supabase client instance
export const rawSupabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Demo / Seed Storage for interactive Hackathon execution
const LOCAL_STORAGE_KEY = 'royalsquare_db_state_v1';

export interface AppDatabaseState {
  currentUser: any;
  profiles: any[];
  clients: any[];
  dependants: any[];
  beneficiaries: any[];
  assets: any[];
  liabilities: any[];
  income: any[];
  expenses: any[];
  policies: any[];
  investments: any[];
  goals: any[];
  requests: any[];
  request_workflows: any[];
  claims: any[];
  claim_timeline: any[];
  claim_witnesses: any[];
  claim_vehicles: any[];
  tasks: any[];
  reminders: any[];
  notifications: any[];
  messages: any[];
  documents: any[];
  providers: any[];
  audit_logs: any[];
}

export function getDefaultSeedState(): AppDatabaseState {
  return {
    currentUser: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'sipho.dlamini@royalsquare.co.za',
      first_name: 'Sipho',
      last_name: 'Dlamini',
      role: 'client',
      phone: '+27 82 555 1234',
      is_active: true,
    },
    profiles: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'sipho.dlamini@royalsquare.co.za',
        first_name: 'Sipho',
        last_name: 'Dlamini',
        phone: '+27 82 555 1234',
        role: 'client',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'adviser@royalsquare.co.za',
        first_name: 'Kagiso',
        last_name: 'Mabena',
        phone: '+27 11 884 9000',
        role: 'adviser',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'compliance@royalsquare.co.za',
        first_name: 'Liezel',
        last_name: 'Botha',
        phone: '+27 11 884 9001',
        role: 'compliance',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'thabo.molefe@royalsquare.co.za',
        first_name: 'Thabo',
        last_name: 'Molefe',
        phone: '+27 71 334 5566',
        role: 'client',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    clients: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        profile_id: '11111111-1111-1111-1111-111111111111',
        client_number: 'RSF-C-10492',
        id_number: '8506125089087',
        date_of_birth: '1985-06-12',
        nationality: 'South African',
        marital_status: 'Married in Community of Property',
        occupation: 'Senior IT Director',
        employer: 'Standard Bank Group',
        address_line_1: '44 West Road South',
        address_line_2: 'Morningside Ext 4',
        city: 'Sandton',
        province: 'Gauteng',
        postal_code: '2196',
        country: 'South Africa',
        preferred_contact_method: 'app',
        risk_profile: 'Moderate Aggressive',
        adviser_id: '22222222-2222-2222-2222-222222222222',
        onboarding_completed: true,
        notes: 'Client prioritizes wealth preservation, private school education endowment, and comprehensive offshore diversification.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbba',
        profile_id: '44444444-4444-4444-4444-444444444444',
        client_number: 'RSF-C-10519',
        id_number: '9002145102084',
        date_of_birth: '1990-02-14',
        nationality: 'South African',
        marital_status: 'Single',
        occupation: 'Commercial Attorney',
        employer: 'Bowmans Law',
        address_line_1: '12 Melrose Boulevard',
        address_line_2: 'Melrose Arch',
        city: 'Johannesburg',
        province: 'Gauteng',
        postal_code: '2076',
        country: 'South Africa',
        preferred_contact_method: 'email',
        risk_profile: 'Aggressive Growth',
        adviser_id: '22222222-2222-2222-2222-222222222222',
        onboarding_completed: true,
        notes: 'Tech enthusiast looking for high-growth tech ETFs and personal indemnity coverage.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    dependants: [
      {
        id: 'dep-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        full_name: 'Nomvula Dlamini',
        relationship: 'Spouse',
        date_of_birth: '1987-03-22',
        id_number: '8703220192083',
        is_dependent: true,
      },
      {
        id: 'dep-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        full_name: 'Lwazi Dlamini',
        relationship: 'Son',
        date_of_birth: '2015-08-14',
        id_number: '1508145091082',
        is_dependent: true,
      },
      {
        id: 'dep-3',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        full_name: 'Zinhle Dlamini',
        relationship: 'Daughter',
        date_of_birth: '2018-11-03',
        id_number: '1811030094081',
        is_dependent: true,
      },
    ],
    beneficiaries: [
      {
        id: 'ben-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        full_name: 'Nomvula Dlamini',
        relationship: 'Spouse',
        id_number: '8703220192083',
        percentage: 70,
        contact_number: '+27 82 444 9876',
        email: 'nomvula.dlamini@example.com',
      },
      {
        id: 'ben-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        full_name: 'Lwazi Dlamini',
        relationship: 'Son',
        id_number: '1508145091082',
        percentage: 15,
        contact_number: null,
        email: null,
      },
      {
        id: 'ben-3',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        full_name: 'Zinhle Dlamini',
        relationship: 'Daughter',
        id_number: '1811030094081',
        percentage: 15,
        contact_number: null,
        email: null,
      },
    ],
    assets: [
      {
        id: 'asset-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        asset_type: 'property',
        name: 'Primary Residence - Morningside',
        description: '4-bedroom family home in Morningside, Sandton with solar backup',
        current_value: 4200000.0,
        institution: 'FNB Private Wealth',
      },
      {
        id: 'asset-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        asset_type: 'vehicle',
        name: '2023 BMW X5 xDrive30d M-Sport',
        description: 'Registration CA 849-291, full comprehensive cover',
        current_value: 1350000.0,
        institution: 'BMW Financial Services',
      },
      {
        id: 'asset-3',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        asset_type: 'cash',
        name: 'Emergency Liquidity Reserve',
        description: '32-day high yield notice deposit',
        current_value: 280000.0,
        institution: 'Investec Private Bank',
      },
    ],
    liabilities: [
      {
        id: 'liab-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        liability_type: 'bond',
        name: 'Home Mortgage Bond (FNB)',
        institution: 'FNB Homeloans',
        outstanding_balance: 1850000.0,
        monthly_payment: 21450.0,
        interest_rate: 11.25,
      },
      {
        id: 'liab-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        liability_type: 'vehicle_finance',
        name: 'BMW Select Vehicle Loan',
        institution: 'BMW Finance',
        outstanding_balance: 430000.0,
        monthly_payment: 14200.0,
        interest_rate: 10.75,
      },
    ],
    income: [
      {
        id: 'inc-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        source: 'Executive IT Director Salary (Standard Bank)',
        amount: 145000.0,
        frequency: 'monthly',
      },
      {
        id: 'inc-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        source: 'Sandton Investment Property Rental',
        amount: 18500.0,
        frequency: 'monthly',
      },
    ],
    expenses: [
      {
        id: 'exp-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        category: 'Mortgage, Municipal Rates & Levies',
        amount: 26500.0,
        frequency: 'monthly',
      },
      {
        id: 'exp-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        category: 'Vehicle Loan Installment & Fuel',
        amount: 18200.0,
        frequency: 'monthly',
      },
      {
        id: 'exp-3',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        category: 'Private School Tuition (Redhill)',
        amount: 19000.0,
        frequency: 'monthly',
      },
      {
        id: 'exp-4',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        category: 'Household Groceries & Utilities',
        amount: 22000.0,
        frequency: 'monthly',
      },
      {
        id: 'exp-5',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        category: 'Discovery Health & Life Insurance',
        amount: 14500.0,
        frequency: 'monthly',
      },
    ],
    policies: [
      {
        id: 'pol-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        policy_number: 'DISC-LF-94821',
        policy_type: 'Comprehensive Life, Disability & Severe Illness',
        premium: 3450.0,
        premium_frequency: 'monthly',
        sum_assured: 10000000.0,
        status: 'active',
        start_date: '2020-02-01',
        renewal_date: '2026-02-01',
        debit_order_day: 1,
        provider_name: 'Discovery Life',
      },
      {
        id: 'pol-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        policy_number: 'SNT-MOT-10293',
        policy_type: 'Comprehensive Motor & Household Content',
        premium: 2890.0,
        premium_frequency: 'monthly',
        sum_assured: 2500000.0,
        status: 'active',
        start_date: '2021-05-15',
        renewal_date: '2026-05-15',
        debit_order_day: 1,
        provider_name: 'Santam Insurance',
      },
    ],
    investments: [
      {
        id: 'inv-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        investment_name: 'Allan Gray Balanced Fund Class A',
        account_number: 'AG-849102',
        current_value: 1250000.0,
        monthly_contribution: 12500.0,
        investment_type: 'Retirement Annuity',
        provider_name: 'Allan Gray',
      },
      {
        id: 'inv-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        investment_name: 'Old Mutual Global Equity Feeder Fund',
        account_number: 'OM-391024',
        current_value: 980000.0,
        monthly_contribution: 8000.0,
        investment_type: 'Offshore Flexible Investment',
        provider_name: 'Old Mutual Wealth',
      },
    ],
    goals: [
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Retirement Independence 2038',
        goal_type: 'retirement',
        description: 'Targeting sustainable 5% drawdown lifestyle at age 53',
        target_amount: 15000000.0,
        current_amount: 9750000.0,
        target_date: '2038-06-30',
        status: 'active',
        is_shared: true,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Children Tertiary Education Endowment',
        goal_type: 'education',
        description: 'University endowment and overseas study fund for Lwazi and Zinhle',
        target_amount: 1200000.0,
        current_amount: 540000.0,
        target_date: '2033-01-15',
        status: 'active',
        is_shared: true,
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Cape Coastal Villa Deposit',
        goal_type: 'property',
        description: 'Deposit and transfer duty for Plettenberg Bay holiday retreat',
        target_amount: 2500000.0,
        current_amount: 1450000.0,
        target_date: '2028-12-01',
        status: 'active',
        is_shared: false,
      },
    ],
    requests: [
      {
        id: 'req-001',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '11111111-1111-1111-1111-111111111111',
        assigned_to: '22222222-2222-2222-2222-222222222222',
        request_number: 'RSF-20250915-A1092',
        request_type: 'policy_document',
        title: 'Request updated Discovery Life policy schedule',
        description: 'Need certified copy of policy schedule including severe illness rider for homeloan refinancing.',
        status: 'in_progress',
        priority: 'normal',
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        completed_at: null,
        metadata: { provider: 'Discovery Life' },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'req-002',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '11111111-1111-1111-1111-111111111111',
        assigned_to: '22222222-2222-2222-2222-222222222222',
        request_number: 'RSF-20250810-B9481',
        request_type: 'border_letter',
        title: 'Cross-Border Vehicle Letter (Botswana Trip)',
        description: 'Request clearance letter for BMW X5 travel across Ramatlabama border post.',
        status: 'completed',
        priority: 'high',
        due_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 12).toISOString(),
        metadata: { destination: 'Botswana' },
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ],
    request_workflows: [
      {
        id: 'wf-1-1',
        request_id: 'req-001',
        step_number: 1,
        step_key: 'submitted',
        step_name: 'Request submitted',
        status: 'completed',
        started_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        notes: 'Submitted via Royal Square Client Portal.',
      },
      {
        id: 'wf-1-2',
        request_id: 'req-001',
        step_number: 2,
        step_key: 'review',
        step_name: 'Royal Square review',
        status: 'completed',
        started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        notes: 'Reviewed by adviser Kagiso Mabena. Verified policy DISC-LF-94821.',
      },
      {
        id: 'wf-1-3',
        request_id: 'req-001',
        step_number: 3,
        step_key: 'processing',
        step_name: 'Processing with Provider',
        status: 'in_progress',
        started_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        completed_at: null,
        notes: 'Requested digital certificate batch from Discovery Adviser Brokerage Services.',
      },
      {
        id: 'wf-1-4',
        request_id: 'req-001',
        step_number: 4,
        step_key: 'complete',
        step_name: 'Completed & Delivered',
        status: 'pending',
        started_at: null,
        completed_at: null,
        notes: null,
      },
    ],
    claims: [
      {
        id: 'clm-001',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '11111111-1111-1111-1111-111111111111',
        assigned_to: '22222222-2222-2222-2222-222222222222',
        provider_id: 'prov-santam',
        claim_number: 'CLM-20250918-X9921',
        claim_type: 'motor',
        status: 'handler_assigned',
        incident_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        incident_location: 'Corner Rivonia Rd & Sandton Dr, Sandton, Johannesburg',
        incident_description: 'Stationary at red traffic light. Third-party vehicle failed to brake in wet conditions and collided into rear bumper of BMW X5.',
        police_reported: true,
        police_case_number: 'CAS 412/09/2025',
        police_station: 'Sandton SAPS',
        insurer_reference: 'SNT-774910-MOT',
        handler_name: 'Sarah Van Der Merwe',
        handler_contact: '+27 11 912 3401 / claims@santam.mock',
        assessment_date: new Date(Date.now() + 86400000 * 1).toISOString(),
        repair_authorised: true,
        repair_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        hire_car_required: true,
        hire_car_provider: 'Europcar Sandton City',
        hire_car_start: new Date().toISOString(),
        hire_car_end: new Date(Date.now() + 86400000 * 10).toISOString(),
        closed_at: null,
        metadata: {
          thirdPartyVehicle: 'Toyota Hilux double cab (Reg: GP 992-102)',
          driverInjuries: 'None reported; air-bags not deployed.',
        },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    claim_timeline: [
      {
        id: 'tl-1',
        claim_id: 'clm-001',
        created_by: '11111111-1111-1111-1111-111111111111',
        status: 'reported',
        title: 'Incident Reported by Client',
        description: 'Motor loss incident submitted with SAPS case number and accident photos.',
        is_client_visible: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'tl-2',
        claim_id: 'clm-001',
        created_by: '22222222-2222-2222-2222-222222222222',
        status: 'submitted',
        title: 'Claim Validated by Royal Square Adviser',
        description: 'Adviser Kagiso Mabena reviewed policy schedule SNT-MOT-10293 and verified excess waiver.',
        is_client_visible: true,
        created_at: new Date(Date.now() - 86400000 * 1.8).toISOString(),
      },
      {
        id: 'tl-3',
        claim_id: 'clm-001',
        created_by: '22222222-2222-2222-2222-222222222222',
        status: 'insurer_received',
        title: 'Transmitted to Santam Claims Bureau',
        description: 'Electronic claim lodged under insurer ref: SNT-774910-MOT.',
        is_client_visible: true,
        created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
      {
        id: 'tl-4',
        claim_id: 'clm-001',
        created_by: '22222222-2222-2222-2222-222222222222',
        status: 'handler_assigned',
        title: 'Senior Assessor Assigned: Sarah Van Der Merwe',
        description: 'Physical vehicle inspection scheduled at Renew-It Sandton panel beater.',
        is_client_visible: true,
        created_at: new Date(Date.now() - 86400000 * 1.1).toISOString(),
      },
    ],
    claim_witnesses: [
      {
        id: 'wit-1',
        claim_id: 'clm-001',
        full_name: 'Constable Johannes Sithole',
        phone: '+27 11 891 0200',
        email: 'sandton.saps@saps.gov.za',
        address: 'Sandton Police Station, Summit Rd',
        statement: 'Attended scene. Confirmed rear-end stationary impact.',
        voice_note_path: null,
      },
    ],
    claim_vehicles: [
      {
        id: 'veh-1',
        claim_id: 'clm-001',
        is_client_vehicle: true,
        registration_number: 'CA 849-291',
        make: 'BMW',
        model: 'X5 xDrive30d',
        year: 2023,
        driver_name: 'Sipho Dlamini',
        driver_license_number: 'DL8506129841',
        owner_name: 'Sipho Dlamini',
        insurer_name: 'Santam Insurance',
        policy_number: 'SNT-MOT-10293',
        damage_description: 'Rear tailgate, lower apron, reverse cameras and acoustic sensors crushed.',
      },
    ],
    tasks: [
      {
        id: 'tsk-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        assigned_to: '22222222-2222-2222-2222-222222222222',
        request_id: 'req-001',
        claim_id: null,
        title: 'Download verified Discovery schedule for Sipho Dlamini',
        description: 'Ensure critical illness rider is stamped by broker division.',
        status: 'in_progress',
        priority: 'normal',
        due_date: new Date(Date.now() + 86400000 * 1).toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tsk-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        assigned_to: '22222222-2222-2222-2222-222222222222',
        request_id: null,
        claim_id: 'clm-001',
        title: 'Follow up Santam assessor report & courtesy car booking',
        description: 'Confirm Europcar Sandton City booking voucher has been issued.',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 3600000 * 8).toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    reminders: [
      {
        id: 'rem-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '22222222-2222-2222-2222-222222222222',
        title: 'Driver Licence Card Renewal Expiry',
        description: 'Card DL8506129841 matures in 45 days. Schedule eye test and booking.',
        reminder_date: new Date(Date.now() + 86400000 * 45).toISOString(),
        frequency: 'every_two_years',
        is_completed: false,
        notify_client: true,
        notify_adviser: true,
        related_document_id: null,
        related_policy_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rem-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        created_by: '22222222-2222-2222-2222-222222222222',
        title: 'Annual Comprehensive Wealth & Tax Review',
        description: 'Review offshore allocation, section 10B exemptions, and retirement contributions.',
        reminder_date: new Date(Date.now() + 86400000 * 14).toISOString(),
        frequency: 'yearly',
        is_completed: false,
        notify_client: true,
        notify_adviser: true,
        related_document_id: null,
        related_policy_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    notifications: [
      {
        id: 'notif-1',
        user_id: '11111111-1111-1111-1111-111111111111',
        notification_type: 'claim',
        channel: 'in_app',
        title: 'Claim Update: Assessor Assigned',
        body: 'Santam has assigned Sarah Van Der Merwe (+27 11 912 3401) to your BMW X5 claim CLM-20250918-X9921.',
        request_id: null,
        claim_id: 'clm-001',
        reminder_id: null,
        document_id: null,
        is_read: false,
        read_at: null,
        metadata: {},
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'notif-2',
        user_id: '11111111-1111-1111-1111-111111111111',
        notification_type: 'request',
        channel: 'in_app',
        title: 'Request Update: In Progress',
        body: 'Adviser Kagiso Mabena is retrieving your Discovery Life schedule RSF-20250915-A1092.',
        request_id: 'req-001',
        claim_id: null,
        reminder_id: null,
        document_id: null,
        is_read: true,
        read_at: new Date(Date.now() - 86400000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
    ],
    messages: [
      {
        id: 'msg-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        sender_id: '11111111-1111-1111-1111-111111111111',
        recipient_id: '22222222-2222-2222-2222-222222222222',
        request_id: 'req-001',
        claim_id: null,
        direction: 'client_to_royal',
        subject: 'Urgency on Discovery Life Schedule',
        body: 'Hi Kagiso, the bank homeloan officer needs the policy schedule by Thursday afternoon. Appreciate your help with this!',
        attachment_path: null,
        is_read: true,
        read_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
        sender_name: 'Sipho Dlamini',
      },
      {
        id: 'msg-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        sender_id: '22222222-2222-2222-2222-222222222222',
        recipient_id: '11111111-1111-1111-1111-111111111111',
        request_id: 'req-001',
        claim_id: null,
        direction: 'royal_to_client',
        subject: 'Re: Urgency on Discovery Life Schedule',
        body: 'Good morning Sipho, Discovery broker desk confirmed priority dispatch. I will upload the certified stamped PDF directly to your document vault today.',
        attachment_path: null,
        is_read: true,
        read_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 1.8).toISOString(),
        sender_name: 'Kagiso Mabena (Adviser)',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        uploaded_by: '11111111-1111-1111-1111-111111111111',
        document_type: 'id_document',
        name: 'South African Smart ID Card - Sipho Dlamini.pdf',
        storage_path: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/id_card_verified.pdf',
        mime_type: 'application/pdf',
        file_size: 1420800,
        is_verified: true,
        verified_by: '33333333-3333-3333-3333-333333333333',
        verified_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        metadata: { popiaCompliant: true, identityNumber: '8506125089087' },
        created_at: new Date(Date.now() - 86400000 * 65).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
      {
        id: 'doc-2',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        uploaded_by: '11111111-1111-1111-1111-111111111111',
        document_type: 'proof_of_address',
        name: 'City of Johannesburg Municipal Rates - August 2025.pdf',
        storage_path: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/rates_aug_2025.pdf',
        mime_type: 'application/pdf',
        file_size: 890400,
        is_verified: true,
        verified_by: '33333333-3333-3333-3333-333333333333',
        verified_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        metadata: { utilityAddress: '44 West Road South, Morningside' },
        created_at: new Date(Date.now() - 86400000 * 22).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      },
      {
        id: 'doc-3',
        client_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        uploaded_by: '22222222-2222-2222-2222-222222222222',
        document_type: 'policy_document',
        name: 'Santam Motor Policy Schedule - SNT-MOT-10293.pdf',
        storage_path: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/santam_policy_10293.pdf',
        mime_type: 'application/pdf',
        file_size: 2100400,
        is_verified: true,
        verified_by: '22222222-2222-2222-2222-222222222222',
        verified_at: new Date(Date.now() - 86400000 * 40).toISOString(),
        metadata: { policyNumber: 'SNT-MOT-10293' },
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 40).toISOString(),
      },
    ],
    providers: [
      {
        id: 'prov-sanlam',
        name: 'Sanlam',
        provider_type: 'insurance_and_investments',
        api_enabled: false,
        mock_enabled: true,
        contact_email: 'mock@sanlam.example',
        contact_phone: '+27 21 947 9111',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prov-oldmutual',
        name: 'Old Mutual',
        provider_type: 'insurance_and_investments',
        api_enabled: false,
        mock_enabled: true,
        contact_email: 'mock@oldmutual.example',
        contact_phone: '+27 11 217 1000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prov-liberty',
        name: 'Liberty',
        provider_type: 'insurance_and_investments',
        api_enabled: false,
        mock_enabled: true,
        contact_email: 'mock@liberty.example',
        contact_phone: '+27 11 408 3911',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prov-momentum',
        name: 'Momentum',
        provider_type: 'insurance_and_investments',
        api_enabled: false,
        mock_enabled: true,
        contact_email: 'mock@momentum.example',
        contact_phone: '+27 12 671 8911',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prov-discovery',
        name: 'Discovery',
        provider_type: 'insurance_and_investments',
        api_enabled: false,
        mock_enabled: true,
        contact_email: 'mock@discovery.example',
        contact_phone: '+27 11 529 2888',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prov-allangray',
        name: 'Allan Gray',
        provider_type: 'investments',
        api_enabled: false,
        mock_enabled: true,
        contact_email: 'mock@allangray.example',
        contact_phone: '+27 21 415 2300',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prov-santam',
        name: 'Santam',
        provider_type: 'insurance',
        api_enabled: false,
        mock_enabled: true,
        contact_email: 'mock@santam.example',
        contact_phone: '+27 21 915 7000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    audit_logs: [
      {
        id: 'aud-1',
        user_id: '11111111-1111-1111-1111-111111111111',
        action: 'login',
        table_name: 'auth.users',
        record_id: '11111111-1111-1111-1111-111111111111',
        description: 'Client authentication successful via Client PWA.',
        old_data: null,
        new_data: { method: 'password', ip: '102.132.84.19' },
        ip_address: '102.132.84.19',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        user_email: 'sipho.dlamini@royalsquare.co.za',
      },
      {
        id: 'aud-2',
        user_id: '11111111-1111-1111-1111-111111111111',
        action: 'create',
        table_name: 'claims',
        record_id: 'clm-001',
        description: 'Motor loss claim CLM-20250918-X9921 submitted by client.',
        old_data: null,
        new_data: { claimType: 'motor', policeCaseNumber: 'CAS 412/09/2025' },
        ip_address: '102.132.84.19',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        user_email: 'sipho.dlamini@royalsquare.co.za',
      },
      {
        id: 'aud-3',
        user_id: '22222222-2222-2222-2222-222222222222',
        action: 'status_change',
        table_name: 'claims',
        record_id: 'clm-001',
        description: 'Adviser updated claim status from submitted to handler_assigned.',
        old_data: { status: 'submitted' },
        new_data: { status: 'handler_assigned', handler: 'Sarah Van Der Merwe' },
        ip_address: '197.229.130.4',
        created_at: new Date(Date.now() - 86400000 * 1.1).toISOString(),
        user_email: 'adviser@royalsquare.co.za',
      },
    ],
  };
}

// State manager used only as an in-memory cache for legacy synchronous screens.
class LocalSupabaseStore {
  private state: AppDatabaseState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppDatabaseState {
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

  public saveState() {
    if (rawSupabase) {
      this.notify();
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
      }
      this.notify();
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  public getState(): AppDatabaseState {
    return this.state;
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    }
  }
}

export const localStore = new LocalSupabaseStore();

const REMOTE_TABLES = [
  'profiles',
  'clients',
  'dependants',
  'beneficiaries',
  'assets',
  'liabilities',
  'income',
  'expenses',
  'policies',
  'investments',
  'goals',
  'requests',
  'request_workflows',
  'claims',
  'claim_timeline',
  'claim_witnesses',
  'claim_vehicles',
  'tasks',
  'reminders',
  'notifications',
  'messages',
  'documents',
  'providers',
  'audit_logs',
] as const;

export async function hydrateRemoteState(): Promise<void> {
  if (!rawSupabase) return;

  const { data: authData } = await rawSupabase.auth.getUser();
  if (!authData.user) {
    localStore.getState().currentUser = null;
    return;
  }

  const { data: profile, error: profileError } = await rawSupabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw profileError || new Error('Authenticated user has no public profile.');
  }

  const state = localStore.getState();
  state.currentUser = profile;

  const results = await Promise.all(
    REMOTE_TABLES.map(async (tableName) => {
      const response = await rawSupabase.from(tableName).select('*');
      return { tableName, data: response.data || [], error: response.error };
    })
  );

  const failedTable = results.find((result) => result.error);
  if (failedTable?.error) {
    throw failedTable.error;
  }

  for (const result of results) {
    (state as unknown as Record<string, unknown>)[result.tableName] = result.data;
  }

  state.clients = state.clients.map((client) => ({
    ...client,
    profile: state.profiles.find((profile) => profile.id === client.profile_id),
    adviser: state.profiles.find((profile) => profile.id === client.adviser_id),
  }));

  localStore.saveState();
}

// High-fidelity Mock Supabase Client adapter wrapping the state store
export const supabase = {
  auth: {
    getUser: async () => {
      if (rawSupabase) {
        return rawSupabase.auth.getUser();
      }
      return { data: { user: null }, error: new Error('Supabase is not configured.') };
    },
    getSession: async () => {
      if (rawSupabase) {
        return rawSupabase.auth.getSession();
      }
      return { data: { session: null }, error: new Error('Supabase is not configured.') };
    },
    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      if (rawSupabase) {
        return rawSupabase.auth.signInWithPassword({ email, password: password || '' });
      }
      return { data: { user: null, session: null }, error: new Error('Supabase is not configured.') };
    },
    signUp: async ({ email, password, options }: { email: string; password?: string; options?: { data?: Record<string, any> } }) => {
      if (rawSupabase) {
        return rawSupabase.auth.signUp({ email, password: password || '', options });
      }
      return { data: { user: null, session: null }, error: new Error('Supabase is not configured.') };
    },
    updateUser: async ({ data }: { data: Record<string, any> }) => {
      if (rawSupabase) {
        return rawSupabase.auth.updateUser({ data });
      }
      return { data: { user: null }, error: new Error('Supabase is not configured.') };
    },
    signOut: async () => {
      if (rawSupabase) {
        return rawSupabase.auth.signOut();
      }
      return { error: new Error('Supabase is not configured.') };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      if (rawSupabase) {
        return rawSupabase.auth.onAuthStateChange(callback);
      }
      return { data: { subscription: { unsubscribe: () => undefined } } };
    },
  },

  from: (tableName: keyof AppDatabaseState | string) => {
    if (rawSupabase) {
      return rawSupabase.from(tableName as string) as any;
    }

    return {
      select: (columns: string = '*') => {
        const state = localStore.getState();
        const records = (state as any)[tableName] || [];
        return {
          eq: (col: string, val: any) => {
            const filtered = records.filter((r: any) => r[col] === val);
            return {
              single: async () => ({ data: filtered[0] || null, error: null }),
              order: (orderCol: string, opts?: { ascending?: boolean }) => {
                const sorted = [...filtered].sort((a, b) => {
                  const valA = a[orderCol];
                  const valB = b[orderCol];
                  return opts?.ascending ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
                });
                return Promise.resolve({ data: sorted, error: null });
              },
              then: (resolve: any) => resolve({ data: filtered, error: null }),
            };
          },
          order: (col: string, opts?: { ascending?: boolean }) => {
            const sorted = [...records].sort((a, b) => {
              const valA = a[col];
              const valB = b[col];
              return opts?.ascending ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
            });
            return {
              limit: (limitNum: number) => Promise.resolve({ data: sorted.slice(0, limitNum), error: null }),
              then: (resolve: any) => resolve({ data: sorted, error: null }),
            };
          },
          single: async () => ({ data: records[0] || null, error: null }),
          then: (resolve: any) => resolve({ data: [...records], error: null }),
        };
      },

      insert: async (data: any) => {
        const state = localStore.getState();
        const list = (state as any)[tableName] = (state as any)[tableName] || [];
        const items = Array.isArray(data) ? data : [data];
        const inserted = items.map((item) => ({
          id: item.id || `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item,
        }));
        list.push(...inserted);
        localStore.saveState();
        return { data: inserted, error: null };
      },

      update: (updates: any) => {
        return {
          eq: async (col: string, val: any) => {
            const state = localStore.getState();
            const list = (state as any)[tableName] || [];
            let updatedCount = 0;
            const updatedItems: any[] = [];
            for (let i = 0; i < list.length; i++) {
              if (list[i][col] === val) {
                list[i] = { ...list[i], ...updates, updated_at: new Date().toISOString() };
                updatedItems.push(list[i]);
                updatedCount++;
              }
            }
            localStore.saveState();
            return { data: updatedItems, count: updatedCount, error: null };
          },
        };
      },

      delete: () => {
        return {
          eq: async (col: string, val: any) => {
            const state = localStore.getState();
            const list = (state as any)[tableName] || [];
            (state as any)[tableName] = list.filter((item: any) => item[col] !== val);
            localStore.saveState();
            return { error: null };
          },
        };
      },
    };
  },

  rpc: async (funcName: string, params: any) => {
    if (rawSupabase) {
      return rawSupabase.rpc(funcName, params);
    }

    const state = localStore.getState();
    const currentUser = state.currentUser;
    const client = state.clients[0];

    if (funcName === 'client_net_worth') {
      const clientId = params?.p_client_id || client?.id;
      const totalAssets = state.assets
        .filter((a) => a.client_id === clientId)
        .reduce((sum, a) => sum + (Number(a.current_value) || 0), 0);
      const totalInvestments = state.investments
        .filter((i) => i.client_id === clientId)
        .reduce((sum, i) => sum + (Number(i.current_value) || 0), 0);
      const totalLiabilities = state.liabilities
        .filter((l) => l.client_id === clientId)
        .reduce((sum, l) => sum + (Number(l.outstanding_balance) || 0), 0);
      return { data: totalAssets + totalInvestments - totalLiabilities, error: null };
    }

    if (funcName === 'create_client_request') {
      const requestId = `req-${Date.now().toString(36)}`;
      const requestNumber = `RSF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newReq = {
        id: requestId,
        client_id: client?.id,
        created_by: currentUser?.id,
        assigned_to: client?.adviser_id || '22222222-2222-2222-2222-222222222222',
        request_number: requestNumber,
        request_type: params.p_request_type,
        title: params.p_title,
        description: params.p_description || null,
        status: 'submitted',
        priority: params.p_priority || 'normal',
        due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
        completed_at: null,
        metadata: params.p_metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      state.requests.unshift(newReq);

      // Initialize 4-step workflow
      state.request_workflows.push(
        {
          id: `wf-${requestId}-1`,
          request_id: requestId,
          step_number: 1,
          step_key: 'submitted',
          step_name: 'Request submitted',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          notes: 'Submitted via Client Portal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: `wf-${requestId}-2`,
          request_id: requestId,
          step_number: 2,
          step_key: 'review',
          step_name: 'Royal Square review',
          status: 'pending',
          started_at: null,
          completed_at: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: `wf-${requestId}-3`,
          request_id: requestId,
          step_number: 3,
          step_key: 'processing',
          step_name: 'Processing with Provider',
          status: 'pending',
          started_at: null,
          completed_at: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: `wf-${requestId}-4`,
          request_id: requestId,
          step_number: 4,
          step_key: 'complete',
          step_name: 'Completed',
          status: 'pending',
          started_at: null,
          completed_at: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );

      // Notify adviser
      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: '22222222-2222-2222-2222-222222222222',
        notification_type: 'request',
        channel: 'in_app',
        title: 'New Service Request Logged',
        body: `${client ? 'Sipho Dlamini' : 'Client'} submitted request ${requestNumber}: "${params.p_title}".`,
        request_id: requestId,
        claim_id: null,
        reminder_id: null,
        document_id: null,
        is_read: false,
        read_at: null,
        metadata: {},
        created_at: new Date().toISOString(),
      });

      supabase.logAudit('create', 'requests', requestId, `Request ${requestNumber} submitted: ${params.p_title}`);
      localStore.saveState();
      return { data: requestId, error: null };
    }

    if (funcName === 'create_motor_claim') {
      const claimId = `clm-${Date.now().toString(36)}`;
      const claimNumber = `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newClaim = {
        id: claimId,
        client_id: client?.id,
        created_by: currentUser?.id,
        assigned_to: client?.adviser_id || '22222222-2222-2222-2222-222222222222',
        provider_id: params.p_provider_id || 'prov-santam',
        claim_number: claimNumber,
        claim_type: 'motor',
        status: 'reported',
        incident_date: params.p_incident_date,
        incident_location: params.p_incident_location,
        incident_description: params.p_incident_description,
        police_reported: true,
        police_case_number: params.p_police_case_number || 'CAS 591/09/2025',
        police_station: params.p_police_station || 'Sandton SAPS',
        insurer_reference: null,
        handler_name: null,
        handler_contact: null,
        assessment_date: null,
        repair_authorised: false,
        repair_date: null,
        hire_car_required: true,
        hire_car_provider: null,
        hire_car_start: null,
        hire_car_end: null,
        closed_at: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      state.claims.unshift(newClaim);

      state.claim_timeline.unshift({
        id: `tl-${claimId}-1`,
        claim_id: claimId,
        created_by: currentUser?.id,
        status: 'reported',
        title: 'Accident Reported by Client',
        description: `Incident at ${params.p_incident_location}. Claim ${claimNumber} logged.`,
        is_client_visible: true,
        created_at: new Date().toISOString(),
      });

      // Notification for adviser
      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: '22222222-2222-2222-2222-222222222222',
        notification_type: 'claim',
        channel: 'in_app',
        title: 'URGENT: Motor Claim Reported',
        body: `Client ${client ? 'Sipho Dlamini' : 'Client'} logged motor loss claim ${claimNumber}.`,
        request_id: null,
        claim_id: claimId,
        reminder_id: null,
        document_id: null,
        is_read: false,
        read_at: null,
        metadata: {},
        created_at: new Date().toISOString(),
      });

      supabase.logAudit('create', 'claims', claimId, `Motor claim ${claimNumber} created: ${params.p_incident_location}`);
      localStore.saveState();
      return { data: claimId, error: null };
    }

    if (funcName === 'update_claim_status') {
      const claim = state.claims.find((c) => c.id === params.p_claim_id);
      if (claim) {
        const oldStatus = claim.status;
        claim.status = params.p_status;
        claim.updated_at = new Date().toISOString();

        if (params.p_handler_name) claim.handler_name = params.p_handler_name;
        if (params.p_handler_contact) claim.handler_contact = params.p_handler_contact;
        if (params.p_repair_authorised !== undefined) claim.repair_authorised = params.p_repair_authorised;

        state.claim_timeline.unshift({
          id: `tl-${Date.now()}`,
          claim_id: claim.id,
          created_by: currentUser?.id,
          status: params.p_status,
          title: `Claim Status: ${params.p_status.replace(/_/g, ' ').toUpperCase()}`,
          description: params.p_description || `Status progressed to ${params.p_status.replace(/_/g, ' ')}.`,
          is_client_visible: true,
          created_at: new Date().toISOString(),
        });

        // Notify client
        state.notifications.unshift({
          id: `notif-${Date.now()}`,
          user_id: '11111111-1111-1111-1111-111111111111',
          notification_type: 'claim',
          channel: 'in_app',
          title: `Motor Claim Update: ${params.p_status.replace(/_/g, ' ')}`,
          body: `Your claim ${claim.claim_number} is now ${params.p_status.replace(/_/g, ' ')}.`,
          request_id: null,
          claim_id: claim.id,
          reminder_id: null,
          document_id: null,
          is_read: false,
          read_at: null,
          metadata: {},
          created_at: new Date().toISOString(),
        });

        supabase.logAudit('status_change', 'claims', claim.id, `Claim status changed from ${oldStatus} to ${params.p_status}`);
        localStore.saveState();
        return { data: true, error: null };
      }
      return { data: false, error: new Error('Claim not found') };
    }

    return { data: null, error: null };
  },

  storage: {
    from: (bucketName: string) => ({
      upload: async (path: string, file: any) => {
        if (rawSupabase) {
          return rawSupabase.storage.from(bucketName).upload(path, file);
        }

        const state = localStore.getState();
        const client = state.clients[0];
        const docId = `doc-${Date.now()}`;
        state.documents.unshift({
          id: docId,
          client_id: client?.id,
          uploaded_by: state.currentUser?.id,
          document_type: 'compliance_document',
          name: file.name || path.split('/').pop() || 'Uploaded Document.pdf',
          storage_path: path,
          mime_type: file.type || 'application/pdf',
          file_size: file.size || 102400,
          is_verified: false,
          verified_by: null,
          verified_at: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        supabase.logAudit('upload', 'documents', docId, `Document uploaded: ${path}`);
        localStore.saveState();
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        if (rawSupabase) {
          return rawSupabase.storage.from(bucketName).getPublicUrl(path);
        }

        return { data: { publicUrl: `https://storage.royalsquare.co.za/${bucketName}/${path}` } };
      },
      createSignedUrl: async (path: string, expiresIn: number) => {
        if (rawSupabase) {
          return rawSupabase.storage.from(bucketName).createSignedUrl(path, expiresIn);
        }

        return { data: { signedUrl: `https://storage.royalsquare.co.za/${bucketName}/${path}?token=signed_${Date.now()}` }, error: null };
      },
    }),
  },

  channel: (channelName: string) => {
    if (rawSupabase) {
      return rawSupabase.channel(channelName) as any;
    }

    return {
      on: (event: string, filter: any, callback: (payload: any) => void) => {
        // Register Realtime listener
        const unsubscribe = localStore.subscribe(() => {
          callback({ event, new: localStore.getState() });
        });
        return {
          subscribe: () => ({ unsubscribe }),
        };
      },
      subscribe: () => ({ unsubscribe: () => {} }),
    };
  },

  logAudit: (action: string, tableName: string, recordId: string, description: string) => {
    if (rawSupabase) {
      void rawSupabase.from('audit_logs').insert({
        action,
        table_name: tableName,
        record_id: recordId,
        description,
      });
      return;
    }

    const state = localStore.getState();
    state.audit_logs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: state.currentUser?.id || null,
      action,
      table_name: tableName,
      record_id: recordId,
      description,
      old_data: null,
      new_data: null,
      ip_address: '102.132.84.19',
      created_at: new Date().toISOString(),
      user_email: state.currentUser?.email || 'system@royalsquare.co.za',
    });
    localStore.saveState();
  },
};
