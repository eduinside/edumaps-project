// resources.json 데이터 형태 (scripts/data/publish.mjs가 D1에서 생성)

export type ResourceType = 'OFFLINE' | 'ONLINE';

/** 장소·자료의 학년별 활용 주제 (기존 '활용' 시트) */
export interface GradeTopic {
  /** 전역 정렬 순서 (D1 edumaps_topics.sort) */
  usage_index: number;
  /** 1~6 */
  grade: number;
  subject: string;
  /** "11월" 형식 */
  month: string;
  topic_title: string;
  description: string;
  inquiry_questions: string[];
  post_activities: string[];
}

export interface Resource {
  /** 'res_131' — resource_stats와 연결되므로 바꾸지 않음 */
  id: string;
  type: ResourceType;
  title: string;
  /** 지역(현장) 또는 분야(온라인) */
  category: string;
  tags: string[];
  /** 학년 문자열 배열, 예: ["1","2"] */
  recommended_grade: string[];
  description: string;
  /** ONLINE은 {lat:0,lng:0} */
  location: { lat: number; lng: number };
  image_url: string;
  external_url: string;
  grade_topics: GradeTopic[];
}

export interface ChangelogEntry {
  /** '2026.10.06' */
  date: string;
  text: string;
}

export interface ResourcesData {
  /** 'YYYY.MM.DD HH:mm' (KST) */
  generatedAt: string;
  items: Resource[];
  changelog: ChangelogEntry[];
}
