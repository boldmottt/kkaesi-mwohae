create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  log_date date not null,
  nap_index integer not null,
  sleep_start time,
  sleep_end time,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (profile_id, log_date, nap_index)
);

alter table sleep_logs enable row level security;

create policy "sleep_logs_access" on sleep_logs
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );
