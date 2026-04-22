-- Phase 1: activity_logs와 custom_activity_tags에 category 컬럼 추가

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';

ALTER TABLE custom_activity_tags
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';
