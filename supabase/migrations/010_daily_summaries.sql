-- monthly insight 캐시 테이블
create table if not exists daily_summaries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  summary_date date not null,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (profile_id, summary_date)
);

create index if not exists daily_summaries_profile_date_idx
  on daily_summaries (profile_id, summary_date desc);

alter table daily_summaries enable row level security;

create policy "daily_summaries_access" on daily_summaries
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );
