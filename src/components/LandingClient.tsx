"use client";

import { Suspense, useState, useMemo, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, MonitorPlay, Sparkles, TrendingUp, Lock } from "lucide-react";
import type { ChangelogEntry, Resource } from "../lib/resourceTypes";
import { GRADES, ONLINE_CATEGORIES, categoryTone, requiresLogin, resourcePath, visibleTags } from "../lib/catalog";
import { matchesQuery } from "../lib/search";
import { mediaUrl } from "../lib/media";
import HowToModal from "./HowToModal";
import CategoryNav from "./CategoryNav";
import HomeCarousel from "./HomeCarousel";
import UrlSync from "./UrlSync";
import Chip from "./ui/Chip";
import ResourceThumb from "./map/ResourceThumb";

interface Props {
  initialData: Resource[];
  updatedTime?: string;
  changelog?: ChangelogEntry[];
  buildMonth: number;
}

const EDU_LINK_API = process.env.NEXT_PUBLIC_EDU_LINK_API;

function LandingCard({ item, href }: { item: Resource; href: string }) {
  const isOffline = item.type === "OFFLINE";
  const tone = categoryTone(item.category);
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative">
        <ResourceThumb resource={item} className="aspect-[16/10] w-full" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow ${isOffline ? "bg-brand" : "bg-sky-600"}`}>
          {isOffline ? <MapPin className="h-3.5 w-3.5" aria-hidden /> : <MonitorPlay className="h-3.5 w-3.5" aria-hidden />}
          {isOffline ? "현장체험" : "온라인"}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-1.5 flex flex-wrap gap-1">
          {item.category && (
            <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${isOffline ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : `${tone.soft} ${tone.text}`}`}>
              {item.category}
            </span>
          )}
          {requiresLogin(item) && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <Lock className="h-3 w-3" aria-hidden /> 로그인 필요
            </span>
          )}
          {visibleTags(item).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-md px-1 py-0.5 text-xs text-slate-500 dark:text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
        <h3 className="line-clamp-1 text-[15px] font-bold text-slate-900 transition-colors group-hover:text-brand dark:text-slate-100 dark:group-hover:text-emerald-400">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
      </div>
    </Link>
  );
}

// edu-link(D1) 클릭 집계를 조회해 실제 resources와 매칭한다. 데이터가 없으면 섹션째 숨긴다.
function PopularSection({ initialData }: { initialData: Resource[] }) {
  const [items, setItems] = useState<Resource[]>([]);

  useEffect(() => {
    if (!EDU_LINK_API) return;
    let active = true;
    fetch(`${EDU_LINK_API}/resource-stats/top?metric=click&limit=8`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.success) return;
        const byId = new Map(initialData.map((r) => [String(r.id), r]));
        const resolved = (data.items || []).map((row: { resource_id: string }) => byId.get(String(row.resource_id))).filter(Boolean) as Resource[];
        setItems(resolved);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialData]);

  if (items.length === 0) return null;

  return (
    <section className="mb-4 mt-16" aria-labelledby="popular-title">
      <div className="mb-5">
        <h2 id="popular-title" className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-slate-50 sm:text-3xl">
          <TrendingUp className="h-6 w-6 text-brand" aria-hidden />
          많이 찾는 자료
        </h2>
        <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-400">다른 학부모님들이 많이 확인한 현장체험·온라인 자료예요.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <LandingCard key={item.id} item={item} href={resourcePath(item)} />
        ))}
      </div>
    </section>
  );
}

const noSubscribe = () => () => {};

const Empty = () => (
  <p className="rounded-2xl bg-slate-100 py-8 text-center text-[15px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">검색 결과가 없습니다.</p>
);

export default function LandingClient({ initialData, updatedTime, changelog, buildMonth }: Props) {
  const [searchQuery, setSearchQueryRaw] = useState("");
  const [selectedOnlineCategory, setSelectedOnlineCategory] = useState<string | null>(null);
  const [selectedOfflineTag, setSelectedOfflineTag] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  // 정적 HTML은 빌드한 달로 그리고, 브라우저에서는 실제 이번 달을 쓴다. 사용자가 고르면 그 달.
  const currentMonth = useSyncExternalStore(noSubscribe, () => new Date().getMonth() + 1, () => buildMonth);
  const [pickedMonth, setSelectedMonth] = useState<number | null>(null);
  const selectedMonth = pickedMonth ?? currentMonth;
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  // 검색어가 바뀌면 결과 필터를 초기화한다
  const setSearchQuery = (q: string) => {
    setSearchQueryRaw(q);
    setSelectedOfflineTag(null);
    setSelectedOnlineCategory(null);
  };

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return { offline: [] as Resource[], online: [] as Resource[], allOffline: [] as Resource[] };
    const allOffline = initialData.filter((i) => i.type === "OFFLINE" && matchesQuery(i, trimmedQuery));
    const allOnline = initialData.filter((i) => i.type === "ONLINE" && matchesQuery(i, trimmedQuery));
    return {
      offline: selectedOfflineTag ? allOffline.filter((i) => i.category === selectedOfflineTag) : allOffline,
      online: selectedOnlineCategory ? allOnline.filter((i) => i.category === selectedOnlineCategory) : allOnline,
      allOffline,
    };
  }, [initialData, trimmedQuery, isSearching, selectedOfflineTag, selectedOnlineCategory]);

  const monthLabel = `${selectedMonth}월`;

  const recommendedItems = useMemo<{ item: Resource; linked: boolean }[]>(() => {
    const MIN = 4;
    const MAX = 8;
    const gradeStr = selectedGrade === null ? null : String(selectedGrade);

    const isLinked = (item: Resource) => {
      const topics = item.grade_topics || [];
      if (gradeStr === null) {
        return topics.some((gt) => gt.month === monthLabel);
      }
      // 활용 주제가 있으면 권장 학년 목록과 무관하게 연계로 본다(권장 학년 누락 데이터 대비)
      return topics.some((gt) => String(gt.grade) === gradeStr && gt.month === monthLabel);
    };

    const linked = initialData.filter(isLinked);
    const used = new Set<string>(linked.map((i) => i.id));
    const result: { item: Resource; linked: boolean }[] = linked.map((item) => ({ item, linked: true }));

    // 월×학년 시드 기반 결정론적 셔플 (같은 조합은 항상 동일 순서)
    const seed = selectedMonth * 7 + (selectedGrade ?? 0) * 13;
    const seededShuffle = <T,>(arr: T[]): T[] => {
      const a = [...arr];
      let s = seed;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const balancePush = (candidates: Resource[]) => {
      if (result.length >= MAX) return;
      const shuffled = seededShuffle(candidates);
      const offline = shuffled.filter((c) => c.type === "OFFLINE" && !used.has(c.id));
      const online = shuffled.filter((c) => c.type === "ONLINE" && !used.has(c.id));
      while (result.length < MAX && (offline.length || online.length)) {
        const offCount = result.filter((r) => r.item.type === "OFFLINE").length;
        const onCount = result.length - offCount;
        const pickOffline = offCount <= onCount ? offline.length > 0 : !online.length;
        const pool = pickOffline && offline.length ? offline : online.length ? online : offline;
        const next = pool.shift();
        if (!next) break;
        used.add(next.id);
        result.push({ item: next, linked: false });
      }
    };

    // 2차: 같은 월에 다른 학년 grade_topic을 가진 자료
    if (result.length < MIN) {
      balancePush(initialData.filter((item) => !used.has(item.id) && (item.grade_topics || []).some((gt) => gt.month === monthLabel)));
    }
    // 3차: recommended_grade에 해당 학년이 포함된 자료(연계 토픽 없음)
    if (result.length < MIN && gradeStr !== null) {
      balancePush(initialData.filter((item) => !used.has(item.id) && (item.recommended_grade || []).map(String).includes(gradeStr)));
    }
    // 4차: 안전망 — 어떤 자료든 type 균형으로 채움
    if (result.length < MIN) {
      balancePush(initialData.filter((item) => !used.has(item.id)));
    }

    return result.slice(0, MAX);
  }, [initialData, selectedGrade, monthLabel, selectedMonth]);

  const hrefFor = (item: Resource, linked: boolean) => {
    if (!linked) return resourcePath(item);
    // 로드맵 연계: 선택한 학년(없으면 이번 달 주제의 학년)으로 바로 연다
    const grade = selectedGrade ?? item.grade_topics.find((gt) => gt.month === monthLabel)?.grade;
    return `/roadmap?id=${item.id}${grade ? `&grade=${grade}` : ""}`;
  };

  const offlineRegions = Array.from(new Set(searchResults.allOffline.map((i) => i.category).filter(Boolean))).sort();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-50 font-sans dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <Suspense fallback={null}>
        <UrlSync
          onChange={(params) => {
            const q = params.get("q");
            if (q) setSearchQuery(q);
          }}
        />
      </Suspense>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-brand" aria-label="에듀맵스 홈">
            <span className="relative h-9 w-9">
              <Image src={mediaUrl("daegu_logo.webp")} alt="" fill sizes="36px" className="rounded-full object-contain" priority />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              <span className="hidden sm:inline">대구 </span>에듀맵스
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* Hero + Search */}
        <section className="pb-8 pt-10 text-center sm:pb-10 sm:pt-16">
          <h1 className="break-keep text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            우리 아이 자기주도학습을 위한
            <br className="hidden sm:block" />
            <span className="text-brand dark:text-emerald-400"> 대구 체험·온라인 학습 길잡이</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] text-slate-600 dark:text-slate-400 sm:text-base">
            현장체험과 온라인 학습 자원을 한 번에 검색하고, 이달의 학년별 추천자원을 만나보세요.
          </p>

          <form role="search" onSubmit={(e) => e.preventDefault()} className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력하세요 (예: 박물관, 수학, 역사)"
                aria-label="자료 검색"
                className="h-14 w-full rounded-full border border-slate-200 bg-white pl-14 pr-5 text-base text-slate-900 shadow-lg shadow-slate-200/60 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:ring-emerald-900 sm:h-16"
              />
            </div>
          </form>
        </section>

        {!isSearching && (
          <>
            <CategoryNav onHowTo={() => setIsHowToOpen(true)} />
            <HomeCarousel />
          </>
        )}

        {/* 검색 결과 */}
        {isSearching && (
          <section className="space-y-10 animate-in fade-in" aria-live="polite">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-slate-50 sm:text-xl">
                <MapPin className="h-5 w-5 text-brand" aria-hidden /> 현장체험
                <span className="text-sm text-brand dark:text-emerald-400">{searchResults.offline.length}</span>
              </h2>
              {offlineRegions.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="지역">
                  <Chip size="sm" selected={selectedOfflineTag === null} onClick={() => setSelectedOfflineTag(null)}>전체</Chip>
                  {offlineRegions.map((region) => (
                    <Chip key={region} size="sm" selected={selectedOfflineTag === region} onClick={() => setSelectedOfflineTag(region === selectedOfflineTag ? null : region)}>
                      {region}
                    </Chip>
                  ))}
                </div>
              )}
              {searchResults.offline.length === 0 ? (
                <Empty />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {searchResults.offline.map((item) => (
                    <LandingCard key={item.id} item={item} href={resourcePath(item)} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-slate-50 sm:text-xl">
                <MonitorPlay className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden /> 온라인 학습
                <span className="text-sm text-sky-600 dark:text-sky-400">{searchResults.online.length}</span>
              </h2>
              <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="분야">
                <Chip size="sm" selected={selectedOnlineCategory === null} onClick={() => setSelectedOnlineCategory(null)}>전체</Chip>
                {ONLINE_CATEGORIES.map((cat) => (
                  <Chip key={cat} size="sm" selected={selectedOnlineCategory === cat} selectedClass={categoryTone(cat).solid} onClick={() => setSelectedOnlineCategory(cat === selectedOnlineCategory ? null : cat)}>
                    {cat}
                  </Chip>
                ))}
              </div>
              {searchResults.online.length === 0 ? (
                <Empty />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {searchResults.online.map((item) => (
                    <LandingCard key={item.id} item={item} href={resourcePath(item)} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 이달의 학년별 추천 */}
        {!isSearching && (
          <section className="mt-4" aria-labelledby="recommend-title">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 id="recommend-title" className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-slate-50 sm:text-3xl">
                  <Sparkles className="h-6 w-6 text-brand" aria-hidden />
                  이달의 학년별 추천
                </h2>
                <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-400">
                  학년을 선택하면 <span className="font-bold text-brand dark:text-emerald-400">{monthLabel}</span>에 어울리는 체험과 자료를 보여드려요.
                </p>
              </div>
              <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="월 선택">
                <div className="flex w-max gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMonth(m)}
                      aria-pressed={selectedMonth === m}
                      className={`h-8 shrink-0 rounded-full px-3 text-[13px] font-bold transition-colors ${selectedMonth === m ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                    >
                      {m}월
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="학년 선택">
              <Chip selected={selectedGrade === null} onClick={() => setSelectedGrade(null)} className="h-10 px-5">
                전체
              </Chip>
              {GRADES.map((g) => (
                <Chip key={g} selected={selectedGrade === g} onClick={() => setSelectedGrade(g === selectedGrade ? null : g)} className="h-10 px-5">
                  {g}학년
                </Chip>
              ))}
            </div>

            {recommendedItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-[15px] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                {selectedGrade ? `${selectedGrade}학년 · ` : ""}
                {monthLabel}에 해당하는 추천 자료가 아직 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recommendedItems.map(({ item, linked }) => (
                  <LandingCard key={item.id} item={item} href={hrefFor(item, linked)} />
                ))}
              </div>
            )}
          </section>
        )}

        {!isSearching && <PopularSection initialData={initialData} />}
      </main>

      <footer className="border-t border-slate-200/70 bg-white/60 py-6 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-4 text-center text-[13px] text-slate-500 dark:text-slate-400 sm:px-6">
          대구광역시교육청 · 초등 자기주도학습 정보모아
          <div className="mt-1 font-semibold text-slate-600 dark:text-slate-300">에듀맵스</div>
        </div>
      </footer>

      <HowToModal isOpen={isHowToOpen} onClose={() => setIsHowToOpen(false)} updatedTime={updatedTime} changelog={changelog} />
    </div>
  );
}
