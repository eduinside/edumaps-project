"use client";

import { Lock, LocateFixed } from "lucide-react";
import type { Resource } from "../../lib/resourceTypes";
import { categoryTone, placeTheme, requiresLogin, visibleTags } from "../../lib/catalog";
import ResourceThumb from "./ResourceThumb";

interface Props {
  resource: Resource;
  active: boolean;
  onSelect: (resource: Resource) => void;
  distance?: number | null;
  // 로드맵 탭: 선택 학년의 단원명을 부제로 보여 준다
  topicTitle?: string | null;
}

// 목록 한 줄. 버튼이라 키보드(Tab·Enter)로 고를 수 있다.
export default function ResourceListItem({ resource, active, onSelect, distance, topicTitle }: Props) {
  const isOffline = resource.type === "OFFLINE";
  const tone = categoryTone(resource.category);
  const theme = isOffline ? placeTheme(resource) : null;
  return (
    <button
      type="button"
      onClick={() => onSelect(resource)}
      aria-current={active ? "true" : undefined}
      className={`group flex w-full gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        active
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
          : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70"
      }`}
    >
      <ResourceThumb resource={resource} className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" />
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-[15px] font-bold text-slate-900 group-hover:text-brand dark:text-slate-100 dark:group-hover:text-emerald-400">
          {resource.title}
        </h3>
        {topicTitle ? (
          <p className="mt-0.5 line-clamp-1 text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">{topicTitle}</p>
        ) : (
          <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-600 dark:text-slate-400">{resource.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${isOffline ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : `${tone.soft} ${tone.text}`}`}>
            {theme && <span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.color }} aria-hidden />}
            {resource.category}
          </span>
          {requiresLogin(resource) && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <Lock className="h-3 w-3" aria-hidden />
              로그인 필요
            </span>
          )}
          {visibleTags(resource).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-md px-1 py-0.5 text-xs text-slate-500 dark:text-slate-400">
              #{tag}
            </span>
          ))}
          {distance != null && (
            <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              <LocateFixed className="h-3 w-3" aria-hidden />
              {distance.toFixed(1)}km
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
