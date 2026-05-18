# EduMaps 변경 사항 기록

모든 주목할 만한 변경 사항을 이 파일에 기록합니다.

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
