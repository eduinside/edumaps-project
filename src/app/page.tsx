import { Suspense } from "react";
import LandingClient from "../components/LandingClient";
import { fetchResources } from "../lib/fetchResources";

export default async function RootPage() {
  const { items, generatedAt, changelog } = await fetchResources();
  const updatedTime =
    generatedAt ?? new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-slate-900"><div className="animate-pulse w-8 h-8 rounded-full bg-emerald-500 opacity-70" /></div>}>
      <LandingClient initialData={items} updatedTime={updatedTime} changelog={changelog} />
    </Suspense>
  );
}
