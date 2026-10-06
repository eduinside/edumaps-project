# edumaps (에듀맵스)

체험학습 장소·학습자원 지도 플랫폼. Next.js 16 정적 export + 카카오맵, CF Pages (`map.dgedu.link`).
데이터: D1 `edu-link-db`의 `edumaps_*` 테이블(정본) →(`npm run data:publish`)→ `src/data/resources.json` 커밋 → 자동 빌드.

@AGENTS.md

## 명령
- `npm run dev` / `npm run build` / `npm run lint`
- `npm run data:publish [-- --dry-run | --commit --push]` — D1 → resources.json 발행
- `npm run data:apply -- <patch.sql>` — 데이터 패치 적용 / `npm run data:check-links` — 링크 점검
- `npm run media:put -- <이미지> --name <id>` — WebP 변환 후 R2 업로드
- `npm run convert-webp` — 이미지 최적화

## 핵심 문서
- `docs/data/README.md`(D1 데이터 운영) / `docs/frontend/README.md` / `docs/backend/README.md`(의견 보내기 함수·이전 GAS 안내) / `docs/CHANGELOG.md`
- 개선 계획·점검: `docs/plan-ux-audit-2026-10.md`

## 규칙
- 100% 정적 — 런타임 서버 의존 코드 금지. 예외는 의견 보내기 Pages Function(`functions/api/feedback.js`, Resend) 하나.
- 데이터 수정은 D1에서(패치 SQL·대시보드 콘솔) — `resources.json` 직접 수정 금지 (발행 시 덮임).
- D1은 edu-link·edu-kit과 공유 — `edumaps_` 접두어 테이블만 다룰 것. wrangler 설정은 `db/wrangler.jsonc`(루트에 두지 말 것).
- 이미지 교체는 새 파일명으로(`media/*`는 1년 immutable 캐시).
- 대용량 파일(PDF 등)은 R2로 — 리포에 넣지 말 것.
- Windows에서 `npm run build` 후 `out/`을 직접 미리볼 때는 Next 16 버그로 prefetch 파일이 `__next.$d$tab/__PAGE__.txt`처럼 폴더로 생김(CF Pages의 Linux 빌드는 정상). 로컬 미리보기는 `wrangler pages dev out --port 3000`(카카오 키가 localhost:3000만 허용).
