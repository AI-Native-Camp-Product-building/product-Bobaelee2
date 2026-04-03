-- md력 품질 점수 컬럼 추가 (nullable — 기존 결과는 null)
alter table results add column if not exists quality_scores jsonb;
