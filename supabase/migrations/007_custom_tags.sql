-- 사용자 커스텀 활동 태그
create table if not exists custom_activity_tags (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  label text not null,
  use_count integer default 0,
  last_used_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (profile_id, label)
);

alter table custom_activity_tags enable row level security;

create policy "custom_activity_tags_access" on custom_activity_tags
  for all using (
    profile_id in (
      select id from profiles
      where owner_user_id = auth.uid()
         or id in (select profile_id from profile_members where user_id = auth.uid())
    )
  );

-- activity_logs에 커스텀 활동 구분 플래그 추가
alter table activity_logs
  add column if not exists is_custom boolean default false;
