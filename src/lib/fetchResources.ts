import rawData from "../data/resources.json";

export type ResourcesPayload = {
  items: any[];
  // 데이터 발행(GitHub 커밋) 시각. 배열 형태의 구버전 데이터에는 없으므로 null.
  generatedAt: string | null;
};

/**
 * 빌드 시점에 로컬 resources.json을 읽어 정적 페이지로 렌더링한다.
 *
 * 데이터는 GAS '발행' 버튼이 GitHub에 커밋 → Cloudflare Pages 자동 빌드로 갱신된다.
 * 신/구 두 형태를 모두 수용한다:
 *   - 신: { generatedAt, items: [...] }
 *   - 구: [...] (배열, generatedAt 없음 → 빌드 시각으로 폴백)
 */
export async function fetchResources(): Promise<ResourcesPayload> {
  const data = rawData as any;

  if (Array.isArray(data)) {
    return { items: data, generatedAt: null };
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    generatedAt: typeof data?.generatedAt === "string" ? data.generatedAt : null,
  };
}
