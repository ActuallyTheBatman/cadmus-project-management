create extension if not exists "pgcrypto";

create table if not exists public.timesheet_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  client text,
  reporting_formats text[] not null default array['daily_cards'],
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.timesheet_projects
  add column if not exists reporting_formats text[] not null default array['daily_cards'];

create unique index if not exists timesheet_projects_code_idx
  on public.timesheet_projects (code);

create table if not exists public.timesheet_project_managers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.timesheet_projects(id) on delete cascade,
  manager_name text not null,
  manager_email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, manager_email)
);

create table if not exists public.timesheet_admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.timesheet_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null default 'resource' check (role in ('resource', 'manager', 'admin')),
  project_id uuid references public.timesheet_projects(id),
  manager_id uuid references public.timesheet_project_managers(id),
  branch text,
  division text,
  invited_by uuid references auth.users(id),
  active boolean not null default true,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists timesheet_invitations_email_idx
  on public.timesheet_invitations ((lower(email)), active, created_at desc);

create table if not exists public.timesheet_branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.timesheet_divisions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.timesheet_branches(id) on delete set null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (branch_id, name)
);

create table if not exists public.timesheet_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.timesheet_projects(id) on delete cascade,
  name text not null,
  code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create table if not exists public.timesheet_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  company text not null default 'Cadmus Project Management',
  branch text not null,
  division text not null,
  project_id uuid references public.timesheet_projects(id),
  manager_id uuid references public.timesheet_project_managers(id),
  role text not null default 'resource' check (role in ('resource', 'manager', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timesheet_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  project_id uuid references public.timesheet_projects(id),
  task text not null,
  notes text,
  hours numeric(5, 2) not null check (hours > 0 and hours <= 24),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists timesheet_entries_user_date_idx
  on public.timesheet_entries (user_id, work_date);

create table if not exists public.timesheet_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  project_id uuid references public.timesheet_projects(id),
  manager_id uuid references public.timesheet_project_managers(id),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  manager_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.timesheet_daily_reports (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.timesheet_weekly_reports(id) on delete cascade,
  day_index int not null check (day_index between 0 and 4),
  line_index int not null default 0 check (line_index >= 0),
  work_date date not null,
  task_id uuid references public.timesheet_tasks(id),
  hours numeric(5, 2) not null default 0 check (hours >= 0 and hours <= 24),
  accomplishments text,
  blockers text,
  next_steps text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (weekly_report_id, day_index, line_index)
);

alter table public.timesheet_daily_reports
  add column if not exists task_id uuid references public.timesheet_tasks(id);

alter table public.timesheet_daily_reports
  add column if not exists line_index int not null default 0 check (line_index >= 0);

alter table public.timesheet_daily_reports
  drop constraint if exists timesheet_daily_reports_weekly_report_id_day_index_key;

create unique index if not exists timesheet_daily_reports_week_day_line_idx
  on public.timesheet_daily_reports (weekly_report_id, day_index, line_index);

do $$
begin
  alter publication supabase_realtime add table public.timesheet_projects;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.timesheet_profiles where id = auth.uid()), 'resource')
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select email from public.timesheet_profiles where id = auth.uid()), auth.email())
$$;

create index if not exists timesheet_weekly_reports_user_week_idx
  on public.timesheet_weekly_reports (user_id, week_start);

create index if not exists timesheet_weekly_reports_manager_idx
  on public.timesheet_weekly_reports (manager_id, status, week_start);

create or replace function public.set_timesheet_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_timesheet_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_role text;
begin
  if exists (select 1 from public.timesheet_admin_emails a where lower(a.email) = lower(new.email)) then
    new.role = 'admin';
  elsif exists (select 1 from public.timesheet_project_managers m where lower(m.manager_email) = lower(new.email)) then
    new.role = 'manager';
  else
    select i.role
    into invited_role
    from public.timesheet_invitations i
    where lower(i.email) = lower(new.email)
      and i.active = true
      and i.accepted_at is null
    order by i.created_at desc
    limit 1;

    if invited_role is not null then
      new.role = invited_role;
    elsif tg_op = 'UPDATE' then
      new.role = old.role;
    else
      new.role = 'resource';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_timesheet_entries_updated_at on public.timesheet_entries;
create trigger set_timesheet_entries_updated_at
before update on public.timesheet_entries
for each row
execute function public.set_timesheet_updated_at();

drop trigger if exists set_timesheet_profiles_updated_at on public.timesheet_profiles;
create trigger set_timesheet_profiles_updated_at
before update on public.timesheet_profiles
for each row
execute function public.set_timesheet_updated_at();

drop trigger if exists set_timesheet_profiles_role on public.timesheet_profiles;
create trigger set_timesheet_profiles_role
before insert or update on public.timesheet_profiles
for each row
execute function public.set_timesheet_profile_role();

drop trigger if exists set_timesheet_weekly_reports_updated_at on public.timesheet_weekly_reports;
create trigger set_timesheet_weekly_reports_updated_at
before update on public.timesheet_weekly_reports
for each row
execute function public.set_timesheet_updated_at();

drop trigger if exists set_timesheet_daily_reports_updated_at on public.timesheet_daily_reports;
create trigger set_timesheet_daily_reports_updated_at
before update on public.timesheet_daily_reports
for each row
execute function public.set_timesheet_updated_at();

alter table public.timesheet_projects enable row level security;
alter table public.timesheet_project_managers enable row level security;
alter table public.timesheet_admin_emails enable row level security;
alter table public.timesheet_invitations enable row level security;
alter table public.timesheet_branches enable row level security;
alter table public.timesheet_divisions enable row level security;
alter table public.timesheet_tasks enable row level security;
alter table public.timesheet_profiles enable row level security;
alter table public.timesheet_entries enable row level security;
alter table public.timesheet_weekly_reports enable row level security;
alter table public.timesheet_daily_reports enable row level security;

drop policy if exists "Authenticated users can read active projects" on public.timesheet_projects;
create policy "Authenticated users can read active projects"
on public.timesheet_projects
for select
to authenticated
using (active = true);

drop policy if exists "Admins can manage projects" on public.timesheet_projects;
create policy "Admins can manage projects"
on public.timesheet_projects
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Authenticated users can read active project managers" on public.timesheet_project_managers;
create policy "Authenticated users can read active project managers"
on public.timesheet_project_managers
for select
to authenticated
using (active = true);

drop policy if exists "Admins can manage project managers" on public.timesheet_project_managers;
create policy "Admins can manage project managers"
on public.timesheet_project_managers
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Admins can manage admin emails" on public.timesheet_admin_emails;
create policy "Admins can manage admin emails"
on public.timesheet_admin_emails
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Admins can manage invitations" on public.timesheet_invitations;
create policy "Admins can manage invitations"
on public.timesheet_invitations
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Invited users can read their own invitations" on public.timesheet_invitations;
create policy "Invited users can read their own invitations"
on public.timesheet_invitations
for select
to authenticated
using (lower(email) = lower(auth.email()) and active = true);

drop policy if exists "Invited users can accept their own invitations" on public.timesheet_invitations;
create policy "Invited users can accept their own invitations"
on public.timesheet_invitations
for update
to authenticated
using (lower(email) = lower(auth.email()) and active = true)
with check (lower(email) = lower(auth.email()));

drop policy if exists "Authenticated users can read active branches" on public.timesheet_branches;
create policy "Authenticated users can read active branches"
on public.timesheet_branches
for select
to authenticated
using (active = true);

drop policy if exists "Admins can manage branches" on public.timesheet_branches;
create policy "Admins can manage branches"
on public.timesheet_branches
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Authenticated users can read active divisions" on public.timesheet_divisions;
create policy "Authenticated users can read active divisions"
on public.timesheet_divisions
for select
to authenticated
using (active = true);

drop policy if exists "Admins can manage divisions" on public.timesheet_divisions;
create policy "Admins can manage divisions"
on public.timesheet_divisions
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Authenticated users can read active tasks" on public.timesheet_tasks;
create policy "Authenticated users can read active tasks"
on public.timesheet_tasks
for select
to authenticated
using (active = true);

drop policy if exists "Admins can manage tasks" on public.timesheet_tasks;
create policy "Admins can manage tasks"
on public.timesheet_tasks
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Users can insert their own profile" on public.timesheet_profiles;
create policy "Users can insert their own profile"
on public.timesheet_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can read visible profiles" on public.timesheet_profiles;
create policy "Users can read visible profiles"
on public.timesheet_profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'manager'
    and exists (
      select 1
      from public.timesheet_project_managers m
      where m.id = timesheet_profiles.manager_id
        and lower(m.manager_email) = lower(public.current_user_email())
    )
  )
);

drop policy if exists "Users can update their own profile" on public.timesheet_profiles;
create policy "Users can update their own profile"
on public.timesheet_profiles
for update
to authenticated
using (auth.uid() = id or public.current_user_role() = 'admin')
with check (
  public.current_user_role() = 'admin'
  or auth.uid() = id
);

drop policy if exists "Users can read their own time entries" on public.timesheet_entries;
create policy "Users can read their own time entries"
on public.timesheet_entries
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own time entries" on public.timesheet_entries;
create policy "Users can insert their own time entries"
on public.timesheet_entries
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own unapproved time entries" on public.timesheet_entries;
create policy "Users can update their own unapproved time entries"
on public.timesheet_entries
for update
to authenticated
using (auth.uid() = user_id and status <> 'approved')
with check (auth.uid() = user_id and status <> 'approved');

drop policy if exists "Users can delete their own draft time entries" on public.timesheet_entries;
create policy "Users can delete their own draft time entries"
on public.timesheet_entries
for delete
to authenticated
using (auth.uid() = user_id and status = 'draft');

drop policy if exists "Users and reviewers can read weekly reports" on public.timesheet_weekly_reports;
create policy "Users and reviewers can read weekly reports"
on public.timesheet_weekly_reports
for select
to authenticated
using (
  auth.uid() = user_id
  or public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'manager'
    and exists (
      select 1
      from public.timesheet_project_managers m
      where m.id = timesheet_weekly_reports.manager_id
        and lower(m.manager_email) = lower(public.current_user_email())
    )
  )
);

drop policy if exists "Users can insert their own weekly reports" on public.timesheet_weekly_reports;
create policy "Users can insert their own weekly reports"
on public.timesheet_weekly_reports
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users and reviewers can update weekly reports" on public.timesheet_weekly_reports;
create policy "Users and reviewers can update weekly reports"
on public.timesheet_weekly_reports
for update
to authenticated
using (
  (auth.uid() = user_id and status in ('draft', 'rejected'))
  or public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'manager'
    and exists (
      select 1
      from public.timesheet_project_managers m
      where m.id = timesheet_weekly_reports.manager_id
        and lower(m.manager_email) = lower(public.current_user_email())
    )
  )
)
with check (
  auth.uid() = user_id
  or public.current_user_role() = 'admin'
  or public.current_user_role() = 'manager'
);

drop policy if exists "Users and reviewers can read daily reports" on public.timesheet_daily_reports;
create policy "Users and reviewers can read daily reports"
on public.timesheet_daily_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.timesheet_weekly_reports w
    where w.id = timesheet_daily_reports.weekly_report_id
      and (
        w.user_id = auth.uid()
        or public.current_user_role() = 'admin'
        or (
          public.current_user_role() = 'manager'
          and exists (
            select 1
            from public.timesheet_project_managers m
            where m.id = w.manager_id
              and lower(m.manager_email) = lower(public.current_user_email())
          )
        )
      )
  )
);

drop policy if exists "Users can insert their own daily reports" on public.timesheet_daily_reports;
create policy "Users can insert their own daily reports"
on public.timesheet_daily_reports
for insert
to authenticated
with check (
  exists (
    select 1
    from public.timesheet_weekly_reports w
    where w.id = timesheet_daily_reports.weekly_report_id
      and w.user_id = auth.uid()
      and w.status in ('draft', 'rejected')
  )
);

drop policy if exists "Users can update their own daily reports" on public.timesheet_daily_reports;
create policy "Users can update their own daily reports"
on public.timesheet_daily_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.timesheet_weekly_reports w
    where w.id = timesheet_daily_reports.weekly_report_id
      and w.user_id = auth.uid()
      and w.status in ('draft', 'rejected')
  )
)
with check (
  exists (
    select 1
    from public.timesheet_weekly_reports w
    where w.id = timesheet_daily_reports.weekly_report_id
      and w.user_id = auth.uid()
      and w.status in ('draft', 'rejected')
  )
);

insert into public.timesheet_projects (name, code, client, reporting_formats)
values
  ('Project Management', 'PM', 'Cadmus', array['daily_cards', 'weekly_grid', 'work_log']),
  ('PMO Support', 'PMO', 'Cadmus', array['daily_cards', 'weekly_grid', 'work_log']),
  ('Project Controls', 'CTRL', 'Cadmus', array['daily_cards', 'weekly_grid', 'work_log']),
  ('Benefit Connect', 'BENCON', 'Cadmus', array['daily_cards', 'weekly_grid', 'work_log'])
on conflict (code) do update set
  name = excluded.name,
  client = excluded.client,
  reporting_formats = excluded.reporting_formats,
  active = true;

insert into public.timesheet_project_managers (project_id, manager_name, manager_email)
select p.id, manager_name, manager_email
from public.timesheet_projects p
cross join (
  values
    ('Alex Morgan', 'alex.morgan@example.com'),
    ('Jordan Lee', 'jordan.lee@example.com'),
    ('Casey Rivera', 'casey.rivera@example.com'),
    ('Taylor Brooks', 'taylor.brooks@example.com'),
    ('Morgan Patel', 'morgan.patel@example.com')
) as managers(manager_name, manager_email)
where p.code = 'BENCON'
on conflict (project_id, manager_email) do update set
  manager_name = excluded.manager_name,
  active = true;

insert into public.timesheet_admin_emails (email)
values ('Garrett@cadmusprojects.com')
on conflict (email) do nothing;

insert into public.timesheet_branches (name)
values
  ('Financial Services'),
  ('Operations'),
  ('Technology'),
  ('Program Delivery')
on conflict (name) do update set active = true;

insert into public.timesheet_divisions (branch_id, name)
select b.id, division_name
from public.timesheet_branches b
cross join (
  values
    ('Accounting'),
    ('Budget'),
    ('Project Controls')
) as divisions(division_name)
where b.name = 'Financial Services'
on conflict (branch_id, name) do update set active = true;

insert into public.timesheet_tasks (project_id, name, code)
select p.id, task_name, task_code
from public.timesheet_projects p
cross join (
  values
    ('Project coordination', 'COORD'),
    ('Stakeholder meeting', 'MEET'),
    ('Documentation', 'DOC'),
    ('Risk or issue follow-up', 'RISK'),
    ('Reporting', 'RPT')
) as tasks(task_name, task_code)
where p.code = 'BENCON'
on conflict (project_id, name) do update set
  code = excluded.code,
  active = true;
