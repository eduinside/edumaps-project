"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, MonitorPlay, Sparkles, TrendingUp } from "lucide-react";
import HowToModal from "./HowToModal";
import CategoryNav from "./CategoryNav";
import HomeCarousel from "./HomeCarousel";
import { mediaUrl } from "../lib/media";

interface Props {
  initialData: any[];
  updatedTime?: string;
  changelog?: { date: string; text: string }[];
}

const ONLINE_CATEGORIES = ["언어", "수리", "디지털", "외국어", "문화", "더 알아보기"];
const FALLBACK_IMAGE = mediaUrl("res_000.webp");
const EDU_LINK_API = process.env.NEXT_PUBLIC_EDU_LINK_API;

function ResourceImage({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const finalSrc = !src || errored ? FALLBACK_IMAGE : src;
  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setErrored(true)}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}

function LandingCard({ item, onClick }: { item: any; onClick: () => void }) {
  const isOffline = item.type === "OFFLINE";
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative w-full aspect-[16/10] bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <ResourceImage src={item.image_url} alt={item.title} />
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black rounded-full shadow-md ${isOffline ? "bg-emerald-500 text-white" : "bg-sky-500 text-white"
            }`}
        >
          {isOffline ? (
            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />현장체험</span>
          ) : (
            <span className="inline-flex items-center gap-1"><MonitorPlay className="w-3 h-3" />온라인</span>
          )}
        </span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {item.category && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
              {item.category}
            </span>
          )}
          {item.tags?.slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
          {item.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
      </div>
    </div>
  );
}

// edu-link(D1) 클릭 집계를 조회해 실제 resources와 매칭한다. 데이터가 없으면 섹션째 숨긴다.
function PopularSection({ initialData, onItemClick }: { initialData: any[]; onItemClick: (item: any) => void }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!EDU_LINK_API) return;
    let active = true;
    fetch(`${EDU_LINK_API}/resource-stats/top?metric=click&limit=8`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.success) return;
        const byId = new Map(initialData.map((r: any) => [String(r.id), r]));
        const resolved = (data.items || [])
          .map((row: any) => byId.get(String(row.resource_id)))
          .filter(Boolean);
        setItems(resolved);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialData]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16 mb-4">
      <div className="mb-6">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
          많이 찾는 자료
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          다른 학부모님들이 많이 확인한 현장체험·온라인 자료예요.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <LandingCard key={item.id} item={item} onClick={() => onItemClick(item)} />
        ))}
      </div>
    </section>
  );
}

export default function LandingClient({ initialData, updatedTime, changelog }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOnlineCategory, setSelectedOnlineCategory] = useState<string | null>(null);
  const [selectedOfflineTag, setSelectedOfflineTag] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  // URL ?q= 파라미터로 검색어 초기화
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(decodeURIComponent(q));
  }, [searchParams]);

  // 검색어 변경 시 필터 상태 초기화
  useEffect(() => {
    setSelectedOfflineTag(null);
    setSelectedOnlineCategory(null);
  }, [searchQuery]);

  const navigateToItem = (item: any, linked: boolean = false) => {
    if (linked) {
      router.push(`/roadmap?id=${item.id}`);
      return;
    }
    const path = item.type === "OFFLINE" ? `/visitmap?id=${item.id}` : `/online?id=${item.id}`;
    router.push(path);
  };

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return { offline: [], online: [], allOffline: [], allOnline: [] };
    const matches = (item: any) => {
      const haystack = [
        item.title,
        item.description,
        item.category,
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmedQuery);
    };
    const allOffline = initialData.filter((i) => i.type === "OFFLINE" && matches(i));
    let offline = allOffline;
    if (selectedOfflineTag) {
      offline = offline.filter((i) => i.category === selectedOfflineTag);
    }
    const allOnline = initialData.filter((i) => i.type === "ONLINE" && matches(i));
    let online = allOnline;
    if (selectedOnlineCategory) {
      online = online.filter((i) => i.category === selectedOnlineCategory);
    }
    return { offline, online, allOffline, allOnline };
  }, [initialData, trimmedQuery, isSearching, selectedOfflineTag, selectedOnlineCategory]);

  const monthLabel = `${selectedMonth}월`;

  const recommendedItems = useMemo<{ item: any; linked: boolean }[]>(() => {
    const MIN = 4;
    const MAX = 8;
    const gradeStr = selectedGrade === null ? null : String(selectedGrade);

    const isLinked = (item: any) => {
      const topics = item.grade_topics || [];
      if (gradeStr === null) {
        return topics.some((gt: any) => gt.month === monthLabel);
      }
      const recGrades = (item.recommended_grade || []).map((g: any) => String(g));
      if (!recGrades.includes(gradeStr)) return false;
      return topics.some((gt: any) => String(gt.grade) === gradeStr && gt.month === monthLabel);
    };

    const linked = initialData.filter(isLinked);
    const used = new Set<string>(linked.map((i: any) => i.id));
    const result: { item: any; linked: boolean }[] = linked.map((item: any) => ({ item, linked: true }));

    // 월×학년 시드 기반 결정론적 셔플 (같은 조합은 항상 동일 순서)
    const seed = (selectedMonth ?? 0) * 7 + (selectedGrade ?? 0) * 13;
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

    const balancePush = (candidates: any[]) => {
      if (result.length >= MIN && result.length >= MAX) return;
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
        if (result.length >= MIN && result.length >= MAX) break;
      }
    };

    // 2차: 같은 월에 다른 학년 grade_topic을 가진 자료
    if (result.length < MIN) {
      const tier2 = initialData.filter((item: any) => {
        if (used.has(item.id)) return false;
        return (item.grade_topics || []).some((gt: any) => gt.month === monthLabel);
      });
      balancePush(tier2);
    }

    // 3차: recommended_grade에 해당 학년이 포함된 자료(연계 토픽 없음)
    if (result.length < MIN && gradeStr !== null) {
      const tier3 = initialData.filter((item: any) => {
        if (used.has(item.id)) return false;
        return (item.recommended_grade || []).map((g: any) => String(g)).includes(gradeStr);
      });
      balancePush(tier3);
    }

    // 4차: 안전망 — 어떤 자료든 type 균형으로 채움
    if (result.length < MIN) {
      const tier4 = initialData.filter((item: any) => !used.has(item.id));
      balancePush(tier4);
    }

    return result.slice(0, MAX);
  }, [initialData, selectedGrade, monthLabel]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group relative" onClick={() => router.push("/")}>
            <div className="relative w-9 h-9 transition-transform group-hover:scale-110">
              <Image src={mediaUrl("daegu_logo.webp")} alt="에듀맵스 로고" fill className="object-contain rounded-full" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
              <span className="hidden sm:inline">대구 </span>에듀맵스
            </h1>
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] shadow-xl">
              검색과 월별 추천 자료를 확인하세요
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* Hero + Search */}
        <section className="pt-12 sm:pt-20 pb-10 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight break-keep">
            우리 아이 자기주도학습을 위한<br className="hidden sm:block" />
            <span className="text-emerald-500"> 대구 체험·온라인 학습 길잡이</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
            현장체험과 온라인 학습 자원을 한 번에 검색하고, 이달의 학년별 추천자원을 만나보세요.
          </p>

          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력하세요 (예: 박물관, 수학, 역사)"
                className="w-full pl-14 pr-5 py-4 sm:py-5 text-base rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 shadow-lg dark:shadow-slate-900/50 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Category shortcuts + promo/download carousel */}
        {!isSearching && (
          <>
            <CategoryNav onHowTo={() => setIsHowToOpen(true)} />
            <HomeCarousel />
          </>
        )}

        {/* Search Results */}
        {isSearching && (
          <section className="space-y-10 animate-in fade-in duration-300">
            {/* OFFLINE Results */}
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" /> 현장체험
                  <span className="text-emerald-500 text-sm">{searchResults.offline.length}</span>
                </h3>
              </div>
              {searchResults.allOffline.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setSelectedOfflineTag(null)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${selectedOfflineTag === null
                        ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                  >
                    전체
                  </button>
                  {(() => {
                    const allRegions = new Set<string>();
                    searchResults.allOffline.forEach((item: any) => {
                      if (item.category) allRegions.add(item.category);
                    });
                    return Array.from(allRegions).sort().map((region) => (
                      <button
                        key={region}
                        onClick={() => setSelectedOfflineTag(region === selectedOfflineTag ? null : region)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${selectedOfflineTag === region
                            ? "bg-emerald-500 text-white shadow"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                      >
                        {region}
                      </button>
                    ));
                  })()}
                </div>
              )}
              {searchResults.offline.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl">검색 결과가 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {searchResults.offline.map((item: any) => (
                    <LandingCard key={item.id} item={item} onClick={() => navigateToItem(item)} />
                  ))}
                </div>
              )}
            </div>

            {/* ONLINE Results */}
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-sky-500" /> 온라인 학습
                  <span className="text-sky-500 text-sm">{searchResults.online.length}</span>
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedOnlineCategory(null)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${selectedOnlineCategory === null
                      ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                >
                  전체
                </button>
                {ONLINE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedOnlineCategory(cat === selectedOnlineCategory ? null : cat)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${selectedOnlineCategory === cat
                        ? "bg-sky-500 text-white shadow"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {searchResults.online.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl">검색 결과가 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {searchResults.online.map((item: any) => (
                    <LandingCard key={item.id} item={item} onClick={() => navigateToItem(item)} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Monthly Recommended */}
        {!isSearching && (
          <section className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                  이달의 학년별 추천
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  학년을 선택하면 <span className="text-emerald-600 font-bold">{monthLabel}</span>에 어울리는 체험과 자료를 보여드려요.
                </p>
              </div>
              {/* Month Selector */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-sm overflow-x-auto custom-scrollbar">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${selectedMonth === m
                        ? "bg-emerald-500 text-white shadow"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                  >
                    {m}월
                  </button>
                ))}
              </div>
            </div>

            {/* Grade Selector */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedGrade(null)}
                className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${selectedGrade === null
                    ? "bg-emerald-500 text-white shadow-lg scale-105"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
              >
                전체
              </button>
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g === selectedGrade ? null : g)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${selectedGrade === g
                      ? "bg-emerald-500 text-white shadow-lg scale-105"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                >
                  {g}학년
                </button>
              ))}
            </div>

            {recommendedItems.length === 0 ? (
              <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-sm bg-slate-50/60 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-700">
                {selectedGrade ? `${selectedGrade}학년 · ` : ""}{monthLabel}에 해당하는 추천 자료가 아직 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendedItems.map(({ item, linked }) => (
                  <LandingCard key={item.id} item={item} onClick={() => navigateToItem(item, linked)} />
                ))}
              </div>
            )}
          </section>
        )}

        {!isSearching && <PopularSection initialData={initialData} onItemClick={(item) => navigateToItem(item)} />}
      </main>

      <footer className="border-t border-slate-100 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-400 dark:text-slate-500">
          대구광역시교육청 · 초등 자기주도학습 정보모아
          <div className="mt-1 font-semibold text-slate-500 dark:text-slate-400">에듀맵스</div>
        </div>
      </footer>

      <HowToModal isOpen={isHowToOpen} onClose={() => setIsHowToOpen(false)} updatedTime={updatedTime} changelog={changelog} />
    </div>
  );
}
