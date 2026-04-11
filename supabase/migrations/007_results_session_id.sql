-- results ↔ events JOIN을 위한 공통 키
-- 기존 row를 깨지 않도록 nullable로 추가 (레거시는 null, 신규부터 값 채움)

alter table results
  add column if not exists session_id uuid;

create index if not exists idx_results_session_id on results (session_id);
