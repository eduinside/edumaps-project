-- 에듀맵스 데이터 스키마 (공유 D1 'edu-link-db')
-- edu-link·edu-kit과 같은 DB이므로 edumaps_ 접두어 테이블만 둔다. 여러 번 실행해도 안전(IF NOT EXISTS).
-- 적용: npm run data:init -- --local | --remote

CREATE TABLE IF NOT EXISTS edumaps_items (
  id                 TEXT PRIMARY KEY,                       -- 'res_131' (기존 id 유지 → resource_stats 연결 유지)
  type               TEXT NOT NULL CHECK (type IN ('OFFLINE','ONLINE')),
  title              TEXT NOT NULL,
  category           TEXT NOT NULL,                          -- 지역(현장) 또는 분야(온라인)
  tags               TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
  recommended_grades TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]' CHECK (json_valid(recommended_grades)),  -- 정수 배열
  description        TEXT NOT NULL CHECK (length(description) >= 10),
  lat                REAL CHECK (lat IS NULL OR lat BETWEEN 35.5 AND 36.5),     -- ONLINE은 NULL
  lng                REAL CHECK (lng IS NULL OR lng BETWEEN 128.2 AND 129.0),
  image_url          TEXT,                                   -- NULL이면 https://dgedu.link/media/edumaps/{id}.webp
  external_url       TEXT NOT NULL CHECK (external_url LIKE 'https://%' OR external_url LIKE 'http://%'),  -- http는 발행 시 경고
  sort               INTEGER NOT NULL DEFAULT 0,             -- 목록 순서(작을수록 앞)
  is_active          INTEGER NOT NULL DEFAULT 1,             -- 0=숨김(삭제 대신)
  verified_at        TEXT,                                   -- 링크·내용 최종 확인일 'YYYY-MM-DD'
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (type = 'ONLINE' OR (lat IS NOT NULL AND lng IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS edumaps_topics (                  -- 기존 '활용' 시트
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id           TEXT NOT NULL REFERENCES edumaps_items(id) ON DELETE CASCADE,
  grade             INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 6),
  month             INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  subject           TEXT NOT NULL,
  topic_title       TEXT NOT NULL,
  description       TEXT NOT NULL,
  inquiry_questions TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(inquiry_questions)),
  post_activities   TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(post_activities)),
  sort              INTEGER NOT NULL DEFAULT 0,              -- 기존 usage_index 대체(전역 순서)
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_edumaps_topics_item ON edumaps_topics(item_id);

CREATE TABLE IF NOT EXISTS edumaps_changelog (               -- 기존 '변경이력' 시트
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                                        -- '2026.10.06'
  text TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0                            -- 같은 날짜 안 표시 순서(작을수록 위). 전체는 date 내림차순
);
