-- md력 점수 산정 기준 변경으로 인한 리더보드 1회 초기화
-- 사용자 프로필은 유지, 점수만 리셋. 재분석 시 새 품질 기반 점수로 갱신.
-- 배포 후 수동 1회 실행할 것. 마이그레이션에 포함하지 않음 (자동 재실행 방지).
UPDATE leaderboard_scores SET md_power = 0, tier = 'egg', prev_power = 0;
