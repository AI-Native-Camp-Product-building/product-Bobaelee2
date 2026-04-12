-- v2 조합형 성향 분류 필드 추가
ALTER TABLE results ADD COLUMN IF NOT EXISTS type_code TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS axis_scores JSONB;
