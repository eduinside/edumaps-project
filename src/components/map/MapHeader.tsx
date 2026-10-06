"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Info, MapPin, MonitorPlay, Search, X } from "lucide-react";
import type { Resource } from "../../lib/resourceTypes";
import { FALLBACK_IMAGE, TABS, type TabKey } from "../../lib/catalog";
import { mediaUrl } from "../../lib/media";
import { matchesQuery } from "../../lib/search";

const TAB_ICONS: Record<TabKey, typeof MapPin> = { visitmap: MapPin, online: MonitorPlay, roadmap: BookOpen };

interface Props {
  tab: TabKey;
  resources: Resource[];
  onTabChange: (tab: TabKey) => void;
  onPickResult: (resource: Resource) => void;
  onHowTo: () => void;
}

// 지도·목록 화면 머리: 로고, 탭(데스크톱 가운데 / 모바일 둘째 줄), 전체 검색, 이용방법.
export default function MapHeader({ tab, resources, onTabChange, onPickResult, onHowTo }: Props) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => (query.trim() ? resources.filter((r) => matchesQuery(r, query)).slice(0, 8) : []), [query, resources]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    closeSearch();
    router.push(`/?q=${encodeURIComponent(q)}`);
  };

  const tabButton = (key: TabKey, mobile: boolean) => {
    const info = TABS.find((t) => t.key === key)!;
    const Icon = TAB_ICONS[key];
    const active = tab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onTabChange(key)}
        aria-current={active ? "page" : undefined}
        title={mobile ? undefined : info.description}
        className={
          mobile
            ? `flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition-colors ${active ? "bg-white text-brand shadow-sm dark:bg-slate-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`
            : `flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors ${active ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`
        }
      >
        <Icon className="h-4 w-4" aria-hidden />
        {mobile ? info.short : info.label}
      </button>
    );
  };

  return (
    <header className="absolute inset-x-3 top-3 z-30 rounded-2xl border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/95 sm:inset-x-4 sm:top-4">
      <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-brand" aria-label="에듀맵스 홈으로">
          <span className="relative h-9 w-9">
            <Image src={mediaUrl("daegu_logo.webp")} alt="" fill sizes="36px" className="rounded-full object-contain" />
          </span>
          <span className={`text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50 ${searchOpen ? "hidden sm:inline" : ""}`}>
            <span className="hidden sm:inline">대구 </span>에듀맵스
          </span>
        </Link>

        <nav aria-label="콘텐츠" className="mx-auto hidden gap-1 md:flex">
          {TABS.map((t) => tabButton(t.key, false))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          {searchOpen ? (
            <form onSubmit={submit} role="search" className="relative flex items-center gap-1">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                placeholder="전체 자원 검색"
                aria-label="전체 자원 검색"
                className="h-10 w-40 rounded-full border border-slate-200 bg-white px-4 text-[15px] text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-emerald-900 sm:w-56"
              />
              <button type="submit" aria-label="검색" className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white hover:bg-brand-hover">
                <Search className="h-4 w-4" />
              </button>
              <button type="button" onClick={closeSearch} aria-label="검색 닫기" className="grid h-10 w-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
              {results.length > 0 && (
                <ul className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 dark:border-slate-700 dark:bg-slate-900">
                  {results.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          closeSearch();
                          onPickResult(item);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-none dark:hover:bg-emerald-950/40 dark:focus-visible:bg-emerald-950/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url || FALLBACK_IMAGE} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 object-cover dark:bg-slate-800" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.category}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${item.type === "OFFLINE" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"}`}>
                          {item.type === "OFFLINE" ? "체험" : "온라인"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="검색 열기"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onHowTo}
            aria-label="이용방법"
            className="flex h-10 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 sm:px-4"
          >
            <Info className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">이용방법</span>
          </button>
        </div>
      </div>

      {/* 모바일·태블릿: 탭을 둘째 줄에 둔다 */}
      <nav aria-label="콘텐츠" className="flex gap-1 border-t border-slate-100 p-1.5 dark:border-slate-800 md:hidden">
        <div className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">{TABS.map((t) => tabButton(t.key, true))}</div>
      </nav>
    </header>
  );
}
