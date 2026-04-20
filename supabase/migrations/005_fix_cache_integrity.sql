-- 1. 컬럼 존재 보장
alter table activity_cache
  add column if not exists duration_minutes integer;

alter table activity_cache
  add column if not exists routines text;

-- 2. duration_minutes가 null인 기존 캐시는 무효 → 삭제
delete from activity_cache where duration_minutes is null;

-- 3. unique 제약조건 확인 (이미 있으면 무시됨)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'activity_cache_profile_id_cache_date_window_index_key'
  ) then
    alter table activity_cache
      add constraint activity_cache_profile_id_cache_date_window_index_key
      unique (profile_id, cache_date, window_index);
  end if;
end $$;
