"use client";

import Link from "next/link";
import { MapPin, MonitorPlay, GraduationCap, Info } from "lucide-react";

interface Props {
  onHowTo: () => void;
}

const tile =
  "group flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-slate-800 dark:bg-slate-900";

const LINKS = [
  { href: "/visitmap", label: "체험학습", Icon: MapPin, accent: "text-emerald-600 dark:text-emerald-400" },
  { href: "/online", label: "온라인", Icon: MonitorPlay, accent: "text-sky-600 dark:text-sky-400" },
  { href: "/roadmap", label: "학년별 로드맵", Icon: GraduationCap, accent: "text-violet-600 dark:text-violet-400" },
];

export default function CategoryNav({ onHowTo }: Props) {
  return (
    <nav aria-label="바로가기" className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
      {LINKS.map(({ href, label, Icon, accent }) => (
        <Link key={href} href={href} className={tile}>
          <Icon className={`h-7 w-7 ${accent} transition-transform group-hover:scale-110`} strokeWidth={1.75} aria-hidden />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
        </Link>
      ))}
      <button type="button" onClick={onHowTo} className={tile}>
        <Info className="h-7 w-7 text-amber-600 transition-transform group-hover:scale-110 dark:text-amber-400" strokeWidth={1.75} aria-hidden />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">이용방법</span>
      </button>
    </nav>
  );
}
