"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Map, MapPin, MonitorPlay, BookOpen, X, Info, ChevronRight, ChevronLeft, ExternalLink, Navigation, History, Search } from "lucide-react";
import MapComponent from "./MapComponent";
import HowToModal from "./HowToModal";

interface Props {
  initialData: any[];
  updatedTime: string;
}

export default function EduMapsClient({ initialData, updatedTime }: Props) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // URL 경로에 따른 활성 탭 설정 (visitmap, online, roadmap)
  const activeTab = useMemo(() => {
    const tab = params.tab as string;
    if (tab === "online") return "ONLINE";
    if (tab === "roadmap") return "GRADE";
    return "OFFLINE";
  }, [params.tab]);

  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [centerOn, setCenterOn] = useState<{ lat: number, lng: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");

  const headerSearchResults = useMemo(() => {
    const q = headerQuery.trim().toLowerCase();
    if (!q) return [];
    return initialData.filter((item: any) => {
      const haystack = [item.title, item.description, item.category, ...(item.tags || [])]
        .filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    }).slice(0, 8);
  }, [headerQuery, initialData]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setHeaderQuery("");
    router.push(`/?q=${encodeURIComponent(q)}`);
  };

  const navigateToHeaderResult = (item: any) => {
    setSearchOpen(false);
    setHeaderQuery("");
    const path = item.type === "OFFLINE" ? `/visitmap?id=${item.id}` : item.type === "ONLINE" ? `/online?id=${item.id}` : `/roadmap?id=${item.id}`;
    router.push(path);
  };

  // URL 파라미터가 있을 때 초기 상태 설정
  useEffect(() => {
    const gradeParam = searchParams.get("grade");
    const idParam = searchParams.get("id");

    if (gradeParam) setSelectedGrade(parseInt(gradeParam));
    if (idParam) {
      const resource = initialData.find(r => r.id.toString() === idParam);
      if (resource) {
        setSelectedResource(resource);
        // 로드맵 탭에서 id가 있으면, 해당 자원의 첫 번째 grade_topics의 grade를 자동 선택
        if (activeTab === "GRADE" && resource.grade_topics && resource.grade_topics.length > 0) {
          setSelectedGrade(resource.grade_topics[0].grade);
        }
        if (resource.location?.lat && resource.location?.lng) {
          setCenterOn({ lat: resource.location.lat, lng: resource.location.lng });
        }
      }
    }
  }, [searchParams, initialData, activeTab]);

  // 탭 변경 시 URL 이동 함수
  const handleTabChange = (tab: string, extraParams?: string) => {
    setSelectedCategory(null);
    setSelectedResource(null);
    setSelectedGrade(null);
    router.push(`/${tab}${extraParams ? `?${extraParams}` : ""}`);
  };

  const filteredResources = useMemo(() => {
    let result = initialData.filter(resource => {
      if (activeTab === "OFFLINE") {
        if (resource.type !== "OFFLINE") return false;
        if (selectedCategory && resource.category !== selectedCategory) return false;
        return true;
      }
      if (activeTab === "ONLINE") {
        if (resource.type !== "ONLINE") return false;
        if (selectedCategory && resource.category !== selectedCategory) return false;
        return true;
      }
      if (activeTab === "GRADE") {
        const hasRoadmap = resource.grade_topics && resource.grade_topics.length > 0;
        if (selectedGrade === null) return hasRoadmap;
        return resource.grade_topics?.some((gt: any) => gt.grade === selectedGrade);
      }
      return true;
    });

    // 로드맵(GRADE) 탭인 경우 활용 시트 데이터 순서(usage_index)를 존중하여 정렬
    if (activeTab === "GRADE" && selectedGrade !== null) {
      result = [...result].sort((a, b) => {
        const aTopic = a.grade_topics?.find((gt: any) => gt.grade === selectedGrade);
        const bTopic = b.grade_topics?.find((gt: any) => gt.grade === selectedGrade);

        const aIndex = aTopic ? aTopic.usage_index : 9999;
        const bIndex = bTopic ? bTopic.usage_index : 9999;

        return aIndex - bIndex;
      });
    }

    return result;
  }, [activeTab, selectedGrade, selectedCategory, initialData]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Floating Header */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md shadow-lg rounded-full z-20">
        <div className="flex items-center gap-2 cursor-pointer group relative" onClick={() => router.push('/')}>
          <div className="relative w-9 h-9 transition-transform group-hover:scale-110">
            <Image src="/images/daegu_logo.webp" alt="EduMaps Logo" fill className="object-contain rounded-full" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">EduMaps</h1>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] shadow-xl">
            검색과 월별 추천 자료를 확인하세요
          </span>
        </div>
        <nav className="hidden sm:flex gap-2">
          <div className="group relative">
            <button
              onClick={() => handleTabChange("visitmap")}
              className={`text-sm font-bold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all ${activeTab === "OFFLINE" ? "text-white bg-emerald-500 shadow-lg scale-105" : "text-slate-600 bg-slate-100 hover:bg-slate-200"}`}
            >
              <MapPin className="w-4 h-4" /> 체험학습
            </button>
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] shadow-xl">
              대구 지역의 오프라인 현장체험 장소를 지도로 확인하세요
            </span>
          </div>
          <div className="group relative">
            <button
              onClick={() => handleTabChange("online")}
              className={`text-sm font-bold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all ${activeTab === "ONLINE" ? "text-white bg-emerald-500 shadow-lg scale-105" : "text-slate-600 bg-slate-100 hover:bg-slate-200"}`}
            >
              <MonitorPlay className="w-4 h-4" /> 온라인
            </button>
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] shadow-xl">
              에듀테크 자원과 유용한 온라인 학습 사이트 모음
            </span>
          </div>
          <div className="group relative">
            <button
              onClick={() => handleTabChange("roadmap")}
              className={`text-sm font-bold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all ${activeTab === "GRADE" ? "text-white bg-emerald-500 shadow-lg scale-105" : "text-slate-600 bg-slate-100 hover:bg-slate-200"}`}
            >
              <BookOpen className="w-4 h-4" /> 학년별 로드맵
            </button>
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] shadow-xl">
              교과 단원과 연계된 학년별 맞춤 학습 코스
            </span>
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleHeaderSearch} className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                <input
                  autoFocus
                  type="text"
                  value={headerQuery}
                  onChange={(e) => setHeaderQuery(e.target.value)}
                  placeholder="전체 자원 검색..."
                  className="w-40 sm:w-56 px-4 py-2 text-sm rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                />
                {/* 모바일: 제출 시 랜딩 검색 결과 페이지로 이동 */}
                <button type="submit" className="sm:hidden p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => { setSearchOpen(false); setHeaderQuery(""); }} className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                {/* 데스크탑: 드롭다운 자동완성 */}
                {headerSearchResults.length > 0 && (
                  <div className="hidden sm:block absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {headerSearchResults.map((item: any) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateToHeaderResult(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left group"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-xl overflow-hidden bg-slate-100">
                          <img src={item.image_url || "/images/res_000.webp"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 truncate">{item.title}</p>
                          <p className="text-xs text-slate-400 truncate">{item.category}</p>
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${item.type === "OFFLINE" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                          {item.type === "OFFLINE" ? "체험" : "온라인"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                aria-label="검색"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
          >
            <Info className="w-4 h-4" /> <span className="hidden sm:inline">이용방법</span>
          </button>
        </div>
      </header>


      {/* Main Content Area */}
      <main className="flex-1 relative w-full h-full">
        {/* Full Screen Map */}
        <div className="absolute inset-0 z-0">
          <MapComponent
            className="w-full h-full"
            resources={activeTab === "ONLINE" ? [] : filteredResources}
            centerOn={centerOn}
            onMarkerClick={(resource) => setSelectedResource(resource)}
          />
          {activeTab === "ONLINE" && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-[12px] z-[1] transition-all duration-700" />
          )}
        </div>

        {/* Floating Sidebar */}
        <div className={`${activeTab === "ONLINE" ? "sm:hidden" : ""} absolute top-24 left-4 z-10 w-full max-w-[340px] transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}`}>
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
            <div className="p-7 pb-4">
              {/* 모바일 전용 탭 네비게이션 */}
              <div className="sm:hidden grid grid-cols-3 gap-1.5 mb-4 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => handleTabChange("visitmap")}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "OFFLINE"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>체험학습</span>
                </button>
                <button
                  onClick={() => handleTabChange("online")}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "ONLINE"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <MonitorPlay className="w-4 h-4" />
                  <span>온라인</span>
                </button>
                <button
                  onClick={() => handleTabChange("roadmap")}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "GRADE"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>로드맵</span>
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-600">
                    {activeTab === "OFFLINE" ? "체험학습" : activeTab === "ONLINE" ? "온라인" : "학년별 로드맵"}
                  </h2>
                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-black rounded-full">{filteredResources.length}</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-1 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeTab === "GRADE" && (
                  <>
                    <button onClick={() => setSelectedGrade(null)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedGrade === null ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>전체</button>
                    {[1, 2, 3, 4, 5, 6].map(grade => (
                      <button key={grade} onClick={() => setSelectedGrade(grade === selectedGrade ? null : grade)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedGrade === grade ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{grade}학년</button>
                    ))}
                  </>
                )}
                {activeTab === "OFFLINE" && (
                  <>
                    <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedCategory === null ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>전체</button>
                    {["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"].map(region => (
                      <button key={region} onClick={() => setSelectedCategory(region === selectedCategory ? null : region)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedCategory === region ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{region}</button>
                    ))}
                  </>
                )}
                {activeTab === "ONLINE" && (
                  <>
                    <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedCategory === null ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>전체</button>
                    {["언어", "수리", "디지털", "문화", "더 알아보기"].map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedCategory === cat ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{cat}</button>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3 custom-scrollbar">
              {filteredResources.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-sm">해당 조건의 자원이 없습니다.</div>
              ) : (
                filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    onClick={() => {
                      setSelectedResource(resource);
                      if (resource.location?.lat && resource.location?.lng) {
                        setCenterOn({ lat: resource.location.lat, lng: resource.location.lng });
                      }
                    }}
                    className={`group ${activeTab === "GRADE" ? "p-5" : "p-4"} rounded-3xl transition-all cursor-pointer border ${selectedResource?.id === resource.id ? "bg-emerald-50 border-emerald-200 shadow-md" : "bg-white border-transparent hover:bg-slate-50 hover:shadow-sm"}`}
                  >
                    <div className="flex gap-4">
                      <div className={`relative ${activeTab === "GRADE" ? "w-20 h-20" : "w-16 h-16"} rounded-2xl overflow-hidden shrink-0 shadow-sm bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Image src={resource.image_url || "/images/res_000.webp"} alt={resource.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-slate-800 ${activeTab === "GRADE" ? "text-base" : "text-sm"} group-hover:text-emerald-600 transition-colors line-clamp-1`}>{resource.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1 mb-1">
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{resource.category}</span>
                          {resource.tags?.map((tag: string) => (
                            <span key={tag} className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-1">{resource.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Padlet-style layout for ONLINE tab on desktop */}
        {activeTab === "ONLINE" && (
          <div className="hidden sm:flex w-full absolute left-0 right-0 bottom-0 top-[100px] z-10 flex-row gap-4 px-4 py-6 overflow-x-auto">
            {["언어", "수리", "디지털", "문화", "더 알아보기"].map((category) => {
              const categoryResources = filteredResources.filter(r => r.category === category);
              return (
                <div key={category} className="flex-1 min-w-[280px] flex flex-col bg-white/90 backdrop-blur-md rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden max-h-[calc(100vh-8rem)]">
                  {/* Column Header */}
                  <div className="px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-600">{category}</h3>
                      <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-black rounded-full">{categoryResources.length}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 custom-scrollbar">
                    {categoryResources.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">항목 없음</div>
                    ) : (
                      categoryResources.map((resource) => (
                        <div
                          key={resource.id}
                          onClick={() => setSelectedResource(resource)}
                          className={`group p-3 rounded-2xl transition-all cursor-pointer border ${
                            selectedResource?.id === resource.id
                              ? "bg-emerald-50 border-emerald-200 shadow-md"
                              : "bg-white border-transparent hover:bg-slate-50 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Image src={resource.image_url || "/images/res_000.webp"} alt={resource.title} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 text-xs group-hover:text-emerald-600 transition-colors line-clamp-2">{resource.title}</h4>
                              <div className="flex flex-wrap gap-0.5 mt-1">
                                {resource.tags && resource.tags.map((tag: string) => (
                                  <span key={tag} className="text-[8px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tag}</span>
                                ))}
                              </div>
                              <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">{resource.description}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Background overlay when modal is open */}
        {selectedResource && activeTab === "ONLINE" && (
          <div className="hidden sm:block absolute inset-0 z-20 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedResource(null)} />
        )}

        {/* Sidebar Toggle Button (Hidden when sidebar is open) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-24 left-4 z-10 p-4 bg-white/90 backdrop-blur-md rounded-full shadow-xl text-emerald-500 hover:bg-white transition-all animate-in fade-in zoom-in"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Floating Detail Panel */}
        {selectedResource && (
          <div className={`absolute z-30 transition-all duration-500 ease-in-out bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 ${activeTab === "ONLINE"
            ? "rounded-t-[2.5rem] rounded-b-none sm:rounded-[2.5rem] left-0 right-0 bottom-0 w-full max-h-[75vh] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[calc(100%-3rem)] sm:max-w-[500px] sm:max-h-[calc(100vh-8rem)] shadow-emerald-200/50"
            : "rounded-t-[2.5rem] rounded-b-none sm:rounded-[2.5rem] left-0 right-0 bottom-0 w-full max-h-[75vh] sm:bottom-auto sm:top-24 sm:left-auto sm:right-4 sm:w-[420px] sm:max-h-[85vh] slide-in-from-right-4"
            }`}>
            {/* Top Image Banner */}
            <div className={`relative w-full shrink-0 ${activeTab === "ONLINE" ? "h-64" : "h-48"} bg-gradient-to-br from-emerald-50 to-slate-100 overflow-hidden flex items-center justify-center`}>
              <Image src={selectedResource.image_url || "/images/res_000.webp"} alt={selectedResource.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button onClick={() => setSelectedResource(null)} className="absolute top-6 right-6 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-6 left-8">
                <span className="px-3 py-1 bg-emerald-500 text-white text-[11px] font-black rounded-lg mb-3 inline-block shadow-lg shadow-emerald-500/30">
                  {selectedResource.type === "OFFLINE" ? "현장체험" : "온라인 학습"}
                </span>
                <h2 className="text-2xl font-black text-white drop-shadow-xl tracking-tight">{selectedResource.title}</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="flex flex-wrap gap-2">
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">{selectedResource.category}</span>
                {selectedResource.tags?.map((tag: string) => (
                  <span key={tag} className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">{tag}</span>
                ))}
              </div>

              {activeTab === "GRADE" && selectedGrade && selectedResource.grade_topics?.find((gt: any) => gt.grade === selectedGrade) ? (
                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 space-y-5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-500/20">{selectedGrade}</div>
                      <span className="text-base font-black text-emerald-800">학년</span>
                    </div>
                    <div className="flex gap-1.5">
                      {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).subject && (
                        <span className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 text-[11px] font-bold rounded-xl shadow-sm">
                          {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).subject}
                        </span>
                      )}
                      {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).month && (
                        <span className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 text-[11px] font-bold rounded-xl shadow-sm">
                          {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).month}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 mb-2 leading-snug">“{selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).topic_title}”</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium opacity-90">{selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).description}</p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="bg-white/70 p-4 rounded-2xl border border-emerald-50">
                      <h5 className="text-xs font-black text-emerald-700 flex items-center gap-2 mb-3"><Info className="w-4 h-4" /> 탐구 질문</h5>
                      <ul className="space-y-2">
                        {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).inquiry_questions?.map((q: string, i: number) => (
                          <li key={i} className="text-[13px] text-slate-600 flex gap-2.5 font-medium">
                            <span className="text-emerald-400 font-black">•</span> {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white/70 p-4 rounded-2xl border border-emerald-50">
                      <h5 className="text-xs font-black text-emerald-700 flex items-center gap-2 mb-3"><History className="w-4 h-4" /> 사후 활동</h5>
                      <ul className="space-y-2">
                        {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).post_activities?.map((a: string, i: number) => (
                          <li key={i} className="text-[13px] text-slate-600 flex gap-2.5 font-medium">
                            <span className="text-emerald-400 font-black">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium">{selectedResource.description || "상세 설명이 등록되어 있지 않습니다."}</p>
                  </div>

                  {/* 온라인 탭 전용: 권장 학년 배지 */}
                  {activeTab === "ONLINE" && selectedResource.recommended_grade?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-1">
                      <span className="text-xs font-bold text-slate-400">권장 학년</span>
                      {(() => {
                        const grades = selectedResource.recommended_grade.map((g: any) => String(g));
                        const allGrades = grades.length === 6 && ['1', '2', '3', '4', '5', '6'].every(g => grades.includes(g));
                        if (allGrades) {
                          return (
                            <span className="px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                              모든 학년
                            </span>
                          );
                        }
                        return grades.map((g: string) => (
                          <span
                            key={g}
                            className="px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100"
                          >
                            {g}학년
                          </span>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* 방문형 탭: 권장 학년 뱃지 */}
              {activeTab === "OFFLINE" && selectedResource.recommended_grade?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <span className="text-xs font-bold text-slate-400">권장 학년</span>
                  {(() => {
                    const grades = selectedResource.recommended_grade.map((g: any) => String(g));
                    const allGrades = grades.length === 6 && ['1', '2', '3', '4', '5', '6'].every(g => grades.includes(g));
                    if (allGrades) {
                      return (
                        <span className="px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          모든 학년
                        </span>
                      );
                    }
                    return grades.map((g: string) => (
                      <span
                        key={g}
                        className="px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100"
                      >
                        {g}학년
                      </span>
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="p-8 pt-0 mt-auto shrink-0 space-y-4">
              <div className={`${selectedResource.type === "ONLINE" ? "flex flex-col" : "grid grid-cols-2"} gap-4`}>
                {selectedResource.external_url && (
                  <a href={selectedResource.external_url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-[1.5rem] text-sm font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 ${selectedResource.type === "ONLINE" ? "w-full" : ""}`}>
                    <ExternalLink className="w-5 h-5" /> 웹사이트
                  </a>
                )}
                {selectedResource.type === "OFFLINE" && (
                  <button
                    onClick={() => {
                      const url = `https://map.kakao.com/link/to/${selectedResource.title},${selectedResource.location.lat},${selectedResource.location.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center justify-center gap-3 py-4 bg-emerald-500 text-white rounded-[1.5rem] text-sm font-black hover:bg-emerald-400 transition-all shadow-xl active:scale-95 shadow-emerald-100"
                  >
                    <Navigation className="w-5 h-5" /> 길찾기
                  </button>
                )}
              </div>

              {activeTab === "OFFLINE" && selectedResource.grade_topics && selectedResource.grade_topics.length > 0 && (
                (() => {
                  const relatedGrades = selectedResource.grade_topics.map((gt: any) => gt.grade).sort((a: number, b: number) => a - b);
                  const uniqueGrades = [...new Set(relatedGrades)];
                  return (
                    <button
                      onClick={() => handleTabChange("roadmap", `id=${selectedResource.id}`)}
                      className="w-full flex flex-col items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-600 border-2 border-emerald-200 rounded-[1.5rem] text-sm font-black hover:from-emerald-100 hover:to-cyan-100 transition-all shadow-sm active:scale-95"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5" /> 관련 로드맵 보기
                      </div>
                      <div className="text-xs font-bold text-emerald-500 opacity-80">
                        {uniqueGrades.map(g => `${g}학년`).join(", ")}
                      </div>
                    </button>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </main>

      <HowToModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} updatedTime={updatedTime} />
    </div>
  );
}
