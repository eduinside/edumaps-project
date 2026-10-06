import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EduMapsClient from "../../components/EduMapsClient";
import { fetchResources } from "../../lib/fetchResources";
import { TABS, type TabKey } from "../../lib/catalog";

const ALLOWED_TABS = TABS.map((t) => t.key);

export async function generateMetadata({ params }: { params: Promise<{ tab: string }> }): Promise<Metadata> {
  const { tab } = await params;
  const info = TABS.find((t) => t.key === tab);
  if (!info) return {};
  const title = `${info.label} - 대구 에듀맵스`;
  return {
    title,
    description: info.description,
    // openGraph는 레이아웃 값과 병합되지 않고 통째로 바뀌므로 이미지까지 다시 적는다
    openGraph: { title, description: info.description, url: `/${info.key}`, siteName: "대구 에듀맵스", locale: "ko_KR", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "대구 에듀맵스" }] },
  };
}

export default async function TabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;

  if (!ALLOWED_TABS.includes(tab as TabKey)) {
    notFound();
  }

  const { items, generatedAt, changelog } = await fetchResources();
  const updatedTime =
    generatedAt ?? new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return <EduMapsClient tab={tab as TabKey} initialData={items} updatedTime={updatedTime} changelog={changelog} />;
}

export function generateStaticParams() {
  return ALLOWED_TABS.map((tab) => ({ tab }));
}
