-- activity_cache에 routines 컬럼 추가 — 루틴 변경 시 캐시 무효화 용도
alter table activity_cache
  add column if not exists routines text;
