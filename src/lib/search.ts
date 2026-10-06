import type { Resource } from "./resourceTypes";

// 검색: 제목·설명·분류·태그에 더해 로드맵 단원명·교과까지 본다. 'ㅂㅁㄱ'처럼 초성만 입력해도 찾는다.

const CHOSUNG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const CHOSUNG_ONLY = /^[ㄱ-ㅎ\s]+$/;

function toChosung(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0) - 0xac00;
    out += code >= 0 && code < 11172 ? CHOSUNG[Math.floor(code / 588)] : ch;
  }
  return out;
}

const haystacks = new WeakMap<Resource, { text: string; chosung: string }>();

function haystackOf(r: Resource) {
  let h = haystacks.get(r);
  if (!h) {
    const text = [
      r.title,
      r.description,
      r.category,
      ...(r.tags || []),
      ...(r.grade_topics || []).flatMap((gt) => [gt.topic_title, gt.subject]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    h = { text, chosung: toChosung(text).replace(/\s+/g, "") };
    haystacks.set(r, h);
  }
  return h;
}

export function matchesQuery(r: Resource, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const h = haystackOf(r);
  if (h.text.includes(q)) return true;
  // 띄어쓰기 차이("국립 대구박물관")도 찾도록 공백을 뺀 비교를 한 번 더 한다
  const compact = q.replace(/\s+/g, "");
  if (h.text.replace(/\s+/g, "").includes(compact)) return true;
  return CHOSUNG_ONLY.test(q) && compact.length >= 2 && h.chosung.includes(compact);
}
