# EduMaps Backend Guide (Google Apps Script)

EduMaps의 데이터는 구글 스프레드시트에서 관리됩니다.

## 1. 스프레드시트 구성
- **아이템**: 모든 장소와 온라인 자원의 기본 정보 (ID, 제목, 카테고리, 좌표 등)
- **활용**: 학년별 로드맵 상세 데이터 (교과, 월, 주제, 탐구 질문 등)
  - `linked_id` 필드를 통해 '아이템' 시트와 N:N 관계로 연결됩니다.

## 2. 정렬 매커니즘
- 사이드바의 목록은 **'활용' 시트에 입력된 행 순서**를 그대로 따릅니다.
- `code.gs`에서 각 데이터에 `usage_index`를 부여하여 프론트엔드로 전달합니다.

## 3. 스크립트 관리
- 소스 코드: `docs/backend/code.gs`, 관리자 패널: `docs/backend/index.html`
- **업데이트 방법**: 구글 시트의 Apps Script 에디터에 해당 코드를 붙여넣은 후, 반드시 **[새 배포]**를 통해 URL을 갱신해야 합니다.

## 4. 사이트에 발행 (GitHub → Cloudflare Pages)

스프레드시트는 **편집용 DB**이고, 실제 사이트는 GitHub에 커밋된 정적 JSON(`src/data/resources.json`)을 빌드해 서빙합니다. 데이터를 수정한 뒤 사이트에 반영하려면 **발행**해야 합니다.

### 발행 방법
- 관리자 패널(`?mode=admin`) 좌측 하단 **[사이트에 발행]** 버튼, 또는 **설정 탭 → 사이트에 발행** 섹션의 **[지금 발행]** 버튼을 누릅니다.
- 동작: 현재 시트 데이터 → `resources.json`으로 GitHub 커밋 → Cloudflare Pages가 자동 빌드·배포 (약 1~3분).
- 발행 시각이 사이트 [이용방법] 모달의 **'데이터 최종 갱신'**에 표시됩니다.

### 최초 설정 (스크립트 속성)
Apps Script 편집기 → **프로젝트 설정 → 스크립트 속성**에 등록:

| 키 | 필수 | 기본값 | 설명 |
|---|---|---|---|
| `GITHUB_TOKEN` | ✅ | — | Fine-grained PAT, 대상 리포 **Contents: Read/Write** 권한만 |
| `GITHUB_OWNER` | | `eduinside` | 리포 소유자 |
| `GITHUB_REPO` | | `edumaps-project` | 리포 이름 |
| `GITHUB_BRANCH` | | `main` | 커밋 대상 브랜치 (검증 중에는 `feat/static-export`) |
| `GITHUB_PATH` | | `src/data/resources.json` | 데이터 파일 경로 |

> ⚠️ `GITHUB_TOKEN`은 스크립트 속성에만 저장하고 코드/시트에 노출하지 마세요. 권한은 대상 리포 Contents R/W로 최소화합니다.
