"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// useSearchParams는 가장 가까운 Suspense 경계까지를 클라이언트 렌더링으로 돌린다.
// 이 작은 컴포넌트만 Suspense로 감싸 나머지 화면은 정적 HTML에 미리 그려지게 한다.
export default function UrlSync({ onChange }: { onChange: (params: URLSearchParams) => void }) {
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  useEffect(() => {
    onChange(new URLSearchParams(key));
    // onChange는 렌더마다 새로 만들어질 수 있으므로 쿼리 문자열 변화에만 반응한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
