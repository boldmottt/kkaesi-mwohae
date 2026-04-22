create table activity_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  log_date date not null,
  window_index integer not null,
  activity_name text not null,
  activity_duration text,
  activity_effect text,
  did boolean not null default false,
  rating smallint not null default 0,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (profile_id, log_date, window_index, activity_name)
);

alter table activity_log enable row level security;

create policy "activity_log_access" on activity_log
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );
