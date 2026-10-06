# 에듀맵스 점검 및 개선 계획 (2026.10)

> 작성 2026-10-06 · **v3 (2026-10-07)** · 상태: **1~6단계 구현·배포 완료, D1 원격 이관 완료** — 남은 일: 시트·GAS 정리 (§8)
> 범위: 프론트엔드 전체(`src/`), 데이터(`resources.json` 89건), 운영 사이트(`map.dgedu.link`) 실측, 데이터 관리 체계
> 대상 콘텐츠 4가지: **① 체험학습 지도 ② 온라인 학습 ③ 학년별 로드맵 ④ 홈(검색·이달의 추천·자료실 캐러셀)**
> 사용자: **학생과 학부모가 함께 쓰는 도구**

### 개정 이력
- **v3**: 1~6단계 구현 결과·계획과 달라진 점을 §8에 기록. 운영자 결정 반영(시트·관리자 패널 편집자 없음, main 직접 커밋, 초록·'교육수도 대구' 로고·아이템 구성 유지, 의견 보내기는 Resend 메일).
- **v2**: 중점을 **① 내용 정합성 ② 디자인 개선 ③ 버그 수정**으로 재정리. 대상·톤 등 주요 문구 변경과 일부 운영 항목(H6 등)은 보류(§7). 데이터 관리를 **구글 시트 → edu-link D1(관리 화면 없음)**으로 전환하는 계획으로 §5 교체. 기존 실행 단계 7(학생 재미 요소)은 기록만 남기고 보류.
- v1: 최초 점검.

---

## 0. 요약

| 축 | 핵심 문제 | 대표 조치 |
|---|---|---|
| **버그** | 홈 추천 누락, 글꼴·애니메이션 미적용, 모바일 지도 가림, 뒤로가기 시 이탈 등 10건 | §2 버그 목록 일괄 수정 |
| **디자인** | 글꼴·다크모드·과한 장식으로 "오래된 느낌", 8~10px 글씨, 키보드 조작 불가 | Pretendard + 색 토큰 + 공용 컴포넌트 + 접근성 기본기 |
| **정합성** | 응답 이상 링크 4건, `http://` 3건, 학년 불일치 3건, 검증 없는 발행 | D1 스키마 제약 + 발행 전 검증 + 월 1회 링크 점검 |
| **데이터 기반** | 시트+GAS+공유 비밀번호(기본값이 공개 저장소에 노출) | edu-link D1을 정본으로, 편집은 CLI·SQL 패치·CF 대시보드, 공유는 정적 JSON/CSV |

우선순위: **P0** 지금 / **P1** 다음 작업 단위 / **P2** 여유 있을 때

---

## 1. 점검 방법과 실측 결과

- 소스 정독: `EduMapsClient.tsx`(801줄), `LandingClient.tsx`, `MapComponent.tsx`, `HomeCarousel.tsx`, `HowToModal.tsx`, `VideoModal.tsx`, `layout.tsx`, `globals.css`
- 데이터 스크립트 검사: 89건(현장 41 / 온라인 48, 로드맵 연계 27곳, 활용 주제 67개)
- 외부 링크 89건·이미지 89건 실제 요청, 운영 사이트 데스크톱·모바일(375×812) 확인

| 지표 (운영 사이트, 홈) | 값 | 비고 |
|---|---|---|
| TTFB | 약 650ms | HTML `cache-control: no-store` |
| DOMContentLoaded / load | 약 1.5초 / 6.2초 | GA, 캐러셀 배경(유튜브 썸네일), 카카오 SDK |
| HTML | 90KB (gzip 19KB) | 89건 데이터는 들어 있으나 **화면 본문은 없음**(B1) |
| JS | 약 155KB | 적정 |
| 리소스 이미지 | 3~31KB webp, `immutable` 캐시 | 양호 (단, 같은 파일명 교체 시 갱신 안 됨 — §4) |
| 페이지 제목 | 4개 페이지 모두 동일 | D-항목 C3 |

---

## 2. 버그 수정 (최우선)

| # | 버그 | 위치·근거 | 수정 | 우선 |
|---|---|---|---|---|
| **B1** | **정적 HTML에 본문 없음.** 페이지 전체를 감싼 `<Suspense>` 안에서 `useSearchParams()`를 써서 정적 export 시 통째로 클라이언트 렌더링으로 넘어감 → 첫 화면은 초록 점(홈)·`Loading...`(탭) | `src/app/page.tsx`, `src/app/[tab]/page.tsx:26` | `useSearchParams`를 쓰는 부분만 작은 컴포넌트(`<UrlSync/>`)로 분리해 그것만 Suspense로 감쌈. 탭 폴백은 스켈레톤으로 | **P0** |
| **B2** | **홈 추천 누락.** 학년 선택 시 `recommended_grade`에 그 학년이 없으면 활용 주제가 있어도 빠짐 → 국채보상운동기념도서관(4학년), 향촌문화관(3·4학년) 미노출 | `LandingClient.tsx:198-200` | 판정을 `grade_topics` 기준으로 변경 + 데이터 정합(§4) + D1 제약으로 재발 방지 | **P0** |
| **B3** | **모바일에서 목록 패널이 지도를 거의 다 덮음**(375px 실측, 지도는 좌우 끝만 보임) | `EduMapsClient.tsx:355` | 모바일 **하단 시트**(접힘/반/전체 3단) + "지도 \| 목록" 전환. 상세도 같은 시트에서 열기 | **P0** |
| **B4** | **글꼴 미적용.** Plus Jakarta Sans(라틴 전용)를 불러오지만 `body { font-family: Arial }`이 덮어씀. `--font-sans`는 정의되지 않은 `--font-geist-sans`를 가리킴 → 한글은 OS 기본 글꼴 | `globals.css:10-12, 25`, `layout.tsx:7` | Pretendard(가변·다이내믹 서브셋)로 통일, Jakarta 제거 | **P0** |
| **B5** | **애니메이션 클래스 무동작.** `animate-in fade-in zoom-in slide-in-*` 사용 중이나 `tw-animate-css` 미설치 | 모달·패널·검색 드롭다운 | `tw-animate-css` 추가 또는 클래스 정리. `prefers-reduced-motion` 존중 | P1 |
| **B6** | 상세를 열어도 URL이 그대로 → **휴대폰 뒤로가기 = 사이트 이탈**, 보고 있는 장소 공유 불가 | 상세 선택이 state만 변경 | 상세 열기 시 `?id=` 반영, 뒤로가기로 닫힘 | P1 |
| **B7** | 로드맵 탭에서 **지도 마커를 누르면 학년이 선택되지 않아** 탐구 질문 대신 일반 설명이 나옴(목록 클릭은 자동 선택됨) | `EduMapsClient.tsx:343-346` vs `466-469` | 마커 클릭도 같은 선택 로직 사용(공용 함수로) | P1 |
| **B8** | 모바일 상세에서 하단 고정 버튼(웹사이트·길찾기)이 본문을 가림 | 실측 | 본문 하단 여백 확보 또는 버튼 위치 조정(B3와 함께) | P1 |
| **B9** | 길찾기 URL에 장소명 인코딩 없음(쉼표·괄호 포함 시 깨짐) | `EduMapsClient.tsx:758` | `encodeURIComponent(title)` | P1 |
| **B10** | 온라인 탭에서도 지도가 생성되고 타일을 내려받음(흐림으로 가렸을 뿐) | `EduMapsClient.tsx:338-351` | 온라인 탭에서는 지도 미렌더 | P2 |
| B11 | 캐러셀이 마우스 호버에만 멈추고 터치·키보드 포커스 중에는 계속 넘어감 | `HomeCarousel.tsx:214-219` | 정지/재생 버튼, 포커스·터치 시 정지(A3와 함께) | P1 |

---

## 3. 디자인 개선

### 3-1. 시각 체계 ("오래된 느낌"의 원인)

| # | 문제 | 개선안 | 우선 |
|---|---|---|---|
| U1 | 글꼴(B4) | Pretendard 단일 글꼴, 굵기 단계 정리(400/600/800) | **P0** |
| U3 | 다크 모드 반쪽: 필터 칩(`bg-slate-100 text-slate-600`), '모든 학년' 배지, 이용방법 '최근 업데이트' 제목 등 다크 대응 없음 → 어두운 화면에 흰 칩이 튐 | 색을 CSS 변수 토큰(`--surface`, `--chip`, `--accent` 등)으로 모으고 다크 값 일괄 정의 | P1 |
| U5 | 같은 칩·카드 스타일이 파일마다 복붙(필터 버튼 클래스 10곳 이상), 카테고리 색은 일부 화면에만 적용 | `Chip`, `ResourceCard`, `Sheet`, `Dialog` 공용 컴포넌트 + 카테고리 색 토큰 공유 | P1 |
| U6 | 썸네일 로딩 전 흰 사각형만 보임(모바일 실측) | 카테고리 색 배경 + 아이콘 플레이스홀더 | P2 |
| U7 | 큰 라운드(`rounded-[2.5rem]`)·짙은 그림자·흐림 효과가 겹쳐 무겁고, 저사양 기기에서 `backdrop-blur` 비용 큼 | 라운드 1~2단계, 그림자 2단계로 정리, blur는 헤더에만 | P1 |
| O1 | 온라인 탭 데스크톱 6열 칸반: 1280px 미만에서 가로 스크롤, 카드 글씨 8~9px | 반응형 카드 그리드(2~4열) + 상단 카테고리 칩. 칸반은 와이드 화면에서만 | P1 |
| O4 | 온라인 상세 이미지 `h-64` → 모바일에서 설명·버튼이 아래로 밀림 | 모바일 이미지 높이 축소 | P2 |
| V2 | 지도 마커가 카카오 기본 핀 하나 → 선택된 곳·종류 구분 불가 | 태그별 색 `CustomOverlay` 마커, 선택 마커 강조, 클러스터러 | P1 |
| V5 | 지역 필터 9개가 3줄 차지 | 가로 스크롤 칩 1줄 | P2 |
| O2 | 로그인 필요 14건이 작은 회색 태그로만 표시 → 들어갔다가 막힘 | 🔒 배지를 카드·상세에서 눈에 띄게 (표시 방식만 변경, 안내 문구 추가는 보류) | P1 |

### 3-2. 접근성 (학생·학부모·저시력·키보드 사용자)

| # | 문제 | 근거 | 개선안 | 우선 |
|---|---|---|---|---|
| A1 | 카드가 `div onClick` → 키보드로 선택 불가, 스크린리더가 버튼으로 인식 못함 | `LandingClient.tsx:40`, `EduMapsClient.tsx:458, 528` | `<button>`/`<Link>`로 교체 | **P0** |
| A2 | 8~10px 글씨 다수 | `EduMapsClient.tsx:487, 490, 548, 551` | 본문 최소 14px, 보조 12px, 태그 수 축소 | **P0** |
| A3 | 캐러셀 자동 넘김에 정지 버튼 없음(WCAG 2.2.2) | `HomeCarousel.tsx` | B11과 함께 처리, reduced-motion이면 자동 넘김 끔, 스와이프 | P1 |
| A4 | 모달에 `role="dialog"`·`aria-modal`·ESC·포커스 가두기 없음 | `HowToModal.tsx`, `VideoModal.tsx` | 공용 `Dialog`(네이티브 `<dialog>`) | P1 |
| A5 | 아이콘 버튼에 이름 없음(목록 접기/펼치기, 상세 닫기) | `EduMapsClient.tsx:402, 572, 589` | `aria-label` | P1 |
| A6 | 필터 선택 상태가 색으로만 표시 | 전 필터 | `aria-pressed` + 체크 아이콘 | P1 |
| A7 | 툴팁이 마우스 호버 전용 | 헤더 탭 | 제거 또는 상시 노출 | P2 |
| A8 | 검색창 `<label>` 없음 | `LandingClient.tsx:298`, `EduMapsClient.tsx:274` | `aria-label` | P1 |
| A9 | 위치 실패 시 `alert()` | `EduMapsClient.tsx:102` | 인라인 안내 + 지역 선택 유도 | P2 |

### 3-3. 속도·공유 미리보기

| # | 문제 | 개선안 | 우선 |
|---|---|---|---|
| C1 | = B1 | | **P0** |
| C3 | 4개 페이지 제목·설명 동일, OG 이미지 없음 → 카톡·밴드 공유 미리보기 빈약 | `generateMetadata`로 탭별 title/description(현재 문구 재사용), `openGraph.images` | P1 |
| C5 | 탭마다 89건 전체 JSON 반복 포함 | 300건 이상이 되면 탭별 필드만 전달 | P2 |
| C6 | 데이터 전부 `any` 타입 | `Resource`/`GradeTopic` 타입 — §5의 D1 스키마·검증 스크립트와 공유 | P1 |

### 3-4. 기능 보완 (디자인 작업과 함께)

| # | 내용 | 우선 |
|---|---|---|
| H2 | 검색 대상에 로드맵 주제명·교과 포함(예: "식물의 생활", "화석"). 초성 검색 | P1 |
| O3 | 온라인 탭 학년 필터(권장 학년 데이터 이미 있음) | P1 |
| V4 | '내 근처'가 상위 10곳으로 잘린다는 표시("가까운 10곳") | P2 |
| H3 | 검색 0건 시 추천 자료 노출 | P2 |

---

## 4. 내용 정합성

### 4-1. 확인된 항목 (2026-10-06 실측) — D1 이관 시 함께 정정

| 구분 | 항목 | 내용 | 조치 |
|---|---|---|---|
| 링크 응답 이상 | res_031 AI 디지털 교육자료 `aidtbook.kr` | HTTP 500 | 서비스 운영 여부 확인 |
| | res_015 다국어 동화 `nlcy.go.kr/MANY` | HTTP 500 | 주소 변경 여부 확인 |
| | res_112 사라온이야기마을 `:6450` 포트 | HTTP 503 | 공식 주소 재확인(비표준 포트는 학교망에서 막히기 쉬움) |
| | res_046 스토리라인 온라인 | HTTP 403 | 봇 차단 가능성 — 브라우저로 확인 |
| `http://` | res_121 낙동강승전기념관, res_197 대구향교, res_199 한방의료체험타운 | 브라우저 경고 가능 | `https` 지원 확인 후 교체 |
| 학년 불일치 | res_193 국채보상운동기념도서관(주제 4학년), res_195 향촌문화관(주제 3·4학년) | `recommended_grade`에 없음 → B2 유발 | 권장 학년 보완 |
| 설명 부족 | res_196 서문시장 | 설명 10자 미만 | 한 줄 설명 보강 |
| 이미지·좌표 | 89건 이미지 정상, 현장 41곳 좌표 대구·군위 범위 내, 중복 없음 | — | — |

> 403/500은 자동 요청 거부일 수 있으므로 브라우저로 재확인 후 수정.

### 4-2. 재발 방지

1. **DB 제약**: 학년 1~6, 월 1~12, `type` 값, `https://` 시작, 좌표 범위를 D1 `CHECK`로 강제(§5-3) — 잘못된 값은 저장 자체가 안 됨
2. **발행 전 검증 스크립트**(`npm run data:publish` 내장): DB 제약으로 못 거르는 규칙
   - 활용 주제 학년 ⊂ 권장 학년, 설명 최소 길이, 고아 주제(없는 장소를 가리킴) 없음
   - 실패 시 발행 중단 + 문제 항목 목록 출력
3. **월 1회 링크 점검**: GitHub Actions 예약 실행(무료)으로 `external_url` 전체 확인 → 이상 링크를 이슈로 등록
4. **항목별 `verified_at`(최종 확인일)** 컬럼 — 6개월 지난 항목을 점검 스크립트가 목록으로 출력
5. **이미지 교체 규칙**: `dgedu.link/media/*`는 1년 `immutable` 캐시이므로 **같은 파일명으로 덮어쓰면 기존 방문자에게 갱신되지 않음** → 교체 시 `res_131_v2.webp`처럼 새 이름으로 올리고 `image_url` 변경

---

## 5. 데이터 관리 전환: 구글 시트 → edu-link D1 (관리 화면 없음)

### 5-1. 현재 구조와 문제

```
구글 시트 ─ GAS(시트 버튼 / 관리자 패널 + 공유 비밀번호) ─ GitHub API(PAT) → resources.json 커밋 → CF Pages 빌드
```

- **(P0, 이관 전이라도 즉시)** 관리자 비밀번호 기본값 `edumaps123!`이 **공개 저장소** `docs/backend/code.gs:151`에 있음. `ADMIN_PASSWORD` 미설정이면 패널 URL을 아는 누구나 수정·삭제·발행 가능 → 설정 여부 확인, 이관 완료 시 웹앱 배포 중지
- 공유 비밀번호라 수정자 추적 불가, 검증·미리보기 없이 바로 운영 반영, 개인 PAT 만료 시 발행 중단, GAS 코드 수동 "새 배포"로 저장소와 배포본 불일치

### 5-2. 목표 구조

```
                    ┌─ (빠른 수정) CF 대시보드 D1 콘솔
edu-link-db (D1) ◀──┼─ (일반 수정) data/patches/*.sql  ─ npm run data:apply   ← Claude Code가 패치 작성 가능
  edumaps_* 테이블   └─ (이미지)    npm run media:put → R2 edulink-pages-media/edumaps/
        │
        ▼ npm run data:publish  (조회 → 검증 → 생성 → 커밋·푸시)
src/data/resources.json  +  public/data/resources.json / resources.csv
        │
        ▼ CF Pages 자동 빌드 (사이트는 지금처럼 100% 정적)
map.dgedu.link   ── 동료 공유: map.dgedu.link/data/resources.csv (읽기 전용)
```

**원칙**
- **정본 = D1.** `resources.json`은 발행 산출물(직접 수정 금지 규칙은 유지, 대상만 시트 → D1로 바뀜)
- **관리용 프론트 없음.** 쓰기 API도 만들지 않음 → 공격 표면 0. 쓰기는 소유자의 `wrangler` 인증으로만
- **사이트는 런타임에 D1을 부르지 않음**(100% 정적 규칙 유지). 빌드도 D1에 의존하지 않음 → edu-link 장애가 사이트 빌드를 막지 않음
- **변경 이력 = git.** 패치 SQL과 `resources.json` 차이가 커밋에 남아 누가·언제·무엇을 바꿨는지 추적, 되돌리기는 `git revert` + 재적용
- **선례 따름**: edu-kit이 자체 `wrangler.jsonc`로 같은 `edu-link-db`에 `edukit_` 접두어 테이블을 둠 → edumaps도 **`edumaps_` 접두어**, 스키마는 edumaps 저장소 `db/`에서 관리. 기존 테이블 변경 없음 → edu-link·edu-kit 영향 없음

### 5-3. 스키마 초안 (`db/schema.sql`)

```sql
CREATE TABLE edumaps_items (
  id                 TEXT PRIMARY KEY,                       -- 'res_131' (기존 id 유지 → resource_stats 연결 유지)
  type               TEXT NOT NULL CHECK (type IN ('OFFLINE','ONLINE')),
  title              TEXT NOT NULL,
  category           TEXT NOT NULL,                          -- 지역(현장) 또는 분야(온라인)
  tags               TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
  recommended_grades TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]' CHECK (json_valid(recommended_grades)),
  description        TEXT NOT NULL CHECK (length(description) >= 10),
  lat                REAL CHECK (lat IS NULL OR lat BETWEEN 35.5 AND 36.5),
  lng                REAL CHECK (lng IS NULL OR lng BETWEEN 128.2 AND 129.0),
  image_url          TEXT,                                   -- NULL이면 media/edumaps/{id}.webp
  external_url       TEXT NOT NULL CHECK (external_url LIKE 'https://%'),
  sort               INTEGER NOT NULL DEFAULT 0,
  is_active          INTEGER NOT NULL DEFAULT 1,             -- 0=숨김(삭제 대신)
  verified_at        TEXT,                                   -- 링크·내용 최종 확인일
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (type = 'ONLINE' OR (lat IS NOT NULL AND lng IS NOT NULL))
);

CREATE TABLE edumaps_topics (                                -- 기존 '활용' 시트
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id           TEXT NOT NULL REFERENCES edumaps_items(id) ON DELETE CASCADE,
  grade             INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 6),
  month             INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  subject           TEXT NOT NULL,
  topic_title       TEXT NOT NULL,
  description       TEXT NOT NULL,
  inquiry_questions TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(inquiry_questions)),
  post_activities   TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(post_activities)),
  sort              INTEGER NOT NULL DEFAULT 0,              -- 기존 usage_index 대체
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_edumaps_topics_item ON edumaps_topics(item_id);

CREATE TABLE edumaps_changelog (                             -- 기존 '변경이력' 시트
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                                        -- '2026.10.06'
  text TEXT NOT NULL
);
```

- 월은 정수로 저장하고 `resources.json`에서는 기존 형식(`"11월"`)으로 변환 → **프론트엔드 변경 없이** 이관 가능
- `res_121` 등 `http://` 3건은 CHECK에 걸리므로 이관 시 정정이 강제됨(§4-1 정리 겸용)
- 운영시간·요금·주소 등 장소 정보 컬럼(V3)은 보류 항목 — 필요해지면 `ALTER TABLE ADD COLUMN`으로 추가

### 5-4. 작업 방식 (관리 화면 없이)

| 상황 | 방법 |
|---|---|
| 오탈자·한두 칸 수정 | CF 대시보드 → D1 → `edu-link-db` 콘솔에서 `UPDATE` 실행 → `npm run data:publish` |
| 장소 추가·여러 항목 수정 | `data/patches/20261006-수목원-학년보완.sql` 작성(또는 Claude Code에 "○○ 추가해줘" 요청) → `npm run data:apply -- <파일>` → `npm run data:publish` |
| 이미지 추가·교체 | `npm run media:put -- res_201.webp` (WebP 변환 → R2 `edumaps/` 업로드, 교체 시 새 이름 규칙 §4-2) |
| 변경이력 공지 | `edumaps_changelog`에 한 줄 INSERT (패치 파일에 함께) |
| 되돌리기 | `git revert`로 `resources.json` 복원 즉시 배포 + 역패치 SQL로 D1 정합 |

**스크립트 (edumaps 저장소, Node + wrangler)**

| 명령 | 동작 |
|---|---|
| `data:apply` | `wrangler d1 execute edu-link-db --remote --file <패치>` |
| `data:publish` | D1 조회(`--json`) → 검증(§4-2) → `resources.json`·`public/data/resources.{json,csv}` 생성 → 변경 요약 출력(추가/수정/삭제 건수) → 확인 후 커밋·푸시 |
| `data:check-links` | 외부 링크·이미지 점검(로컬 실행 + 월 1회 Actions) |
| `media:put` | `sharp`로 WebP 변환 → `wrangler r2 object put edulink-pages-media/edumaps/<파일>` |

- edumaps에 `wrangler.jsonc`(D1 바인딩만) 추가, `wrangler`를 devDependency로
- 발행 커밋 메시지는 기존 형식 유지: `데이터 발행: 2026.10.06 14:00 (CLI)`

### 5-5. 동료와의 공유

| 필요 | 방법 |
|---|---|
| **데이터 보기·활용** (다른 교사·다른 앱) | 고정 주소 `map.dgedu.link/data/resources.csv`(엑셀용), `.../resources.json`(앱용). 정적 파일이라 빠르고 무료, 항상 사이트와 같은 버전 |
| **수정·추가 제안** | 관리 화면 대신 **제보 창구** 하나: 이용방법 모달의 기존 '의견 남기기'를 edu-link 설문(`kind='survey'`)으로 교체하면 응답이 같은 D1에 쌓여 소유자가 패치로 반영. 질문: 대상 항목·수정 내용·근거 링크 |
| **공동 편집자가 생길 때** | CF 계정 멤버 초대는 D1 전체(edu-link·edu-kit 데이터 포함) 권한이 되므로 비추천. 저장소 협업자로 초대해 `data/patches/*.sql`을 PR로 받고, 소유자가 `data:apply` 실행 |

### 5-6. 이관 절차

| 단계 | 작업 | 완료 기준 |
|---|---|---|
| 1 | `db/schema.sql` 작성, `wrangler.jsonc` 추가, 원격 D1에 테이블 생성 | 3개 테이블 생성 확인 |
| 2 | 현재 `resources.json` → INSERT SQL 변환 스크립트(1회용). §4-1 정정(http 3건·학년 3건·서문시장 설명)을 변환 과정에서 반영 | CHECK 위반 0건으로 적재 |
| 3 | `data:publish` 구현 후 **드라이런**: 생성된 JSON과 현재 JSON을 비교 → 차이가 §4-1 정정분뿐인지 확인 | 의도한 차이만 존재 |
| 4 | 첫 실제 발행 → 사이트 확인 | 4개 탭 정상, 링크 미리보기 정상 |
| 5 | 구글 시트를 **보기 전용**으로 전환(상단에 "D1로 이관됨" 안내), GAS 웹앱 **배포 중지**, GitHub PAT **폐기** | 시트 경로로 발행 불가 |
| 6 | `docs/backend/`를 `docs/backend/_legacy-gas/`로 이동, `docs/backend/README.md`를 D1 운영 가이드로 교체, 프로젝트 `CLAUDE.md`의 데이터 흐름·규칙 갱신 | 문서 일치 |

- 비용: D1 무료 한도(일 500만 읽기 / 10만 쓰기) 대비 사용량 무시 가능, Actions·Pages 빌드 무료 한도 내
- 위험: 소유자 1인만 쓰기 가능(현재도 사실상 동일). 소유자 PC의 `wrangler` 인증이 유일한 쓰기 경로이므로 인증 정보 관리 주의

---

## 6. 실행 순서

| 단계 | 묶음 | 항목 | 규모 |
|---|---|---|---|
| 1 (즉시) | 보안·치명 버그 | §5-1 비밀번호 확인, B2 추천 누락, B9 길찾기 인코딩 | 반나절 |
| 2 | 데이터 이관 | §5-6 단계 1~4 (§4-1 정정 포함), 발행 전 검증 | 1~2일 |
| 3 | 화면 버그 | B1 정적 본문, B3·B8 모바일 하단 시트, B6 뒤로가기, B7 마커 학년, B10 | 1~2일 |
| 4 | 디자인 기반 | B4/U1 Pretendard, B5 애니메이션, U3 다크 토큰, U5 공용 컴포넌트, U7 장식 정리 | 1~2일 |
| 5 | 접근성 | A1·A2(P0), A3/B11·A4·A5·A6·A8 | 1일 |
| 6 | 화면 개선·마무리 | O1 온라인 그리드, V2 마커, O2 로그인 배지, C3 메타·OG, H2 검색 범위, O3 학년 필터, §5-6 단계 5~6, 링크 점검 Actions | 1~2일 |
| ~~7~~ | **보류** | §7 참고 | — |

각 단계 완료 시 `docs/CHANGELOG.md`와 `edumaps_changelog` 갱신.

---

## 7. 보류 항목 (기록만 유지)

| # | 내용 | 보류 사유 |
|---|---|---|
| U4 | 대상·톤 등 주요 문구 변경 (현재 "우리 아이", "다른 학부모님들이" 등 보호자 기준 문구) | 학생·학부모 공용 도구로 현 문구 유지. 추후 공용 톤 검토 시 재개 |
| 4-2(구) | 학생 대상 설명 문체 기준("~해요" 체, 40자 안팎) | U4와 함께 보류 |
| H6 | 홈 바로가기 '이용방법' → '자료실' 교체 | 운영 판단 보류 |
| H5 | '많이 찾는 자료' 늦게 끼어드는 레이아웃 밀림 → 발행 시 순위 정적화 | 운영 항목. §5 이관 후 `resource_stats`를 발행 시 함께 조회하면 쉽게 해결 가능(재개 시 참고) |
| O2(일부) | 로그인 필요 자료에 "어떤 계정으로?" 안내 문구 | 문구 작업 보류(배지 표시는 진행) |
| R1 | 로드맵을 학년×월 타임라인으로 재구성 | 기존 단계 7 |
| R3 | 탐구 질문·사후 활동 활동지 인쇄 | 기존 단계 7 |
| H4 | 선택 학년 기억(`localStorage`) | 기존 단계 7 |
| V7 | 찜·다녀온 곳 스탬프(`localStorage`) | 기존 단계 7 |
| V3 | 장소 정보(주소·운영시간·휴관일·요금·예약) | 기존 단계 7. D1 컬럼 추가로 대응 가능 |
| R4 | 학년·월별 주제 편차 보강(1·6학년 7개, 5·12월 3개) | 콘텐츠 제작 작업 |

---

## 부록: 확인하지 못한 것

- 실제 학교 PC(구형 브라우저·학교망 필터)·스크린리더 실사용 테스트
- GAS 실제 배포본과 저장소 `code.gs`의 일치 여부, `ADMIN_PASSWORD` 설정 여부
- CF 대시보드 D1 콘솔의 표 편집 기능 범위(콘솔 SQL 실행은 확실, 셀 단위 편집 UI는 이관 시 확인)

---

## 8. 실행 결과 (2026-10-07)

로컬 커밋까지 완료, **푸시·원격 D1 적용은 운영자 검토 후**. 검증은 `wrangler pages dev out --port 3000`(Pages Function 포함)에서 데스크톱(1280×800)·모바일(375×812), 라이트·다크로 확인.

### 단계별 상태

| 단계 | 상태 | 비고 |
|---|---|---|
| 1 보안·치명 버그 | ✅ | B2·B9 수정, `code.gs` 기본 비밀번호 제거. **`ADMIN_PASSWORD` 설정 여부는 미확인** → 이관 후 GAS 웹앱 배포 중지로 해소 |
| 2 데이터 이관 | ✅ 로컬 / ⏳ 원격 | 로컬 D1로 seed→발행 검증, `resources.json` 차이는 §4-1 정정분만. 원격은 `docs/data/README.md` "첫 원격 적용 절차" |
| 3 화면 버그 | ✅ | B1·B3·B6·B7·B8·B10 (+ 썸네일 투명 버그) |
| 4 디자인 기반 | ✅ | Pretendard, tw-animate-css, 다크 일관화, 공용 컴포넌트, 장식 정리 |
| 5 접근성 | ✅ | A1~A9 (A7 툴팁은 `title` 속성으로 대체) |
| 6 화면 개선·마무리 | ✅ / ⏳ | O1·V2·O2(배지)·C3·H2·O3·V4·A9 완료, 링크 점검 Actions 추가, GAS 문서 `_legacy-gas/`로 보관. **시트 보기 전용·GAS 배포 중지·PAT 폐기는 운영자 작업** |
| 7 | 보류 | §7 |
| 추가 | ✅ | 의견 보내기(Resend) — 운영자 요청 |

### 계획과 달라진 점
- **`http://` 링크 허용**: res_121·res_197·res_199는 HTTPS가 열리지 않아(연결 실패) DB CHECK를 `http(s)://`로 완화하고 발행 시 경고로 처리.
- **wrangler 설정 위치**: 루트 `wrangler.jsonc`(+`pages_build_output_dir`)는 CF Pages가 프로젝트 설정으로 읽어 대시보드 환경변수 관리가 바뀌고 D1 바인딩이 Function에 노출될 수 있어 **`db/wrangler.jsonc`**(데이터 스크립트 전용)로 둠.
- **수정 제안 창구**: edu-link 설문 대신 **자체 폼 + Pages Function + Resend 메일**(dge-atlas 방식). "100% 정적" 규칙의 유일한 예외로 CLAUDE.md에 명시.
- **응답 이상 링크**: res_031은 `edupath.kr`로 교체. res_046(403)은 재점검 시 정상. res_015 다국어 동화(500)·res_112 사라온이야기마을(503)은 **운영자 확인 결과 현재 주소가 맞음**(2026-10-07) → 자동 요청에만 오류를 내는 것으로 보고 유지, 월 1회 링크 점검에서 계속 추적.
- **클러스터러 미적용**: 현장 41곳은 겹침이 적어 색 핀·선택 강조로 충분하다고 판단.
- **H6 보류 유지**: 홈 바로가기 4칸 구성 그대로.

### 운영자 작업 목록 (배포 전후)
1. ✅ 로컬 커밋 검토 → `git push` (CF Pages 자동 배포)
2. ✅ CF Pages 환경변수 추가: `RESEND_API_KEY`(암호화), `FEEDBACK_TO`, `FEEDBACK_FROM`
3. ✅ `npm run data:init -- --remote` → 원격 D1과 저장소 데이터 일치 확인("변경 없음", 2026-10-07)
4. ✅ `data/patches/20261007-변경이력-화면개선.sql` 원격 적용·발행 (2026-10-07)
5. ⏳ 구글 시트 보기 전용, GAS 웹앱 배포 중지, GitHub PAT 폐기
6. ✅ res_015·res_112 링크 확인 — 현재 주소 유지
