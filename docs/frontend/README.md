# EduMaps Frontend Guide (Next.js 16 · Static Export)

이 프로젝트는 Next.js 16의 **정적 export(`output: 'export'`)** 로 빌드되어, 런타임 서버 없이 정적 파일만으로 서빙됩니다.

## 1. 아키텍처 개요
- **정적 사이트 생성(SSG)**: `src/app/page.tsx`, `src/app/[tab]/page.tsx`의 서버 컴포넌트가 **빌드 시점**에 `src/data/resources.json`을 읽어 정적 HTML을 생성합니다. (런타임 데이터 페치·ISR 없음)
- **데이터 갱신 흐름**: D1 `edumaps_*` 테이블 수정 → `npm run data:publish -- --commit --push` → GitHub `resources.json` 커밋 → Cloudflare Pages 자동 빌드·배포 (약 1~3분). 자세한 내용은 [데이터 운영 가이드](../data/README.md).
- **Client Components**: 지도·검색·필터 등 인터랙션은 `EduMapsClient.tsx`, `LandingClient.tsx`에서 담당합니다.
  - 하위 컴포넌트: `components/map/`(머리·목록 항목·상세·온라인 격자·썸네일), `components/ui/`(`Chip` 토글 칩, `Dialog` 네이티브 모달)
  - 공용 로직: `lib/catalog.ts`(분류·색·학년 표기), `lib/search.ts`(로드맵 단원명·초성 검색), `lib/resourceTypes.ts`(데이터 타입)
- **정적 HTML에 본문 포함**: `useSearchParams`는 가장 가까운 Suspense까지를 클라이언트 렌더링으로 돌리므로, URL을 읽는 부분만 `UrlSync` 컴포넌트로 분리해 Suspense로 감쌉니다. 페이지 전체를 Suspense로 감싸지 마세요(첫 화면이 빈 로딩 화면이 됨).
- **디자인 토큰**: `globals.css`의 `@theme`(브랜드 초록 `--color-brand`, Pretendard 글꼴). 다크 모드는 시스템 설정을 따르며 컴포넌트마다 `dark:` 값을 함께 둡니다. 애니메이션은 `tw-animate-css`.
- **데이터 형태**: `resources.json`은 `{ generatedAt, items, changelog }` 구조입니다. `src/lib/fetchResources.ts`가 이를 읽어 페이지로 전달하며, 구버전 배열 형태도 하위호환 처리합니다.

## 2. URL 라우팅 및 쿼리 파라미터
- **기본 경로**: `/visitmap`, `/online`, `/roadmap` (`generateStaticParams`로 정적 생성)
- **심화 연동**: `/roadmap?grade=1&id=123`, `/visitmap?id=…`, `/online?id=…`, `/?q=검색어` 형식 지원
  - `grade`: 해당 학년 필터 즉시 적용
  - `id`: 해당 장소의 상세 카드 즉시 펼침
- **동작 방식**: 상세 열기·닫기는 `history.pushState/replaceState`로 `?id=`를 바꾸고, `UrlSync`가 URL 변화를 상태에 반영합니다. 그래서 휴대폰 뒤로가기로 상세가 닫히고, 주소를 그대로 공유할 수 있습니다(상세끼리 이동은 replace라 기록이 쌓이지 않음).
- **메타데이터**: 탭별 `generateMetadata`(제목·설명), 공유 미리보기 이미지 `public/og.png`(1200×630).
- **단일 도메인**: `edumaps-project.pages.dev` 접속 시 `layout.tsx`의 인라인 스크립트가 공식 도메인 `map.dgedu.link`로 리다이렉트합니다.

## 3. 리치 텍스트 (마크다운 링크)
- `src/lib/richText.tsx`의 `renderRichText()`가 `[텍스트](https://…)` 및 맨 URL을 안전하게 `<a>`로 변환합니다 (http/https만 허용).
- 로드맵의 설명·탐구 질문·**사후 활동**(평문 렌더), 학년별 로드맵 텍스트 등에 사용됩니다.

## 4. '최근 업데이트 내용' (변경이력)
- How-To 모달의 변경이력은 D1 **`edumaps_changelog`** 테이블에서 `resources.json`의 `changelog`로 발행합니다.
- 비어 있으면 `HowToModal.tsx`의 `DEFAULT_CHANGELOG`로 폴백합니다.
- **의견 보내기**: 같은 모달의 폼이 `/api/feedback`(Pages Function, Resend 메일)로 보냅니다. 설정은 [백엔드 안내](../backend/README.md).

## 5. 빌드 & 배포
- **빌드**: `npm run build` → 산출물 `out/`
- **호스팅**: Cloudflare Pages (Build command `npm run build`, Output `out`)
- **Node**: `.node-version`으로 22 고정 (Next 16은 Node 20.9+ 필요)
- **로컬 미리보기**: `npm run build` 후 `npx wrangler pages dev out --port 3000` (Functions 포함, 카카오 키는 `localhost:3000`만 허용). Windows 빌드는 Next 16 버그로 prefetch 파일이 폴더로 생겨 링크 미리받기가 404가 나지만, CF Pages(Linux) 빌드는 정상입니다.

## 6. 환경 변수 (Environment Variables)
빌드 시점에 인라인되므로 Cloudflare Pages 프로젝트 설정에 등록합니다.
- `NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID`: 카카오맵 API 키
  - ※ 배포 도메인(`map.dgedu.link`)을 **Kakao 개발자 콘솔의 사이트 도메인 허용목록**에 등록해야 지도가 동작합니다.

> 참고: 정적 export 전환으로 `NEXT_PUBLIC_GAS_URL`은 더 이상 사용하지 않습니다(앱이 런타임에 GAS를 호출하지 않음).
