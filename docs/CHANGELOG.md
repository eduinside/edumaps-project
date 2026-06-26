# 에듀맵스 변경 사항 기록

모든 주목할 만한 변경 사항을 이 파일에 기록합니다.

## [2026.06.26] - 정적 배포 전환 (Static Export + GitHub 발행)

> 작업 브랜치: `feat/static-export` · 검증 후 Cloudflare Pages 연결 예정

### 변경됨
- **렌더링 방식**: Next.js ISR(런타임 GAS 페치) → **완전 정적 export**(`output: 'export'`)로 전환. 빌드 시 `out/`에 정적 HTML 생성, 사용자 요청 경로에서 서버·GAS 미접촉
  - `next.config.ts`: `output: 'export'`, `images.unoptimized: true` 추가
  - `src/lib/fetchResources.ts`: GAS 런타임 페치 제거 → 로컬 `resources.json` import. `{ generatedAt, items }`/배열 두 형태 수용
  - `src/app/page.tsx`, `src/app/[tab]/page.tsx`: `revalidate` 제거, `generatedAt`을 '데이터 최종 갱신' 표시에 사용
- **데이터 갱신 흐름**: `/api/refresh` 호출 → **GitHub 커밋 → Cloudflare Pages 자동 배포**
  - `docs/backend/code.gs`: `doGet` 로직을 `buildResourcesJson()`으로 추출, `triggerRevalidation` → **`publishToGitHub`**(GitHub Contents API 커밋)로 개조, `getGithubConfig_` 추가
  - `docs/backend/index.html`: 설정 탭/사이드바의 'ISR 캐시 새로고침' → **'사이트에 발행'**으로 라벨·동작 변경

### 제거됨
- `src/app/api/refresh/route.ts` (정적 export 미지원)
- `LandingClient.tsx`의 `?refresh=1` 관리자 모드
- `@vercel/analytics`, `@vercel/speed-insights` (Cloudflare 환경 무동작)

### 배포 메모
- 빌드: `npm run build` → 산출물 `out/`
- 실제 도메인을 **Kakao 개발자 콘솔 허용목록**에 등록해야 지도 동작

## [2026.06.17] - 브랜드명 한글화 · UX 개선

### 변경됨
- **사이트 이름 한글화**: 영문 `EduMaps` 표기를 전면 `에듀맵스`(한글)로 통일
  - 헤더 로고 텍스트 (랜딩·지도 페이지)
  - 이미지 alt 텍스트 (`에듀맵스 로고`)
  - 로딩 화면 문구
  - 이용방법 모달 제목 및 소개 문구
  - 공유(navigator.share) 제목
  - 브라우저 탭 SEO 타이틀: `에듀맵` → `에듀맵스`
  - 관련 파일: `src/components/LandingClient.tsx`, `src/components/EduMapsClient.tsx`, `src/components/HowToModal.tsx`, `src/app/page.tsx`, `src/app/layout.tsx`

### 추가됨
- **히어로 텍스트 줄바꿈 개선**: `break-keep` 클래스 추가로 모바일에서 한글 단어 중간 잘림 방지 (`src/components/LandingClient.tsx`)
- **푸터 에듀모아 표기**: 푸터 하단에 `에듀모아` 텍스트 추가 (`src/components/LandingClient.tsx`)

---

## [계획] - 캐러셀 영상 팝업 모달

> 상태: 검토 완료, 미구현

### 개요
캐러셀 슬라이드에 `type: "video"` 슬라이드를 추가하여, 클릭 시 YouTube 영상을 인앱 팝업으로 재생.

### 구현 계획

1. **타입 확장** (`src/components/HomeCarousel.tsx`)
   - `Slide` 인터페이스에 `type: "video"` 및 `videoUrl?: string` 필드 추가
   - `SlideBody`에 재생 버튼(▶) 오버레이 렌더링 (video 타입일 때)

2. **모달 컴포넌트** (`src/components/VideoModal.tsx` 신규)
   - YouTube `<iframe>` embed 또는 `<video>` 태그
   - 배경 클릭·ESC 키로 닫기, 닫을 때 영상 자동 정지

3. **state 연결**
   - 캐러셀 컨테이너의 `overflow-hidden` 클리핑을 피하기 위해 모달 state를 `LandingClient` 레벨로 올리거나 `createPortal`로 `<body>`에 렌더링
   - `HomeCarousel`에서 `onVideoClick(videoUrl)` 콜백을 props로 받아 호출

4. **데이터** (`public/banners/carousel.json`)
   - `type: "video"`, `videoUrl: "https://www.youtube.com/embed/..."` 형태로 슬라이드 등록

### 영향 파일
- `src/components/HomeCarousel.tsx` — 타입 확장, 콜백 props 추가
- `src/components/LandingClient.tsx` — 모달 state 관리
- `src/components/VideoModal.tsx` — 신규
- `public/banners/carousel.json` — 슬라이드 데이터 추가

---

## [2026.06.01] - 랜딩페이지 바로가기·홍보 캐러셀 개편

### 추가됨
- **카테고리 바로가기 아이콘 4종**: 검색창 아래 체험학습·온라인·학년별 로드맵·이용방법 카드(모바일 2×2 / 데스크톱 1×4). 체험학습→`/visitmap`, 온라인→`/online`, 로드맵→`/roadmap`, 이용방법→이용방법 모달.
  - 코드: `src/components/CategoryNav.tsx`
- **홍보·다운로드 통합 캐러셀**: 자동 슬라이드(4초)·좌우 화살표·인디케이터. 온라인 홍보(`promo`)와 자료 다운로드(`download`) 슬라이드를 한 캐러셀에 혼합. 이미지 배경 + 어두운 그라데이션 오버레이 한 겹, 흰색 글자(text-shadow), 초기 로딩 스켈레톤 적용. `bgImage`가 없으면 그라데이션 배경으로 폴백.
  - 코드: `src/components/HomeCarousel.tsx`
- **JSON 기반 콘텐츠 관리**: 슬라이드 내용은 `public/banners/carousel.json`으로 분리(스키마 안내 `public/banners/README.md`). `featured` 플래그로 노출 제어, `type` 필드(promo|download)로 동작 구분.
- **GA4 다운로드 트래킹**: 다운로드 슬라이드 클릭 시 표준 `file_download` 이벤트 전송(`file_name`, `file_id`, `file_extension`, `link_url`).

### 변경됨
- 기존 단순 PDF 리스트(`DownloadSection`)를 이미지 배경 캐러셀 슬라이드로 대체.

### 제거됨
- `src/components/DownloadSection.tsx`, `public/downloads/pdf-list.json` (캐러셀로 통합되어 미사용). PDF 원본 파일은 유지.

### 관련 파일
- `src/components/LandingClient.tsx` — `CategoryNav`·`HomeCarousel` 삽입, `DownloadSection` 제거
- `src/components/CategoryNav.tsx`, `src/components/HomeCarousel.tsx` — 신규
- `public/banners/carousel.json`, `public/banners/README.md` — 신규

---

## [2026.05.19] - Vercel Analytics · Speed Insights 연동

### 추가됨
- **@vercel/analytics**: Vercel Analytics 패키지 설치 및 `layout.tsx`에 `<Analytics />` 컴포넌트 추가
- **@vercel/speed-insights**: Vercel Speed Insights 패키지 설치 및 `layout.tsx`에 `<SpeedInsights />` 컴포넌트 추가
- Vercel 배포 환경에서 페이지뷰·이벤트 분석 및 Core Web Vitals 측정 자동 활성화

### 관련 파일
- `src/app/layout.tsx` — Analytics, SpeedInsights 컴포넌트 삽입

---

## [2026.05.19] - 탐색 및 연계 기능 강화

### 추가됨
- **지도 자동 이동 (내 근처)**: "내 근처" 필터 활성화 시 `MapComponent.fitToPoints()`로 내 위치 + 가장 가까운 5개 장소가 화면에 맞게 자동 줌/이동
- **지도 자동 이동 (지역 필터)**: 중구·동구 등 지역 필터 선택 시 해당 지역 마커 전체를 `fitToPoints()`로 자동 이동
- **전체 필터 시 초기 뷰 복귀**: "전체" 버튼 클릭 시 `MapComponent.resetView()`로 초기 중심점(35.8714, 128.6014)·레벨 8로 복귀
- **로드맵 연계 버튼 학년별 분리**: 체험학습·온라인 탭 상세 카드에서 학년별 로드맵 버튼이 개별 학년 단위로 표시, `/roadmap?id=X&grade=N`으로 직접 이동
- **로드맵 카드 학년 전환 버튼**: 복수 학년이 연결된 자원의 로드맵 상세 카드 상단에 학년 전환 버튼 표시 (중복 학년 자동 제거)
- **로드맵 전체 필터 자동 학년 선택**: 학년 미선택 상태에서 사이드바 아이템 클릭 시 자원의 첫 번째 학년 자동 선택
- **온라인 → 로드맵 연계**: 온라인 탭 상세 카드에도 `grade_topics` 보유 자원에 학년별 로드맵 이동 버튼 추가

### 변경됨
- **MapComponent 구조 정리**: `fitToPoints` + `resetView` 두 메서드만 노출하는 `MapHandle` ref 패턴. `updateMarkers()` 완료 후 pending fit 자동 실행으로 타이밍 문제 해결
- **사이드바 내 근처 표시**: nearbyMode 시 사이드바는 가까운 순 10개, 지도는 전체 마커 유지

### 수정됨
- **중복 학년 키 오류**: `grade_topics`에 동일 학년이 중복된 경우 `globalThis.Map`으로 중복 제거하여 React key 충돌 해소

### 관련 파일
- `src/components/MapComponent.tsx` — `MapHandle`, `fitToPoints`, `resetView`, `doFit`, `pendingFitRef`
- `src/components/EduMapsClient.tsx` — nearbyMode/지역 필터 fitToPoints, 로드맵 연계 버튼, 학년 전환 UI

---

## [2026.05.08] - UI 개선 및 기능 확장

### 추가됨
- **온라인 탭 패들렛 레이아웃**: 데스크탑 환경에서 카테고리별 세로 열 형식 지원
  - 5개 카테고리(언어, 수리, 디지털, 문화, 더 알아보기)가 나란히 배열됨
  - 모바일은 기존 사이드바 방식 유지
  - 코드: `EduMapsClient.tsx` 라인 163-427

### 변경됨
- **패들렛 컬럼 위치 조정**: 상단 네비게이션과의 간섭 감소
  - 변경 전: `top-[68px]`
  - 변경 후: `top-[100px]`
  - 코드: `EduMapsClient.tsx` 라인 283

- **태그 표시 개선**: 모든 태그 표시
  - 변경 전: 첫 번째 태그만 표시 (`slice(0, 1)`)
  - 변경 후: 모든 태그 표시
  - 코드: `EduMapsClient.tsx` 라인 315-327

- **학년 표시 통합**: "모든 학년" 표시
  - 1~6학년이 모두 포함된 자원은 "모든 학년"으로 표시
  - OFFLINE 탭과 ONLINE 탭에서 동일 로직 적용
  - 코드: `EduMapsClient.tsx` 라인 432-456

- **랜딩페이지 기본 표시**: 학년 미선택 시 모든 학년 자료 표시
  - 변경 전: 학년을 선택하지 않으면 "학년을 선택해주세요" 메시지 표시
  - 변경 후: 학년 미선택 시에도 모든 학년의 월별 추천 자료 표시
  - 코드: `LandingClient.tsx` 라인 132-144

## 기술 상세

### 온라인 탭 패들렛 레이아웃 구현 상세

#### 반응형 설계
```javascript
// 모바일: 기존 사이드바 방식 (sm 브레이크포인트 미만)
<div className="sm:hidden">/* 사이드바 코드 */</div>

// 데스크탑: 패들렛 그리드 (sm 이상)
<div className="hidden sm:flex w-full h-full px-4 py-4 gap-4 overflow-x-auto">
  {/* 5개 카테고리 열 */}
</div>
```

#### 카테고리 열 구조
- 각 열: `flex-1 min-w-[240px]` (균등 너비, 최소 240px)
- 카테고리 제목: `sticky top-0` (스크롤 시 상단 고정)
- 아이템 컨테이너: `flex-1 flex flex-col gap-3 overflow-y-auto` (세로 스크롤)

#### 아이템 카드 스타일
```javascript
className="rounded-xl bg-white border border-slate-100 overflow-hidden cursor-pointer
           hover:shadow-md hover:scale-105 transition-all"
```
- Padding: 이미지 + 제목만 표시
- Hover 효과: 그림자 강화 + 1.05배 확대

### 학년 표시 통합 로직

```javascript
// 6개 학년이 모두 포함되는지 확인
const grades = resource.recommended_grade || [];
const allGradesIncluded = grades.length === 6 && 
  ["1", "2", "3", "4", "5", "6"].every(g => grades.includes(g));

// 표시: "모든 학년" 또는 "1, 2, 3, 4, 5, 6"
const gradeText = allGradesIncluded ? "모든 학년" : grades.join(", ");
```

### 랜딩페이지 기본값 개선

```javascript
// 학년 미선택 시 로직
if (selectedGrade === null) {
  return initialData.filter((item) => {
    const topics = item.grade_topics || [];
    return topics.some((gt: any) => gt.month === monthLabel);
  });
}

// 학년 선택 시 기존 로직
return initialData.filter((item) => {
  const topics = item.grade_topics || [];
  return topics.some((gt: any) => {
    return gt.grade === parseInt(selectedGrade) && gt.month === monthLabel;
  });
});
```

## 성능 최적화

- **ISR 유지**: Next.js ISR로 1시간마다 자동 데이터 갱신 (변경 없음)
- **메모이제이션**: `useMemo`로 불필요한 리렌더링 방지
- **모달 위치**: CSS만으로 위치 조정 (DOM 조작 없음)

## 테스트 항목

### 데스크탑 환경 (sm 이상, ~640px)
- [ ] 온라인 탭에서 5개 카테고리 열 표시 확인
- [ ] 각 열에 해당 카테고리의 자원만 표시되는지 확인
- [ ] 자원 클릭 시 중앙 모달 표시 확인
- [ ] 모든 학년 자원은 "모든 학년"으로 표시되는지 확인

### 모바일 환경 (sm 미만)
- [ ] 온라인 탭에서 기존 사이드바 방식 유지 확인
- [ ] 카테고리 필터링 동작 확인
- [ ] 학년 표시 통합 기능 동작 확인

### 랜딩페이지
- [ ] 학년 미선택 시 모든 학년의 자료 표시 확인
- [ ] 학년 선택 시 해당 학년의 자료로 필터링 확인
- [ ] 월별 추천 자료 필터링 확인

## 관련 파일

- `src/components/EduMapsClient.tsx` - 온라인 탭 및 패들렛 레이아웃
- `src/components/LandingClient.tsx` - 랜딩페이지 기본값 개선
- `src/components/HowToModal.tsx` - 최근 업데이트 내용 표시
