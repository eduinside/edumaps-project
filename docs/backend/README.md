# 백엔드(데이터) 안내

2026.10부터 에듀맵스 데이터의 정본은 **Cloudflare D1 `edu-link-db`의 `edumaps_*` 테이블**입니다.
운영 방법은 [데이터 운영 가이드](../data/README.md)를 보세요.

- 사이트는 100% 정적입니다(런타임·빌드 모두 D1을 부르지 않음).
- 예외: 이용방법 > **의견 보내기**만 Cloudflare Pages Function(`functions/api/feedback.js`)이 Resend로 메일을 보냅니다.
  - Pages 프로젝트 설정 → 환경변수: `RESEND_API_KEY`(암호화), `FEEDBACK_TO`(받는 주소), `FEEDBACK_FROM`(Resend에 인증된 `dgedu.link` 주소, 예: `대구 에듀맵스 <edumaps-noreply@dgedu.link>`)
  - 셋 중 하나라도 없으면 폼은 "지금은 의견을 받을 수 없어요"를 안내합니다(503).
- 이전 구글 시트 + GAS 발행 방식의 코드·문서는 [`_legacy-gas/`](./_legacy-gas/README.md)에 보관합니다(참고용, 더 이상 배포하지 않음).
