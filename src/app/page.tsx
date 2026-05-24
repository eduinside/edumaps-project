import { Suspense } from "react";
import LandingClient from "../components/LandingClient";
import { fetchResources } from "../lib/fetchResources";

export const revalidate = 3600;

export default async function RootPage() {
  const resources = await fetchResources();
  const updatedTime = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-slate-900"><div className="animate-pulse text-emerald-500 font-bold">EduMaps 로딩 중...</div></div>}>
      <LandingClient initialData={resources} updatedTime={updatedTime} />
    </Suspense>
  );
}
