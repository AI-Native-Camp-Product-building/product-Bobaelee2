create table results (
  id text primary key,
  persona text not null,
  scores jsonb not null,
  roasts jsonb not null,
  strengths jsonb not null,
  prescriptions jsonb not null,
  md_stats jsonb not null,
  created_at timestamptz default now()
);

create table persona_stats (
  persona text primary key,
  count int default 0,
  total_lines bigint default 0,
  total_tools bigint default 0
);

create index idx_results_persona on results (persona);
create index idx_results_created on results (created_at desc);
