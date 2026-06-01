"use client";

import { useRouter } from "next/navigation";
import { MapPin, MonitorPlay, GraduationCap, Info } from "lucide-react";

interface Props {
  onHowTo: () => void;
}

export default function CategoryNav({ onHowTo }: Props) {
  const router = useRouter();

  const items = [
    {
      key: "visitmap",
      label: "체험학습",
      Icon: MapPin,
      accent: "text-emerald-500",
      hover: "hover:border-emerald-200 dark:hover:border-emerald-700",
      onClick: () => router.push("/visitmap"),
    },
    {
      key: "online",
      label: "온라인",
      Icon: MonitorPlay,
      accent: "text-sky-500",
      hover: "hover:border-sky-200 dark:hover:border-sky-700",
      onClick: () => router.push("/online"),
    },
    {
      key: "roadmap",
      label: "학년별 로드맵",
      Icon: GraduationCap,
      accent: "text-violet-500",
      hover: "hover:border-violet-200 dark:hover:border-violet-700",
      onClick: () => router.push("/roadmap"),
    },
    {
      key: "howto",
      label: "이용방법",
      Icon: Info,
      accent: "text-amber-500",
      hover: "hover:border-amber-200 dark:hover:border-amber-700",
      onClick: onHowTo,
    },
  ];

  return (
    <nav aria-label="바로가기" className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ key, label, Icon, accent, hover, onClick }) => (
        <button
          key={key}
          onClick={onClick}
          className={`group min-h-[88px] flex flex-col items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${hover}`}
        >
          <Icon className={`w-7 h-7 ${accent} group-hover:scale-110 transition-transform`} strokeWidth={1.75} />
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
        </button>
      ))}
    </nav>
  );
}
