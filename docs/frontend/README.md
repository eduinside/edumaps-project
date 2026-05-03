# EduMaps Frontend Guide (Next.js 15)

이 프로젝트는 최신 Next.js 기능을 활용하여 구축되었습니다.

## 1. 아키텍처 개요
- **ISR (Incremental Static Regeneration)**: `src/app/[tab]/page.tsx`에서 서버 사이드 데이터 페칭을 수행하며, 1시간마다 자동으로 데이터를 갱신합니다.
- **Client Components**: 지도의 인터랙티브한 기능과 상태 관리는 `EduMapsClient.tsx`에서 담당합니다.

## 2. URL 라우팅 및 쿼리 파라미터
- **기본 경로**: `/visitmap`, `/online`, `/roadmap`
- **심화 연동**: `/roadmap?grade=1&id=123` 형식의 주소를 지원합니다.
  - `grade`: 해당 학년 필터를 즉시 적용합니다.
  - `id`: 해당 장소의 상세 카드를 즉시 펼칩니다.
- **동작 방식**: `useSearchParams`를 통해 URL의 변화를 감지하고, `useEffect`를 통해 상태를 동기화합니다.

## 3. 환경 변수 (Environment Variables)
배포 환경(Vercel 등)에서 반드시 설정해야 할 항목입니다.
- `NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID`: 카카오맵 API 키
- `NEXT_PUBLIC_GAS_URL`: 구글 스프레드시트 연동용 GAS URL
