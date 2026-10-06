# 데이터 패치 (`data/patches/`)

에듀맵스 데이터의 정본은 공유 D1 `edu-link-db`의 `edumaps_*` 테이블입니다.
여러 항목을 고치거나 장소를 추가할 때는 이 폴더에 SQL 파일을 만들어 적용합니다. 파일은 커밋해서 변경 이력으로 남깁니다.

## 파일 이름

`YYYYMMDD-설명.sql` — 예: `20261006-수목원-학년보완.sql`, `20261020-res_201-추가.sql`

## 적용 순서

```bash
npm run data:apply -- data/patches/20261006-수목원-학년보완.sql   # 원격 D1에 적용
npm run data:publish -- --dry-run                                  # 검증 + 변경 요약 확인
npm run data:publish -- --commit --push                            # resources.json 생성·커밋·배포
```

연습할 때는 두 명령 모두에 `--local`을 붙이면 로컬 D1(`db/.wrangler/`)에만 반영됩니다.

## 예시

```sql
-- 학년 보완 + 설명 수정
UPDATE edumaps_items
   SET recommended_grades = '[3,4,5,6]',
       description = '대구 근대도시와 생활문화를 전시·체험으로 배우는 문화교육 공간',
       updated_at = datetime('now')
 WHERE id = 'res_195';

-- 링크 확인일 기록
UPDATE edumaps_items SET verified_at = '2026-10-06' WHERE id IN ('res_121', 'res_197');

-- 장소 추가 (현장: 좌표 필수 / 온라인: lat·lng 생략)
-- image_url을 비우면 https://dgedu.link/media/edumaps/<id>.webp 사용 (npm run media:put 으로 업로드)
INSERT INTO edumaps_items
  (id, type, title, category, tags, recommended_grades, description, lat, lng, external_url, sort, verified_at)
VALUES
  ('res_201', 'OFFLINE', '○○과학관', '동구', '["과학","체험"]', '[3,4,5,6]',
   '과학 원리를 전시·체험으로 배우는 공간', 35.88, 128.63, 'https://example.kr/', 89, '2026-10-06');

-- 활용 주제 추가 (grade는 해당 장소 recommended_grades 안에 있어야 함)
INSERT INTO edumaps_topics
  (item_id, grade, month, subject, topic_title, description, inquiry_questions, post_activities, sort)
VALUES
  ('res_201', 4, 5, '과학', '빛의 성질 알아보기', '전시관에서 빛의 반사와 굴절을 관찰해 봅시다.',
   '["빛은 어떻게 꺾일까요?"]', '["관찰 기록지를 정리해 봅시다."]',
   (SELECT COALESCE(MAX(sort), -1) + 1 FROM edumaps_topics));

-- 숨기기 (삭제 대신)
UPDATE edumaps_items SET is_active = 0, updated_at = datetime('now') WHERE id = 'res_112';

-- 변경이력 공지 (사이트 '업데이트 소식'에 표시, 날짜 최신순)
INSERT INTO edumaps_changelog (date, text) VALUES ('2026.10.06', '○○과학관을 추가하였습니다.');
```

## 주의

- **`edumaps_` 테이블만** 다룹니다. 같은 DB에 edu-link·edu-kit 데이터가 있어 `data:apply`는 다른 테이블이 보이면 거부합니다.
- 학년은 정수 배열(`[3,4]`), 월은 정수(`5`)로 저장합니다. `resources.json`에서는 `["3","4"]`, `"5월"`로 변환됩니다.
- 이미지를 바꿀 때는 같은 이름으로 덮어쓰지 말고 `res_131_v2.webp`처럼 새 이름으로 올린 뒤 `image_url`을 바꿉니다(1년 캐시).
- 되돌릴 때는 반대 내용의 패치를 새로 만들어 적용합니다(기존 패치 파일은 수정하지 않음).
