-- ============================================================
-- Migration 00002: Add description column to anomaly_posts_log
-- ============================================================

alter table public.anomaly_posts_log
  add column description text;
