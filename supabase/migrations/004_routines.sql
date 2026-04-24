-- 고정 루틴 — 깨시 추천 생성 시 반영될 사용자 정의 루틴
create table routines (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  label text not null,                      -- "수면 루틴", "산책"
  description text,                         -- 선택, 자유 메모
  duration_minutes integer not null check (duration_minutes between 5 and 240),
  kind text not null check (kind in ('time_of_day', 'window_position')),
  -- time_of_day 전용
  start_time time,
  -- window_position 전용
  window_anchor text check (window_anchor in ('first', 'last')),
  position text check (position in ('start', 'end')),
  enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index routines_profile_idx on routines (profile_id);

alter table routines enable row level security;

create policy "routines_access" on routines
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );
