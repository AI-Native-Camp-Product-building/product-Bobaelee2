-- 제품 애널리틱스 이벤트 창고
-- Vercel Analytics와 병행: SQL로 퍼널/공유율/K-factor를 뽑기 위한 자체 이벤트 저장소
-- 원본 텍스트 미전송 원칙 유지 — props에는 enum/bucket/count만 저장, 자유 텍스트 금지

create table if not exists events (
  id bigserial primary key,
  session_id uuid not null,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  referrer text,
  utm jsonb,
  ua_bucket text,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_sid on events (session_id);
create index if not exists idx_events_name_created on events (name, created_at desc);
create index if not exists idx_events_created on events (created_at desc);

-- 익명 클라이언트는 insert만 허용, 조회는 서비스 롤로만
alter table events enable row level security;

drop policy if exists "events_insert_anon" on events;
create policy "events_insert_anon"
  on events for insert
  to anon
  with check (true);

drop policy if exists "events_insert_auth" on events;
create policy "events_insert_auth"
  on events for insert
  to authenticated
  with check (true);
