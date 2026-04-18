-- 아기 프로필
create table profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users not null,
  baby_name text not null,
  birth_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- 프로필 멤버 (배우자 공유)
create table profile_members (
  profile_id uuid references profiles(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  primary key (profile_id, user_id)
);

-- 깨시 설정
create table wake_windows (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  window_index integer not null,
  duration_minutes integer not null,
  start_time time,
  updated_at timestamptz default now(),
  unique (profile_id, window_index)
);

-- 활동 추천 캐시
create table activity_cache (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  cache_date date not null,
  window_index integer not null,
  activities jsonb not null,
  created_at timestamptz default now(),
  unique (profile_id, cache_date, window_index)
);

-- 배우자 초대
create table invitations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  token text unique not null,
  accepted_at timestamptz,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table profiles enable row level security;
alter table profile_members enable row level security;
alter table wake_windows enable row level security;
alter table activity_cache enable row level security;
alter table invitations enable row level security;

-- RLS 정책
create policy "profiles_access" on profiles
  for all using (
    owner_user_id = auth.uid()
    or id in (
      select profile_id from profile_members where user_id = auth.uid()
    )
  );

create policy "wake_windows_access" on wake_windows
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );

create policy "activity_cache_access" on activity_cache
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );

create policy "invitations_owner" on invitations
  for all using (
    profile_id in (select id from profiles where owner_user_id = auth.uid())
  );

create policy "profile_members_access" on profile_members
  for all using (user_id = auth.uid());
