const EDU_LINK_API = process.env.NEXT_PUBLIC_EDU_LINK_API;

// 리소스 카드 클릭/외부 이동을 edu-link(D1)로 집계한다. 실패해도 사용자 흐름에 영향 없음.
export function trackResourceStat(resourceId: string, kind: "click" | "download") {
  if (!EDU_LINK_API || !resourceId) return;
  fetch(`${EDU_LINK_API}/resource-stats/hit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resource_id: resourceId, kind }),
    keepalive: true,
  }).catch(() => {});
}
