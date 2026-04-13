-- ============================================================
-- World Emotion Map — Sectors Seed Data
-- Run this in the Supabase SQL editor to enable sector-level
-- emotion tracking. Safe to re-run (ON CONFLICT DO UPDATE).
-- ============================================================

INSERT INTO public.sectors (slug, name_en, name_ja, parent_slug, gdelt_themes) VALUES
  -- ── Level 1: Parent sectors ───────────────────────────────
  ('economy',     'Economy',     '経済',             NULL, ARRAY['ECON']),
  ('politics',    'Politics',    '政治',             NULL, ARRAY['GOV', 'ELECTION']),
  ('technology',  'Technology',  'テクノロジー',     NULL, ARRAY['CYBER', 'WB_1261_INNOVATION_AND_TECHNOLOGY', 'ARTIFICIAL_INTELLIGENCE']),
  ('environment', 'Environment', '環境',             NULL, ARRAY['ENV_CLIMATE', 'ENV_POLLUTION', 'NATURAL_DISASTER', 'ENV_FLOODING', 'ENV_EARTHQUAKE', 'ENV_DROUGHT', 'ENV_WILDFIRE']),
  ('health',      'Health',      '健康・医療',       NULL, ARRAY['HEALTH', 'DISEASE', 'MED']),
  ('security',    'Security',    '安全保障',         NULL, ARRAY['MILITARY', 'TERROR', 'CRIME']),
  ('society',     'Society',     '社会',             NULL, ARRAY['SOC', 'HUMAN_RIGHTS', 'EDU', 'REFUGEES', 'IMMIGRATION']),
  ('energy',      'Energy',      'エネルギー',       NULL, ARRAY['ENV_OIL', 'ENV_GAS', 'ENV_SOLAR', 'ENV_WIND', 'ENV_NUCLEAR', 'ENV_GEOTHERMAL']),

  -- ── Level 2: Economy children ─────────────────────────────
  ('economy-markets',    'Markets',     '金融市場', 'economy', ARRAY['ECON_STOCKMARKET', 'ECON_HOUSING', 'ECON_CURRENCY', 'ECON_INTEREST_RATES', 'ECON_BANKRUPTCY']),
  ('economy-trade',      'Trade',       '貿易',     'economy', ARRAY['ECON_TRADE', 'ECON_TARIFF']),
  ('economy-employment', 'Employment',  '雇用',     'economy', ARRAY['ECON_UNEMPLOYMENT', 'UNEMPLOYMENT']),

  -- ── Level 2: Politics children ────────────────────────────
  ('politics-domestic',  'Domestic',    '国内政治', 'politics', ARRAY['GOV_DOMESTIC_POLICY', 'POLITICAL_TURMOIL']),
  ('politics-diplomacy', 'Diplomacy',   '外交',     'politics', ARRAY['GOV_FOREIGN_POLICY', 'UN_GENERAL_ASSEMBLY']),
  ('politics-elections', 'Elections',   '選挙',     'politics', ARRAY['ELECTION']),

  -- ── Level 2: Technology children ──────────────────────────
  ('technology-ai',    'AI / ML',       'AI/機械学習',      'technology', ARRAY['ARTIFICIAL_INTELLIGENCE', 'MACHINE_LEARNING']),
  ('technology-cyber', 'Cybersecurity', 'サイバーセキュリティ', 'technology', ARRAY['CYBER']),
  ('technology-innov', 'Innovation',    'イノベーション',   'technology', ARRAY['WB_1261_INNOVATION_AND_TECHNOLOGY']),

  -- ── Level 2: Environment children ─────────────────────────
  ('environment-climate',  'Climate',   '気候変動', 'environment', ARRAY['ENV_CLIMATE', 'ENV_POLLUTION']),
  ('environment-disaster', 'Disasters', '自然災害', 'environment', ARRAY['NATURAL_DISASTER', 'ENV_FLOODING', 'ENV_EARTHQUAKE', 'ENV_DROUGHT', 'ENV_WILDFIRE']),

  -- ── Level 2: Health children ──────────────────────────────
  ('health-public', 'Public Health', '公衆衛生', 'health', ARRAY['DISEASE', 'HEALTH_EPIDEMIC']),
  ('health-pharma', 'Pharma',        '製薬・医療研究', 'health', ARRAY['MED', 'HEALTH_PHARMACEUTICAL']),

  -- ── Level 2: Security children ────────────────────────────
  ('security-military',   'Military',  '軍事',   'security', ARRAY['MILITARY', 'WAR']),
  ('security-terrorism',  'Terrorism', 'テロ',   'security', ARRAY['TERROR']),
  ('security-crime',      'Crime',     '犯罪',   'security', ARRAY['CRIME']),

  -- ── Level 2: Society children ─────────────────────────────
  ('society-education',  'Education',    '教育',       'society', ARRAY['EDU', 'EDUCATION']),
  ('society-rights',     'Human Rights', '人権',       'society', ARRAY['HUMAN_RIGHTS', 'SOC']),
  ('society-migration',  'Migration',    '移民・難民', 'society', ARRAY['REFUGEES', 'IMMIGRATION', 'MIGRATION']),

  -- ── Level 2: Energy children ──────────────────────────────
  ('energy-fossil',      'Oil & Gas',   '石油・天然ガス',       'energy', ARRAY['ENV_OIL', 'ENV_GAS']),
  ('energy-renewables',  'Renewables',  '再生可能エネルギー',   'energy', ARRAY['ENV_SOLAR', 'ENV_WIND', 'ENV_GEOTHERMAL']),
  ('energy-nuclear',     'Nuclear',     '原子力',               'energy', ARRAY['ENV_NUCLEAR'])

ON CONFLICT (slug) DO UPDATE SET
  name_en      = EXCLUDED.name_en,
  name_ja      = EXCLUDED.name_ja,
  parent_slug  = EXCLUDED.parent_slug,
  gdelt_themes = EXCLUDED.gdelt_themes;
