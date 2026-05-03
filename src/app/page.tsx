"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 클라이언트 측에서 안전하게 기본 탭으로 이동
    router.replace("/visitmap");
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="animate-pulse text-emerald-500 font-bold">EduMaps 로딩 중...</div>
    </div>
  );
}
