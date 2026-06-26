# EduMaps Frontend Guide (Next.js 16 · Static Export)

이 프로젝트는 Next.js 16의 **정적 export(`output: 'export'`)** 로 빌드되어, 런타임 서버 없이 정적 파일만으로 서빙됩니다.

## 1. 아키텍처 개요
- **정적 사이트 생성(SSG)**: `src/app/page.tsx`, `src/app/[tab]/page.tsx`의 서버 컴포넌트가 **빌드 시점**에 `src/data/resources.json`을 읽어 정적 HTML을 생성합니다. (런타임 데이터 페치·ISR 없음)
- **데이터 갱신 흐름**: 구글 시트 → 관리자 패널 **[사이트에 발행]** → GitHub `resources.json` 커밋 → Cloudflare Pages 자동 빌드·배포 (약 1~3분). 자세한 내용은 [백엔드 가이드](../backend/README.md).
- **Client Components**: 지도·검색·필터 등 인터랙션은 `EduMapsClient.tsx`, `LandingClient.tsx`에서 담당합니다.
- **데이터 형태**: `resources.json`은 `{ generatedAt, items, changelog }` 구조입니다. `src/lib/fetchResources.ts`가 이를 읽어 페이지로 전달하며, 구버전 배열 형태도 하위호환 처리합니다.

## 2. URL 라우팅 및 쿼리 파라미터
- **기본 경로**: `/visitmap`, `/online`, `/roadmap` (`generateStaticParams`로 정적 생성)
- **심화 연동**: `/roadmap?grade=1&id=123` 형식 지원
  - `grade`: 해당 학년 필터 즉시 적용
  - `id`: 해당 장소의 상세 카드 즉시 펼침
- **동작 방식**: `useSearchParams`로 URL 변화를 감지하고 `useEffect`로 상태를 동기화합니다.
- **단일 도메인**: `edumaps-project.pages.dev` 접속 시 `layout.tsx`의 인라인 스크립트가 공식 도메인 `map.dgedu.link`로 리다이렉트합니다.

## 3. 리치 텍스트 (마크다운 링크)
- `src/lib/richText.tsx`의 `renderRichText()`가 `[텍스트](https://…)` 및 맨 URL을 안전하게 `<a>`로 변환합니다 (http/https만 허용).
- 로드맵의 설명·탐구 질문·**사후 활동**(평문 렌더), 학년별 로드맵 텍스트 등에 사용됩니다.

## 4. '최근 업데이트 내용' (변경이력)
- How-To 모달의 변경이력은 GAS가 **`변경이력` 시트**에서 읽어 `resources.json`의 `changelog`로 발행합니다.
- 시트가 비어있거나 없으면 `HowToModal.tsx`의 `DEFAULT_CHANGELOG`로 폴백합니다.

## 5. 빌드 & 배포
- **빌드**: `npm run build` → 산출물 `out/`
- **호스팅**: Cloudflare Pages (Build command `npm run build`, Output `out`)
- **Node**: `.node-version`으로 22 고정 (Next 16은 Node 20.9+ 필요)

## 6. 환경 변수 (Environment Variables)
빌드 시점에 인라인되므로 Cloudflare Pages 프로젝트 설정에 등록합니다.
- `NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID`: 카카오맵 API 키
  - ※ 배포 도메인(`map.dgedu.link`)을 **Kakao 개발자 콘솔의 사이트 도메인 허용목록**에 등록해야 지도가 동작합니다.

> 참고: 정적 export 전환으로 `NEXT_PUBLIC_GAS_URL`은 더 이상 사용하지 않습니다(앱이 런타임에 GAS를 호출하지 않음).
