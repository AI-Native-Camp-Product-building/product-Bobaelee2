-- 부 페르소나 컬럼 추가 (nullable — 기존 데이터는 null)
alter table results add column if not exists secondary_persona text;
