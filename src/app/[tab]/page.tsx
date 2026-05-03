import EduMapsClient from "../../components/EduMapsClient";
import { notFound } from "next/navigation";

// 1시간마다 데이터 캐시 갱신 (3600초)
export const revalidate = 3600;

// 허용된 탭 목록
const ALLOWED_TABS = ["visitmap", "online", "roadmap"];

export default async function TabPage({ params }: { params: Promise<{ tab: string }> }) {
  const resolvedParams = await params;
  const tab = resolvedParams.tab;

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
      }
    } 
    
    // GAS 호출에 실패했거나 URL이 없는 경우 로컬 데이터 시도
    if (!resources || resources.length === 0) {
      try {
        // Vercel 환경에서는 resources.json이 없을 수 있으므로 예외 처리
        const localResources = await import("../../data/resources.json");
        resources = localResources.default;
      } catch (e) {
        console.warn("No local fallback data found, using empty list.");
        resources = [];
      }
    }
  } catch (error) {
    console.error("Data fetch process failed:", error);
    resources = [];
  }

  const updatedTime = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return <EduMapsClient initialData={resources} updatedTime={updatedTime} />;
}

export async function generateStaticParams() {
  return ALLOWED_TABS.map((tab) => ({
    tab: tab,
  }));
}
