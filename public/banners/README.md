# 홈 캐러셀 콘텐츠 (carousel.json)

랜딩페이지 검색창 아래 캐러셀에 노출되는 슬라이드를 관리합니다.
**코드 수정 없이 이 JSON과 이미지 업로드만으로 교체**할 수 있습니다.

## 스키마

```jsonc
{
  "slides": [
    {
      "id": "고유-id",            // 필수, GA 트래킹 식별자로도 사용
      "type": "promo",           // "promo"(온라인 홍보) 또는 "download"(자료 다운로드)
      "title": "제목",            // 필수, 흰색 큰 글씨
      "subtitle": "소개 문구",     // 선택, 제목 아래 작은 글씨
      "bgImage": "/images/x.webp", // 배경 이미지 URL. 비우면 그라데이션 배경 사용

      // type === "promo" 일 때
      "linkUrl": "/online",       // 내부 경로(/online 등) 또는 https:// 외부 링크
      "linkLabel": "바로가기",     // 버튼 문구(생략 시 "바로가기")

      // type === "download" 일 때
      "fileUrl": "/downloads/파일.pdf", // 다운로드할 파일 경로

      "featured": true            // false 이면 캐러셀에서 숨김
    }
  ]
}
```

## 이미지 가이드
- 비율 16:9 권장, WebP, 폭 800~1200px
- 어두운 그라데이션 오버레이가 자동으로 한 겹 덮이므로 밝은 사진도 글자가 잘 보입니다.
- `bgImage`를 비워두면 단색 그라데이션 배경이 적용됩니다.

## 동작
- 3~5초 자동 슬라이드, 좌우 화살표, 하단 인디케이터
- `download` 슬라이드 클릭 시 GA4 `file_download` 이벤트가 전송됩니다
  (`file_name`, `file_id`, `file_extension`, `link_url`).
