-- Supabase Seed Data for Royal Square Financial Demo

-- 1. Profiles
insert into public.profiles (id, email, first_name, last_name, phone, role, is_active)
values
    ('11111111-1111-1111-1111-111111111111', 'sipho.dlamini@royalsquare.co.za', 'Sipho', 'Dlamini', '+27 82 555 1234', 'client', true),
    ('22222222-2222-2222-2222-222222222222', 'adviser@royalsquare.co.za', 'Kagiso', 'Mabena', '+27 11 884 9000', 'adviser', true),
    ('33333333-3333-3333-3333-333333333333', 'compliance@royalsquare.co.za', 'Liezel', 'Botha', '+27 11 884 9001', 'compliance', true),
    ('44444444-4444-4444-4444-444444444444', 'thabo.molefe@royalsquare.co.za', 'Thabo', 'Molefe', '+27 71 334 5566', 'client', true)
on conflict (id) do nothing;

-- 2. Clients
insert into public.clients (
    id, profile_id, client_number, id_number, date_of_birth, nationality, marital_status,
    occupation, employer, address_line_1, address_line_2, city, province, postal_code, country,
    preferred_contact_method, risk_profile, adviser_id, onboarding_completed, notes
) values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'RSF-C-10492',
    '8506125089087',
    '1985-06-12',
    'South African',
    'Married in Community of Property',
    'Senior IT Director',
    'Standard Bank Group',
    '44 West Road South',
    'Morningside Ext 4',
    'Sandton',
    'Gauteng',
    '2196',
    'South Africa',
    'app',
    'Moderate Aggressive',
    '22222222-2222-2222-2222-222222222222',
    true,
    'Client prioritizes wealth preservation, private school education endowment, and comprehensive offshore diversification.'
) on conflict (id) do nothing;

-- 3. Dependants & Beneficiaries
insert into public.dependants (client_id, full_name, relationship, date_of_birth, id_number, is_dependent)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nomvula Dlamini', 'Spouse', '1987-03-22', '8703220192083', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lwazi Dlamini', 'Son', '2015-08-14', '1508145091082', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zinhle Dlamini', 'Daughter', '2018-11-03', '1811030094081', true);

insert into public.beneficiaries (client_id, full_name, relationship, id_number, percentage, contact_number, email)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nomvula Dlamini', 'Spouse', '8703220192083', 70.00, '+27 82 444 9876', 'nomvula.dlamini@example.com'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lwazi Dlamini', 'Son', '1508145091082', 15.00, null, null),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zinhle Dlamini', 'Daughter', '1811030094081', 15.00, null, null);

-- 4. Financials (Assets, Liabilities, Income, Expenses)
insert into public.assets (client_id, asset_type, name, description, current_value, institution)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'property', 'Primary Residence', '4-bedroom family home in Morningside, Sandton', 4200000.00, 'FNB Private Wealth'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'vehicle', '2023 BMW X5 xDrive30d', 'Registration: CA 849-291', 1350000.00, 'BMW Financial Services'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cash', 'Emergency Reserve Account', '32-day notice interest deposit', 280000.00, 'Investec Bank');

insert into public.liabilities (client_id, liability_type, name, institution, outstanding_balance, monthly_payment, interest_rate)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bond', 'Home Mortgage Bond', 'FNB Homeloans', 1850000.00, 21450.00, 11.25),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'vehicle_finance', 'BMW Select Vehicle Finance', 'BMW Finance', 430000.00, 14200.00, 10.75);

insert into public.income (client_id, source, amount, frequency)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Executive Salary (Standard Bank)', 145000.00, 'monthly'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rental Property Dividend', 18500.00, 'monthly');

insert into public.expenses (client_id, category, amount, frequency)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mortgage & Rates', 26500.00, 'monthly'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Vehicle Installment & Fuel', 18200.00, 'monthly'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Private School Tuition', 19000.00, 'monthly'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Household & Utilities', 22000.00, 'monthly'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Insurance & Medical Aid', 14500.00, 'monthly');

-- 5. Policies & Investments
insert into public.policies (client_id, policy_number, policy_type, premium, sum_assured, status, start_date, renewal_date, debit_order_day)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DISC-LF-94821', 'Comprehensive Life & Critical Illness', 3450.00, 10000000.00, 'active', '2020-02-01', '2026-02-01', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SNT-MOT-10293', 'Comprehensive Motor & Household Short-Term', 2890.00, 2500000.00, 'active', '2021-05-15', '2026-05-15', 1);

insert into public.investments (client_id, investment_name, account_number, current_value, monthly_contribution, investment_type)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Allan Gray Balanced Fund Class A', 'AG-849102', 1250000.00, 12500.00, 'Unit Trust / RA'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Old Mutual Global Equity Feeder Fund', 'OM-391024', 980000.00, 8000.00, 'Offshore Equity');

-- 6. Goals
insert into public.goals (id, client_id, name, goal_type, description, target_amount, current_amount, target_date, status, is_shared)
values
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Retirement Independence 2038', 'retirement', 'Targeting sustainable 5% drawdown lifestyle at age 53', 15000000.00, 9750000.00, '2038-06-30', 'active', true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Children Tertiary Education Endowment', 'education', 'University fund for Lwazi and Zinhle', 1200000.00, 540000.00, '2033-01-15', 'active', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cape Coastal Vacation Property', 'property', 'Deposit and transfer costs for Plettenberg Bay holiday villa', 2500000.00, 1450000.00, '2028-12-01', 'active', false);
