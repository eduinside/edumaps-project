import EduMapsClient from "../../components/EduMapsClient";
import { fetchResources } from "../../lib/fetchResources";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const ALLOWED_TABS = ["visitmap", "online", "roadmap"];

export default async function TabPage({ params }: { params: Promise<{ tab: string }> }) {
  const resolvedParams = await params;
  const tab = resolvedParams.tab;

  if (!ALLOWED_TABS.includes(tab)) {
    notFound();
  }

  const { items, generatedAt } = await fetchResources();
  const updatedTime =
    generatedAt ?? new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EduMapsClient initialData={items} updatedTime={updatedTime} />
    </Suspense>
  );
}

export function generateStaticParams() {
  return ALLOWED_TABS.map((tab) => ({
    tab: tab,
  }));
}
