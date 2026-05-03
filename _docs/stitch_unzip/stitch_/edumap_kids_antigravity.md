# Antigravity 개발 계획 가이드: EduMap Kids

본 문서는 설계된 UI를 바탕으로 Antigravity에서 실제 개발로 전환하기 위한 기술 스펙과 데이터 매핑 가이드를 제공합니다.

## 1. 프로젝트 스택 및 아키텍처
- **Framework**: Next.js (App Router 권장)
- **Deployment**: Cloudflare Pages
- **Styling**: Tailwind CSS (Stitch 생성 코드와 호환)
- **Maps**: Naver Maps JavaScript API v3
- **Data Management**: 로컬 JSON 파일을 이용한 정적 데이터 관리

## 2. 데이터 구조 (JSON)
- **파일명**: `src/data/resources.json`
- **구조**:
  ```json
  [
    {
      "id": "item_01",
      "type": "OFFLINE",
      "grade": 1,
      "title": "대구시민안전테마파크",
      "subject": "사람들",
      "month": "4월",
      "topic": "불이 났을 때는",
      "description": "화재 등 재난상황에 슬기롭게 대처하는 방법을 알아봅시다.",
      "questions": ["불이 났을 때 어떻게 해야 할까요?"],
      "post_activities": ["집과 학교에서 불이 났을 때 해야 하는 일을 떠올려 봅시다.", "소방관이 하는 일을 알아봅시다."],
      "tags": ["#화재", "#재난", "#안전"],
      "lat": 35.986,
      "lng": 128.699,
      "image_url": "/assets/images/safety_park.png"
    }
  ]
  ```

## 3. 핵심 인터랙션 및 컴포넌트 설계
### A. 전체 화면 지도 (Main Map)
- **구현**: `MapContainer` 컴포넌트 내에 Naver Map 초기화.
- **마커 로직**: JSON의 `lat`, `lng`를 기반으로 마커 렌더링.
- **오버레이**: 마커 클릭 시 상단/하단 시트(Bottom Sheet)에 상세 정보 표시.

### B. 필터 바 (Filter Bar)
- **학년 필터**: `1학년` ~ `6학년` 버튼 클릭 시 JSON 데이터의 `grade` 필드로 필터링.
- **카테고리 필터**: `온라인/오프라인` 구분 필터링.

### C. 콘텐츠 카드 (Resource Card)
- **자동화**: 별도의 이미지 없이도 JSON의 `questions`, `post_activities` 데이터를 텍스트로 렌더링하도록 설계됨.
- **이미지 영역**: `image_url`이 있을 경우 표시, 없을 경우 기본 아이콘/배경색 처리.

## 4. Antigravity 개발 시 참고사항
- **컴포넌트 복사**: Stitch에서 생성된 HTML/Tailwind 코드를 Antigravity의 리액트 컴포넌트 구조로 복사하여 사용하세요.
- **CSS 변수**: Design System(`{{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}`)에 정의된 컬러 토큰을 Tailwind config에 등록하여 일관성을 유지하세요.
- **이미지 에셋**: 사용자가 제작할 PNG 파일은 `public/assets/images/` 경로에 저장하고 JSON 내 경로를 업데이트하세요.
