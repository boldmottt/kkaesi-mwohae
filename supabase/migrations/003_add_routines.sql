-- 깨시별 고정 루틴 메모 (자유 텍스트)
alter table wake_windows
  add column if not exists routines text;
