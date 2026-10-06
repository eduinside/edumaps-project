"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LocateFixed } from "lucide-react";
import type { ChangelogEntry, Resource } from "../lib/resourceTypes";
import { GRADES, PLACE_THEMES, DEFAULT_PLACE_COLOR, REGIONS, TABS, distanceKm, hasCoords, type TabKey } from "../lib/catalog";
import { trackResourceStat } from "../lib/trackResourceStat";
import MapComponent, { type Insets, type MapHandle } from "./MapComponent";
import HowToModal from "./HowToModal";
import UrlSync from "./UrlSync";
import Chip from "./ui/Chip";
import Dialog from "./ui/Dialog";
import MapHeader from "./map/MapHeader";
import ResourceListItem from "./map/ResourceListItem";
import ResourceDetail from "./map/ResourceDetail";
import OnlineBoard from "./map/OnlineBoard";

interface Props {
  tab: TabKey;
  initialData: Resource[];
  updatedTime: string;
  changelog?: ChangelogEntry[];
}

type Snap = "peek" | "half" | "full";
const NEARBY_LIMIT = 10;
const LOCATION_KEY = "edumaps_userLocation";

// 모바일(가로 768px 미만) 여부. 정적 HTML은 데스크톱 기준으로 그리고 브라우저에서 맞춘다.
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

// 창 높이(하단 시트 단계 계산용)
function useViewportHeight() {
  const [vh, setVh] = useState(800);
  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vh;
}

// 요소 높이를 따라간다(하단 시트·상세 높이만큼 지도 중심을 올리기 위해)
function useHeight<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.getBoundingClientRect().height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, height] as const;
}

const firstTopicGrade = (r: Resource) => {
  const grades = (r.grade_topics || []).map((gt) => gt.grade).sort((a, b) => a - b);
  return grades[0] ?? null;
};

export default function EduMapsClient({ tab, initialData, updatedTime, changelog }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const vh = useViewportHeight();
  const isMapTab = tab !== "online";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [onlineCategory, setOnlineCategory] = useState<string | null>(null);
  const [onlineGrade, setOnlineGrade] = useState<number | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  // 세션 동안 내 위치를 기억한다(이 기기 안에서만). 정적 HTML 렌더에는 쓰이지 않는 값이라 바로 읽어도 된다.
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem(LOCATION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [snap, setSnap] = useState<Snap>("half");
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [howToOpen, setHowToOpen] = useState(false);
  // 온라인 탭으로 처음 들어오면 지도를 만들지 않는다. 지도 탭을 한 번 거치면 숨긴 채로 유지해 다시 만들지 않는다.
  const [mapMounted, setMapMounted] = useState(isMapTab);

  const mapRef = useRef<MapHandle>(null);
  const pushedDetailRef = useRef(false);
  const trackedIdRef = useRef<string | null>(null);
  const dragState = useRef<{ startY: number; startH: number; moved: boolean } | null>(null);
  const [sheetRef, sheetHeight] = useHeight<HTMLElement>();
  const [detailRef, detailHeight] = useHeight<HTMLElement>();

  const byId = useMemo(() => new Map(initialData.map((r) => [String(r.id), r])), [initialData]);
  const selectedResource = selectedId ? byId.get(selectedId) ?? null : null;

  if (isMapTab && !mapMounted) setMapMounted(true);

  // 탭이 바뀌면 필터를 초기화한다(같은 컴포넌트가 유지되므로 렌더 중에 이전 탭과 비교)
  const [prevTab, setPrevTab] = useState(tab);
  if (prevTab !== tab) {
    setPrevTab(tab);
    setRegion(null);
    setNearbyMode(false);
    setOnlineCategory(null);
    setOnlineGrade(null);
    setLocError("");
  }

  const centerTo = useCallback((r: Resource) => {
    if (hasCoords(r)) setCenterOn({ lat: r.location.lat, lng: r.location.lng, key: Date.now() });
  }, []);

  // 주소(?id=&grade=)가 상세의 정본이다: 뒤로가기로 상세가 닫히고, 주소를 그대로 공유할 수 있다.
  const handleUrl = useCallback(
    (params: URLSearchParams) => {
      const id = params.get("id");
      const gradeParam = params.get("grade");
      const grade = gradeParam ? parseInt(gradeParam, 10) : null;
      if (grade && grade >= 1 && grade <= 6) setSelectedGrade(grade);
      if (!id) {
        setSelectedId(null);
        pushedDetailRef.current = false;
        trackedIdRef.current = null;
        return;
      }
      const resource = byId.get(id);
      if (!resource) return;
      setSelectedId(id);
      if (trackedIdRef.current !== id) {
        trackedIdRef.current = id;
        trackResourceStat(resource.id, "click");
        centerTo(resource);
      }
      if (tab === "roadmap" && !grade) {
        setSelectedGrade((g) => (g !== null && resource.grade_topics?.some((gt) => gt.grade === g) ? g : firstTopicGrade(resource)));
      }
    },
    [byId, tab, centerTo]
  );

  const writeUrl = (params: URLSearchParams, mode: "push" | "replace") => {
    const qs = params.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  // 목록·마커·검색 어디서 고르든 같은 경로로 연다(로드맵이면 학년도 함께 맞춘다)
  const openResource = (r: Resource) => {
    const params = new URLSearchParams();
    params.set("id", r.id);
    if (tab === "roadmap") {
      const grade = selectedGrade !== null && r.grade_topics?.some((gt) => gt.grade === selectedGrade) ? selectedGrade : firstTopicGrade(r);
      if (grade) {
        params.set("grade", String(grade));
        setSelectedGrade(grade);
      }
    }
    // 상세가 이미 열려 있으면 기록을 쌓지 않고 바꾼다 → 뒤로가기 한 번이면 닫힌다
    const mode = selectedId && pushedDetailRef.current ? "replace" : "push";
    writeUrl(params, mode);
    if (mode === "push") pushedDetailRef.current = true;
    setSelectedId(r.id);
    if (trackedIdRef.current !== r.id) {
      trackedIdRef.current = r.id;
      trackResourceStat(r.id, "click");
    }
    centerTo(r);
  };

  const closeDetail = () => {
    if (pushedDetailRef.current) {
      pushedDetailRef.current = false;
      window.history.back();
    } else {
      const params = new URLSearchParams(window.location.search);
      params.delete("id");
      writeUrl(params, "replace");
    }
    setSelectedId(null);
  };

  const changeDetailGrade = (grade: number) => {
    setSelectedGrade(grade);
    const params = new URLSearchParams(window.location.search);
    params.set("grade", String(grade));
    writeUrl(params, "replace");
  };

  // ESC로 지도 탭의 상세를 닫는다(온라인 탭은 Dialog가 처리)
  useEffect(() => {
    if (!selectedResource || !isMapTab) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !howToOpen) closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResource, isMapTab, howToOpen]);

  const changeTab = (next: TabKey, query = "") => {
    pushedDetailRef.current = false;
    setSelectedId(null);
    if (next !== "roadmap") setSelectedGrade(null);
    router.push(`/${next}${query ? `?${query}` : ""}`);
  };

  const pickSearchResult = (r: Resource) => {
    if (r.type === "OFFLINE" ? tab === "visitmap" : tab === "online") openResource(r);
    else changeTab(r.type === "OFFLINE" ? "visitmap" : "online", `id=${r.id}`);
  };

  const listResources = useMemo(() => {
    if (tab === "visitmap") {
      let list = initialData.filter((r) => r.type === "OFFLINE" && (!region || r.category === region));
      if (nearbyMode && userLocation) {
        list = [...list]
          .filter(hasCoords)
          .sort((a, b) => distanceKm(userLocation, a.location) - distanceKm(userLocation, b.location))
          .slice(0, NEARBY_LIMIT);
      }
      return list;
    }
    if (tab === "roadmap") {
      const list = initialData.filter((r) => (r.grade_topics?.length ?? 0) > 0 && (selectedGrade === null || r.grade_topics.some((gt) => gt.grade === selectedGrade)));
      if (selectedGrade === null) return list;
      // 활용 시트 순서(usage_index)를 존중해 정렬
      const order = (r: Resource) => r.grade_topics.find((gt) => gt.grade === selectedGrade)?.usage_index ?? 9999;
      return [...list].sort((a, b) => order(a) - order(b));
    }
    return [];
  }, [tab, initialData, region, nearbyMode, userLocation, selectedGrade]);

  // 지도에는 필터 결과를, 상세가 열려 있으면 그 장소도 함께 표시
  const mapResources = useMemo(() => {
    if (!isMapTab) return [];
    if (selectedResource && selectedResource.type === "OFFLINE" && !listResources.includes(selectedResource)) return [...listResources, selectedResource];
    return listResources;
  }, [isMapTab, listResources, selectedResource]);

  // 지역 선택·내 근처 시 해당 장소들이 보이도록 지도를 맞춘다
  useEffect(() => {
    if (tab !== "visitmap") return;
    if (nearbyMode && userLocation) {
      mapRef.current?.fitToPoints([userLocation, ...listResources.slice(0, 5).map((r) => r.location)]);
    } else if (region) {
      const points = listResources.filter(hasCoords).map((r) => r.location);
      if (points.length) mapRef.current?.fitToPoints(points);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, nearbyMode, userLocation, tab]);

  const toggleNearby = () => {
    setLocError("");
    if (nearbyMode) {
      setNearbyMode(false);
      return;
    }
    if (userLocation) {
      setRegion(null);
      setNearbyMode(true);
      return;
    }
    if (!navigator.geolocation) {
      setLocError("이 브라우저는 위치 찾기를 지원하지 않아요. 지역을 골라 주세요.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        try {
          sessionStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
        } catch {}
        setRegion(null);
        setNearbyMode(true);
        setLocating(false);
      },
      () => {
        setLocError("위치를 가져오지 못했어요. 브라우저의 위치 권한을 확인하거나 지역을 골라 주세요.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── 모바일 하단 시트: 접힘·반·전체 3단계, 손잡이를 끌거나 눌러 조절 ──
  const snapHeights: Record<Snap, number> = { peek: 150, half: Math.round(vh * 0.46), full: Math.max(vh - 150, 320) };
  const sheetHeightPx = dragHeight ?? snapHeights[snap];

  const onHandleDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragState.current = { startY: e.clientY, startH: sheetHeightPx, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d) return;
    const dy = d.startY - e.clientY;
    if (Math.abs(dy) > 6) d.moved = true;
    if (d.moved) setDragHeight(Math.min(Math.max(d.startH + dy, 110), snapHeights.full));
  };
  const onHandleUp = () => {
    const d = dragState.current;
    dragState.current = null;
    if (!d) return;
    if (!d.moved) {
      setSnap((s) => (s === "peek" ? "half" : s === "half" ? "full" : "peek"));
    } else if (dragHeight !== null) {
      const nearest = (Object.keys(snapHeights) as Snap[]).reduce((a, b) => (Math.abs(snapHeights[a] - dragHeight) <= Math.abs(snapHeights[b] - dragHeight) ? a : b));
      setSnap(nearest);
    }
    setDragHeight(null);
  };

  // 지도를 가리는 영역: 모바일은 머리(두 줄)+하단 시트/상세, 데스크톱은 머리+왼쪽 목록+오른쪽 상세
  const mapInsets = useMemo<Insets>(
    () =>
      isMobile
        ? { top: 136, right: 0, bottom: selectedResource ? detailHeight : sheetHeight, left: 0 }
        : { top: 88, right: selectedResource ? 436 : 0, bottom: 0, left: panelOpen ? 376 : 0 },
    [isMobile, selectedResource, detailHeight, sheetHeight, panelOpen]
  );

  useEffect(() => {
    mapRef.current?.relayout();
  }, [isMobile]);

  const tabInfo = TABS.find((t) => t.key === tab)!;
  const topicTitleFor = (r: Resource) => (tab === "roadmap" && selectedGrade !== null ? r.grade_topics.find((gt) => gt.grade === selectedGrade)?.topic_title ?? null : null);

  const detail = selectedResource && (
    <ResourceDetail
      resource={selectedResource}
      tab={tab}
      selectedGrade={selectedGrade}
      onGradeChange={changeDetailGrade}
      onClose={closeDetail}
      onOpenRoadmap={(r, g) => changeTab("roadmap", `id=${r.id}&grade=${g}`)}
    />
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={null}>
        <UrlSync onChange={handleUrl} />
      </Suspense>

      <MapHeader tab={tab} resources={initialData} onTabChange={(t) => changeTab(t)} onPickResult={pickSearchResult} onHowTo={() => setHowToOpen(true)} />

      {/* 지도 (온라인 탭에서는 숨김) */}
      {mapMounted && (
        <div className={`absolute inset-0 z-0 ${isMapTab ? "" : "invisible"}`} aria-hidden={!isMapTab}>
          <MapComponent
            ref={mapRef}
            resources={mapResources}
            selectedId={selectedId}
            centerOn={centerOn}
            onMarkerClick={openResource}
            userLocation={tab === "visitmap" ? userLocation : null}
            insets={mapInsets}
          />
        </div>
      )}

      {/* 지도 범례: 마커 색이 뜻하는 대표 주제 */}
      {tab === "visitmap" && (
        <ul aria-label="지도 표시 색" className="absolute right-4 top-24 z-10 hidden flex-col gap-1 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur dark:bg-slate-900/90 dark:text-slate-200 md:flex">
          {[...PLACE_THEMES, { tag: "", label: "체험", color: DEFAULT_PLACE_COLOR }].map((t) => (
            <li key={t.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} aria-hidden />
              {t.label}
            </li>
          ))}
        </ul>
      )}

      {/* 온라인 탭 본문 */}
      {tab === "online" && (
        <main className="absolute inset-0 z-10 overflow-y-auto pt-[8.5rem] md:pt-24">
          <OnlineBoard
            resources={initialData}
            category={onlineCategory}
            grade={onlineGrade}
            selectedId={selectedId}
            onCategoryChange={setOnlineCategory}
            onGradeChange={setOnlineGrade}
            onSelect={openResource}
          />
        </main>
      )}

      {/* 목록 패널: 모바일은 하단 시트, 데스크톱은 왼쪽 패널 */}
      {isMapTab && (panelOpen || isMobile) && (
        <aside
          ref={sheetRef}
          aria-label={`${tabInfo.label} 목록`}
          style={{ "--sheet-h": `${sheetHeightPx}px` } as React.CSSProperties}
          className={`fixed inset-x-0 bottom-0 z-20 flex h-[var(--sheet-h)] flex-col rounded-t-3xl border border-slate-200/70 bg-white shadow-[0_-8px_30px_rgb(0_0_0/0.12)] dark:border-slate-700/70 dark:bg-slate-900 md:absolute md:bottom-4 md:left-4 md:right-auto md:top-24 md:h-auto md:w-[360px] md:rounded-2xl md:shadow-xl ${dragHeight === null ? "transition-[height] duration-300" : ""} ${selectedResource && isMobile ? "invisible" : ""}`}
        >
          {/* 모바일 손잡이: 끌거나 눌러서 높이 조절 */}
          <button
            type="button"
            aria-label={snap === "full" ? "목록 접기" : "목록 더 펼치기"}
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            className="flex h-7 w-full shrink-0 touch-none items-center justify-center md:hidden"
          >
            <span className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
          </button>

          <div className="shrink-0 px-4 pb-2 md:pt-4">
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-50">{tabInfo.label}</h1>
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{listResources.length}</span>
              {nearbyMode && <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">가까운 {NEARBY_LIMIT}곳</span>}
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="목록 패널 접기"
                className="ml-auto hidden h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:grid"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="scrollbar-hide -mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label={tab === "visitmap" ? "지역" : "학년"}>
              {tab === "visitmap" && (
                <>
                  <Chip
                    size="sm"
                    selected={region === null && !nearbyMode}
                    onClick={() => {
                      setRegion(null);
                      setNearbyMode(false);
                      mapRef.current?.resetView();
                    }}
                  >
                    전체
                  </Chip>
                  <Chip size="sm" selected={nearbyMode} onClick={toggleNearby} selectedClass="bg-blue-600 text-white">
                    <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-spin" : ""}`} aria-hidden />
                    {locating ? "찾는 중" : "내 근처"}
                  </Chip>
                  {REGIONS.map((r) => (
                    <Chip
                      key={r}
                      size="sm"
                      selected={region === r}
                      onClick={() => {
                        setRegion(region === r ? null : r);
                        setNearbyMode(false);
                      }}
                    >
                      {r}
                    </Chip>
                  ))}
                </>
              )}
              {tab === "roadmap" && (
                <>
                  <Chip
                    size="sm"
                    selected={selectedGrade === null}
                    onClick={() => {
                      setSelectedGrade(null);
                      mapRef.current?.resetView();
                    }}
                  >
                    전체
                  </Chip>
                  {GRADES.map((g) => (
                    <Chip key={g} size="sm" selected={selectedGrade === g} onClick={() => setSelectedGrade(selectedGrade === g ? null : g)}>
                      {g}학년
                    </Chip>
                  ))}
                </>
              )}
            </div>
            {locError && (
              <p role="alert" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                {locError}
              </p>
            )}
          </div>

          <ul className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 pb-6">
            {listResources.length === 0 ? (
              <li className="py-16 text-center text-[15px] text-slate-500 dark:text-slate-400">해당 조건의 자원이 없습니다.</li>
            ) : (
              listResources.map((r) => (
                <li key={r.id}>
                  <ResourceListItem
                    resource={r}
                    active={selectedId === r.id}
                    onSelect={openResource}
                    topicTitle={topicTitleFor(r)}
                    distance={nearbyMode && userLocation && hasCoords(r) ? distanceKm(userLocation, r.location) : null}
                  />
                </li>
              ))
            )}
          </ul>
        </aside>
      )}

      {/* 데스크톱: 접은 목록 다시 펼치기 */}
      {isMapTab && !panelOpen && !isMobile && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-label="목록 패널 펼치기"
          className="absolute left-4 top-24 z-20 grid h-12 w-12 place-items-center rounded-full bg-white text-brand shadow-xl hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 상세: 지도 탭은 오른쪽 패널(모바일은 하단 시트), 온라인 탭은 가운데 창 */}
      {isMapTab && selectedResource && (
        <section
          ref={detailRef}
          role="dialog"
          aria-labelledby="resource-detail-title"
          className="fixed inset-x-0 bottom-0 z-40 flex max-h-[62dvh] flex-col overflow-hidden rounded-t-3xl border border-slate-200/70 bg-white shadow-[0_-8px_30px_rgb(0_0_0/0.18)] animate-in fade-in slide-in-from-bottom-8 dark:border-slate-700/70 dark:bg-slate-900 md:absolute md:bottom-auto md:left-auto md:right-4 md:top-24 md:max-h-[calc(100dvh-7rem)] md:w-[420px] md:rounded-2xl md:shadow-2xl md:slide-in-from-bottom-0 md:slide-in-from-right-4"
        >
          {detail}
        </section>
      )}

      {tab === "online" && (
        <Dialog
          open={!!selectedResource}
          onClose={closeDetail}
          labelledBy="resource-detail-title"
          className="max-w-lg max-md:mb-0 max-md:mt-auto max-md:w-full max-md:max-w-none max-md:rounded-b-none"
        >
          <div className="flex max-h-[min(88dvh,900px)] flex-col">{detail}</div>
        </Dialog>
      )}

      <HowToModal isOpen={howToOpen} onClose={() => setHowToOpen(false)} updatedTime={updatedTime} changelog={changelog} />
    </div>
  );
}
