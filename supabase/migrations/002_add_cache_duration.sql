-- 활동 캐시에 duration_minutes 추가 — 깨시 시간 변경 시 캐시 자동 무효화
alter table activity_cache
  add column if not exists duration_minutes integer;
