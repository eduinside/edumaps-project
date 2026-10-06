-- 사이트 '최근 업데이트 내용'에 이번 개선 소식 추가 (원격 D1 이관 후 적용)
-- 적용: npm run data:apply -- data/patches/20261007-변경이력-화면개선.sql → npm run data:publish -- --commit --push
INSERT INTO edumaps_changelog (date, text) VALUES
  ('2026.10.07', '화면 디자인과 휴대폰 지도 화면을 새롭게 개선하고, 이용방법에서 바로 의견을 보낼 수 있게 하였습니다.');
