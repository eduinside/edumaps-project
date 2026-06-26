import { Suspense } from "react";
import LandingClient from "../components/LandingClient";
import { fetchResources } from "../lib/fetchResources";

export default async function RootPage() {
  const { items, generatedAt } = await fetchResources();
  const updatedTime =
    generatedAt ?? new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-slate-900"><div className="animate-pulse text-emerald-500 font-bold">대구 에듀맵스 로딩 중...</div></div>}>
      <LandingClient initialData={items} updatedTime={updatedTime} />
    </Suspense>
  );
}
