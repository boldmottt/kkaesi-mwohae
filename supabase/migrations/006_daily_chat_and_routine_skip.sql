-- 일일 대화 세션 저장
create table if not exists daily_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  chat_date date not null,
  messages jsonb not null default '[]',
  context_summary text,
  schedule_applied boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (profile_id, chat_date)
);

-- 일일 루틴 스킵 상태 저장
create table if not exists daily_routine_status (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  status_date date not null,
  window_index integer not null,
  routine_text text not null,
  skipped boolean default false,
  created_at timestamptz default now(),
  unique (profile_id, status_date, window_index)
);

alter table daily_chat_sessions enable row level security;
alter table daily_routine_status enable row level security;

create policy "daily_chat_sessions_access" on daily_chat_sessions
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );

create policy "daily_routine_status_access" on daily_routine_status
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );
