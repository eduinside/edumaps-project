import EduMapsClient from "../../components/EduMapsClient";
import { notFound } from "next/navigation";

// 1시간마다 데이터 캐시 갱신 (3600초)
export const revalidate = 3600;

// 허용된 탭 목록
const ALLOWED_TABS = ["visitmap", "online", "roadmap"];

export default async function TabPage({ params }: { params: Promise<{ tab: string }> }) {
  // Next.js 15+ 규칙: params는 Promise이므로 await가 필요합니다.
  const resolvedParams = await params;
  const tab = resolvedParams.tab;

  // 허용되지 않은 경로는 404 페이지를 보여줍니다.
  if (!ALLOWED_TABS.includes(tab)) {
    notFound();
  }

  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
  let resources = [];

  try {
    if (gasUrl) {
      const res = await fetch(gasUrl, { 
        next: { revalidate: 3600 },
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        resources = await res.json();
      } else {
        throw new Error("Failed to fetch from GAS");
      }
    } else {
      const localResources = await import("../../data/resources.json");
      resources = localResources.default;
    }
  } catch (error) {
    console.error("Data fetch failed, using fallback:", error);
    try {
      const fallback = await import("../../data/resources.json");
      resources = fallback.default;
    } catch (e) {
      resources = [];
    }
  }

  const updatedTime = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return <EduMapsClient initialData={resources} updatedTime={updatedTime} />;
}

export async function generateStaticParams() {
  return ALLOWED_TABS.map((tab) => ({
    tab: tab,
  }));
}
