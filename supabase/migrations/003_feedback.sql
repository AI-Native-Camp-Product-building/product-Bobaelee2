create table feedback (
  id uuid primary key default gen_random_uuid(),
  type text default 'general',
  message text not null,
  email text,
  created_at timestamptz default now()
);

-- 누구나 피드백 작성 가능
alter table feedback enable row level security;
create policy "피드백 작성" on feedback for insert with check (true);
