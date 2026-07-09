# edumaps (에듀맵스)

체험학습 장소·학습자원 지도 플랫폼. Next.js 16 정적 export + Leaflet, CF Pages.
데이터: 구글 시트 →(관리자 패널 발행)→ `src/data/resources.json` 커밋 → 자동 빌드.

@AGENTS.md

## 명령
- `npm run dev` / `npm run build` / `npm run lint`
- `npm run convert-webp` — 이미지 최적화

## 핵심 문서
- `docs/frontend/README.md` / `docs/backend/README.md`(시트·GAS) / `docs/CHANGELOG.md`

## 규칙
- 100% 정적 — 런타임 서버·GAS 의존 코드 금지.
- 데이터 수정은 구글 시트에서 — `resources.json` 직접 수정 금지 (발행 시 덮임).
- 대용량 파일(PDF 등)은 R2로 — 리포에 넣지 말 것.
