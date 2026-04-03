-- .md력 리더보드 프로필
create table leaderboard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  title text,
  organization text,
  status_message text,
  role text default 'non-dev',
  linkedin_url text,
  created_at timestamptz default now()
);

-- .md력 리더보드 점수 (재측정 시 덮어쓰기)
create table leaderboard_scores (
  user_id uuid primary key references leaderboard_profiles(user_id) on delete cascade,
  result_id text not null,
  persona text not null,
  md_power integer not null,
  tier text not null,
  prev_power integer,
  updated_at timestamptz default now()
);

create index idx_scores_power on leaderboard_scores (md_power desc);

-- RLS 활성화
alter table leaderboard_profiles enable row level security;
alter table leaderboard_scores enable row level security;

-- 누구나 리더보드 조회 가능
create policy "리더보드 조회" on leaderboard_profiles for select using (true);
create policy "점수 조회" on leaderboard_scores for select using (true);

-- 본인만 프로필 수정 가능
create policy "프로필 수정" on leaderboard_profiles for update using (auth.uid() = user_id);
create policy "프로필 생성" on leaderboard_profiles for insert with check (auth.uid() = user_id);
create policy "프로필 삭제" on leaderboard_profiles for delete using (auth.uid() = user_id);

-- 본인만 점수 수정 가능
create policy "점수 생성" on leaderboard_scores for insert with check (auth.uid() = user_id);
create policy "점수 갱신" on leaderboard_scores for update using (auth.uid() = user_id);
create policy "점수 삭제" on leaderboard_scores for delete using (auth.uid() = user_id);
