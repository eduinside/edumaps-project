"use client";

import { Check } from "lucide-react";

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  // 선택 시 배경. 기본은 브랜드 초록.
  selectedClass?: string;
  // 미선택 시 배경·글자. 기본은 중립 회색.
  idleClass?: string;
  size?: "sm" | "md";
  className?: string;
}

// 필터용 토글 칩. 선택 상태를 색만이 아니라 체크 표시와 aria-pressed로도 알린다.
export default function Chip({ selected = false, onClick, children, selectedClass, idleClass, size = "md", className = "" }: ChipProps) {
  const sizing = size === "sm" ? "h-8 px-3 text-[13px]" : "h-9 px-3.5 text-sm";
  const tone = selected
    ? selectedClass ?? "bg-brand text-white"
    : idleClass ?? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${sizing} ${tone} ${className}`}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}
