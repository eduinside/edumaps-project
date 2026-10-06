# 데이터 운영 가이드 (D1)

에듀맵스 데이터의 **정본은 Cloudflare D1 `edu-link-db`의 `edumaps_*` 테이블**입니다.
사이트는 지금처럼 100% 정적이며, 런타임·빌드 모두 D1을 부르지 않습니다. `npm run data:publish`가 D1을 읽어 `resources.json`을 만들고, 그 커밋이 CF Pages 빌드를 일으킵니다.

> 구글 시트 + GAS 발행 방식(`docs/backend/`)은 이 구조로 대체됩니다. 배경·결정 근거는 `docs/plan-ux-audit-2026-10.md` §4·§5.

## 구조

```
                    ┌─ (빠른 수정) CF 대시보드 → D1 → edu-link-db 콘솔
edu-link-db (D1) ◀──┼─ (일반 수정) data/patches/*.sql → npm run data:apply
  edumaps_* 테이블   └─ (이미지)    npm run media:put → R2 edulink-pages-media/edumaps/
        │
        ▼ npm run data:publish  (조회 → 검증 → 생성 → 커밋·푸시)
src/data/resources.json  +  public/data/resources.json / resources.csv
        │
        ▼ CF Pages 자동 빌드
map.dgedu.link   (공유용: /data/resources.csv, /data/resources.json)
```

- 쓰기 경로는 소유자 PC의 `wrangler` 인증(또는 CF 대시보드)뿐입니다. 관리 화면·쓰기 API 없음.
- 변경 이력은 git에 남습니다(패치 SQL + `resources.json` 차이).
- `resources.json`을 직접 고치지 마세요. 다음 발행 때 덮어써집니다.

## 테이블 (`db/schema.sql`)

| 테이블 | 내용 | 주요 컬럼 |
|---|---|---|
| `edumaps_items` | 장소·온라인 자료 | `id`(`res_131`, 바꾸지 않음), `type`(`OFFLINE`/`ONLINE`), `title`, `category`, `tags`(JSON 배열), `recommended_grades`(정수 JSON 배열), `description`(10자 이상), `lat`/`lng`(온라인은 NULL), `image_url`(NULL이면 `media/edumaps/<id>.webp`), `external_url`, `sort`, `is_active`(0=숨김), `verified_at` |
| `edumaps_topics` | 학년별 활용 주제(기존 '활용' 시트) | `item_id`, `grade`(1~6), `month`(1~12 정수), `subject`, `topic_title`, `description`, `inquiry_questions`/`post_activities`(JSON 배열), `sort` |
| `edumaps_changelog` | 업데이트 소식(기존 '변경이력' 시트) | `date`(`2026.10.06`), `text`, `sort`(같은 날짜 안 순서) |

- DB `CHECK`가 막는 것: 잘못된 `type`, 학년·월 범위, 좌표 범위(대구·군위), `http(s)://`가 아닌 링크, 10자 미만 설명, 깨진 JSON, 좌표 없는 현장 장소, 없는 장소를 가리키는 주제(FK).
- 발행 검증이 막는 것(오류 → 발행 중단): 주제 학년이 권장 학년에 없음, 고아 주제, 필수값 누락, id 중복.
- 발행 검증 경고(발행은 진행): `http://` 링크, 짧은 설명(15자 미만), `verified_at` 미기록·180일 경과 건수.
- `resources.json` 변환: 학년 `[3,4]` → `["3","4"]`, 월 `5` → `"5월"`, 온라인 좌표 → `{lat:0,lng:0}`, 주제 `sort` → `usage_index`, `is_active=0` 항목 제외.

## 일상 작업

| 상황 | 방법 |
|---|---|
| 오탈자·한두 칸 수정 | CF 대시보드 → Storage & Databases → D1 → `edu-link-db` → Console에서 `UPDATE edumaps_items SET … WHERE id = 'res_…';` → `npm run data:publish -- --commit --push` |
| 장소 추가·여러 항목 수정 | `data/patches/YYYYMMDD-설명.sql` 작성(예시는 `data/patches/README.md`) → `npm run data:apply -- <파일>` → `npm run data:publish -- --dry-run` → `npm run data:publish -- --commit --push` |
| 이미지 추가 | `npm run media:put -- 사진.jpg --name res_201` (WebP 변환 → R2 업로드). id와 같은 이름이면 `image_url`은 NULL 그대로 |
| 이미지 교체 | `npm run media:put -- 새사진.jpg --name res_131_v2` → 패치로 `image_url` 변경 → 발행 |
| 변경이력 공지 | 패치에 `INSERT INTO edumaps_changelog (date, text) VALUES ('2026.10.06', '…');` 포함 |
| 항목 숨기기 | `UPDATE edumaps_items SET is_active = 0 WHERE id = '…';` (삭제 대신, `resource_stats` 연결 유지) |
| 되돌리기 | 사이트 즉시 복구: 발행 커밋을 `git revert` 후 push. 이어서 반대 내용의 패치 SQL로 D1을 맞춘 뒤 `data:publish -- --dry-run`으로 "변경 없음" 확인 |
| 링크 점검 | 매월 1일 GitHub Actions가 자동 실행 → 문제 있으면 이슈 "외부 링크 점검 결과" 생성·갱신. 수동: `npm run data:check-links` |

## 명령

| 명령 | 동작 |
|---|---|
| `npm run data:publish` | 원격 D1 조회 → 검증 → `src/data/resources.json`, `public/data/resources.{json,csv}` 생성 + 변경 요약 출력 |
| `npm run data:publish -- --dry-run` | 검증·변경 요약만(파일 쓰지 않음) |
| `npm run data:publish -- --commit [--push]` | 생성 후 3개 파일 커밋(`데이터 발행: YYYY.MM.DD HH:mm (CLI)`), `--push`면 푸시까지 |
| `npm run data:apply -- <파일.sql>` | 패치 SQL을 원격 D1에 적용(`edumaps_` 외 테이블이 보이면 거부) |
| `npm run data:check-links -- [--out 파일] [--strict]` | 외부 링크(GET)·이미지(HEAD) 점검 보고서 |
| `npm run media:put -- <파일> [--name 이름] [--dry-run] [--force]` | WebP 변환(최대 폭 1200, 품질 80) → R2 `edulink-pages-media/edumaps/<이름>.webp` |
| `npm run data:init -- --local\|--remote` | **최초 이관 1회용.** 스키마 생성 + `db/seed/0001_initial_from_sheet.sql` 적재(edumaps_* 테이블을 비우고 다시 채움) |

- `data:apply`, `data:publish`에 `--local`을 붙이면 로컬 D1(`db/.wrangler/state`, git 제외)로 연습할 수 있습니다. 로컬 준비: `npm run data:init -- --local`.
- wrangler 설정은 **`db/wrangler.jsonc`**(데이터 스크립트 전용)입니다. 저장소 루트에 `wrangler.jsonc`를 두지 마세요 — `pages_build_output_dir`가 있는 루트 설정은 CF Pages가 프로젝트 설정으로 읽어 대시보드의 환경변수·시크릿 관리 방식이 바뀝니다.

## 첫 원격 적용 절차

1. `npx wrangler whoami`로 로그인 확인
2. `npm run data:init -- --remote` — 스키마 생성 + 초기 데이터 적재 (**1회만**. 다시 실행하면 그 사이 수정분이 지워짐)
3. `npm run data:publish -- --dry-run` — **"변경 없음"**이 나와야 정상입니다. 저장소의 `resources.json`은 이미 같은 seed(§4-1 정정 포함: res_031 링크, res_193·res_195 학년, res_196 설명)로 로컬 D1에서 만들어 커밋되어 있으므로, 원격 D1과 내용이 일치하는지 확인하는 단계입니다.
4. 이후 수정부터는 `npm run data:publish -- --commit --push`로 발행 → 배포 후 사이트 4개 탭·링크 미리보기 확인
5. 구글 시트를 보기 전용으로 전환, GAS 웹앱 배포 중지, GitHub PAT 폐기

## 주의사항

- **공유 DB입니다.** `edu-link-db`에는 edu-link·edu-kit 데이터도 있습니다. `edumaps_` 접두어 테이블만 다루고, 다른 테이블(`resource_stats` 등)은 건드리지 마세요.
- **이미지는 새 이름으로.** `dgedu.link/media/*`는 1년 `immutable` 캐시라 같은 이름으로 덮어쓰면 기존 방문자에게 반영되지 않습니다. `media:put`은 이미 공개된 이름이면 거부하고 `_v2` 이름을 안내합니다.
- **id는 바꾸지 않습니다.** 조회수(`resource_stats`)가 id로 연결됩니다.
- `data:init`은 이관용입니다. 원격에 한 번 적용한 뒤에는 다시 실행하지 마세요.
- `wrangler` 로그인 정보가 유일한 쓰기 권한입니다. 공용 PC에서 로그인 상태로 두지 마세요.
