import type { Resource } from "./resourceTypes";
import { mediaUrl } from "./media";

// 화면 전반에서 쓰는 분류·색·보조 함수 모음. 색은 라이트/다크 모두에서 대비를 확인한 값만 쓴다.

export const REGIONS = ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"];
export const ONLINE_CATEGORIES = ["언어", "수리", "디지털", "외국어", "문화", "더 알아보기"];
export const GRADES = [1, 2, 3, 4, 5, 6];
export const FALLBACK_IMAGE = mediaUrl("res_000.webp");
export const LOGIN_TAG = "로그인필요";

// 온라인 분야 색: 칩 배경(soft)·글자(text)·진한 색(solid). Tailwind 클래스로 두어 다크 대응을 함께 정의한다.
type Tone = { soft: string; text: string; solid: string; dot: string };
const ONLINE_TONES: Record<string, Tone> = {
  "언어": { soft: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", solid: "bg-rose-600 text-white", dot: "bg-rose-500" },
  "수리": { soft: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", solid: "bg-orange-600 text-white", dot: "bg-orange-500" },
  "디지털": { soft: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", solid: "bg-teal-600 text-white", dot: "bg-teal-500" },
  "외국어": { soft: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", solid: "bg-blue-600 text-white", dot: "bg-blue-500" },
  "문화": { soft: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", solid: "bg-indigo-600 text-white", dot: "bg-indigo-500" },
  "더 알아보기": { soft: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", solid: "bg-purple-600 text-white", dot: "bg-purple-500" },
};
const NEUTRAL_TONE: Tone = { soft: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", solid: "bg-slate-700 text-white", dot: "bg-slate-400" };

export const categoryTone = (category?: string | null): Tone =>
  (category && ONLINE_TONES[category]) || NEUTRAL_TONE;

// 현장체험 지도 마커 색: 대표 주제 하나를 골라 표시한다(우선순위 순).
export const PLACE_THEMES = [
  { tag: "역사", label: "역사", color: "#d97706" },
  { tag: "생태", label: "생태·자연", color: "#16a34a" },
  { tag: "문화예술", label: "문화예술", color: "#7c3aed" },
  { tag: "놀이", label: "놀이", color: "#db2777" },
] as const;
export const DEFAULT_PLACE_COLOR = "#0284c7";

export function placeTheme(resource: Resource) {
  const tags = resource.tags || [];
  return PLACE_THEMES.find((t) => tags.includes(t.tag)) ?? { tag: "", label: "체험", color: DEFAULT_PLACE_COLOR };
}

export const hasCoords = (r: Resource) => !!(r.location?.lat && r.location?.lng);
export const requiresLogin = (r: Resource) => (r.tags || []).includes(LOGIN_TAG);
export const visibleTags = (r: Resource) => (r.tags || []).filter((t) => t !== LOGIN_TAG);

export function gradesOf(r: Resource): number[] {
  return (r.recommended_grade || []).map((g) => Number(g)).filter((g) => g >= 1 && g <= 6).sort((a, b) => a - b);
}

export function gradeLabel(r: Resource): string {
  const grades = gradesOf(r);
  if (grades.length === 6) return "모든 학년";
  if (grades.length === 0) return "";
  // 연속 구간은 "3~6학년"처럼 줄인다
  const continuous = grades.every((g, i) => i === 0 || g === grades[i - 1] + 1);
  return continuous && grades.length > 2 ? `${grades[0]}~${grades[grades.length - 1]}학년` : `${grades.join("·")}학년`;
}

export function topicGrades(r: Resource): number[] {
  return Array.from(new Set((r.grade_topics || []).map((gt) => gt.grade))).sort((a, b) => a - b);
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export type TabKey = "visitmap" | "online" | "roadmap";
export const TABS: { key: TabKey; label: string; short: string; description: string }[] = [
  { key: "visitmap", label: "체험학습", short: "체험학습", description: "대구 지역의 오프라인 현장체험 장소를 지도로 확인하세요" },
  { key: "online", label: "온라인", short: "온라인", description: "에듀테크 자원과 유용한 온라인 학습 사이트 모음" },
  { key: "roadmap", label: "학년별 로드맵", short: "로드맵", description: "교과 단원과 연계된 학년별 맞춤 학습 코스" },
];

export const resourcePath = (r: Resource) => (r.type === "OFFLINE" ? `/visitmap?id=${r.id}` : `/online?id=${r.id}`);
