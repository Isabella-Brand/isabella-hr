-- ================================================================
-- Isabella HR + Attendance Schema
-- Run this in Supabase: SQL Editor → New Query → paste → Run
-- ================================================================

-- Employees table
create table if not exists employees (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  first_name      text not null,
  last_name       text not null,
  email           text unique not null,
  country         text default '',
  start_date      text default '',
  telegram_handle text default '',
  status          text default '' check (status in ('Active', 'Deactivated', '')),
  gusto_acc       text default '',
  deactivated_date text default '',
  role            text default '' check (role in ('QA Lead', 'Chatter', 'Management', 'Executive Assistant', 'Shipping', 'Graphics', '')),
  shift_assigned  text default '' check (shift_assigned in ('Morning', 'Afternoon', 'Graveyard', ''))
);

-- Attendance table
create table if not exists attendance (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  date          text not null,
  shift         text not null,
  clock_in      timestamptz not null,
  clock_out     timestamptz,
  hours_worked  numeric,
  status        text default 'Clocked In' check (status in ('Clocked In', 'Clocked Out'))
);

-- Indexes for common queries
create index if not exists idx_attendance_name on attendance(name);
create index if not exists idx_attendance_date on attendance(date);
create index if not exists idx_attendance_status on attendance(status);
create index if not exists idx_employees_status on employees(status);
create index if not exists idx_employees_role on employees(role);
