-- 활동 기록 — 체크/평가/메모
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  log_date date not null,
  window_index integer not null,
  activity_name text not null,
  activity_duration text,
  activity_effect text,
  did boolean not null default false,
  rating smallint check (rating in (-1, 0, 1)) default 0,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (profile_id, log_date, window_index, activity_name)
);

create index activity_logs_profile_date_idx
  on activity_logs (profile_id, log_date desc);

alter table activity_logs enable row level security;

create policy "activity_logs_access" on activity_logs
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );
