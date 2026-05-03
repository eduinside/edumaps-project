"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Map, MapPin, MonitorPlay, BookOpen, X, Info, HelpCircle, History, ChevronRight, ChevronLeft, ExternalLink, Navigation } from "lucide-react";
import MapComponent from "./MapComponent";

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

  // URL 파라미터가 있을 때 초기 상태 설정
  useEffect(() => {
    const gradeParam = searchParams.get("grade");
    const idParam = searchParams.get("id");

    if (gradeParam) setSelectedGrade(parseInt(gradeParam));
    if (idParam) {
      const resource = initialData.find(r => r.id.toString() === idParam);
      if (resource) {
        setSelectedResource(resource);
        if (resource.location?.lat && resource.location?.lng) {
          setCenterOn({ lat: resource.location.lat, lng: resource.location.lng });
        }
      }
    }
  }, [searchParams, initialData]);

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
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/')}>
          <div className="relative w-9 h-9 transition-transform group-hover:scale-110">
            <Image src="/daegu_logo.png" alt="EduMaps Logo" fill className="object-contain rounded-full" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">EduMaps</h1>
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
        >
          <Info className="w-4 h-4" /> 이용방법
        </button>
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
        <div className={`absolute top-24 left-4 z-10 w-full max-w-[340px] transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}`}>
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
            <div className="p-7 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  {activeTab === "OFFLINE" ? "체험 장소" : activeTab === "ONLINE" ? "온라인 자원" : "로드맵"}
                  <span className="text-emerald-500 text-base ml-2">{filteredResources.length}</span>
                </h2>
                <button onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-1 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeTab === "GRADE" && [1, 2, 3, 4, 5, 6].map(grade => (
                  <button key={grade} onClick={() => setSelectedGrade(grade === selectedGrade ? null : grade)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedGrade === grade ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{grade}학년</button>
                ))}
                {activeTab === "OFFLINE" && ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"].map(region => (
                  <button key={region} onClick={() => setSelectedCategory(region === selectedCategory ? null : region)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedCategory === region ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{region}</button>
                ))}
                {activeTab === "ONLINE" && ["언어", "수리", "디지털", "과학", "예체능", "자료검색"].map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${selectedCategory === cat ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3 custom-scrollbar">
              {activeTab === "GRADE" && selectedGrade === null ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">학년을 선택해 주세요</h3>
                    <p className="text-xs text-slate-500 mt-1">학년별 맞춤 로드맵이 준비되어 있습니다.</p>
                  </div>
                </div>
              ) : filteredResources.length === 0 ? (
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
                    className={`group p-4 rounded-3xl transition-all cursor-pointer border ${selectedResource?.id === resource.id ? "bg-emerald-50 border-emerald-200 shadow-md" : "bg-white border-transparent hover:bg-slate-50 hover:shadow-sm"}`}
                  >
                    <div className="flex gap-4">
                      {resource.image_url && (
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                          <Image src={resource.image_url} alt={resource.title} fill className="object-cover group-hover:scale-110 transition-transform" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors line-clamp-1">{resource.title}</h3>
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
          <div className="absolute top-24 right-4 z-20 w-[calc(100%-2rem)] sm:w-[350px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col max-h-[80vh]">
            {/* Top Image Banner */}
            {selectedResource.image_url && (
              <div className="relative w-full h-48 shrink-0">
                <Image src={selectedResource.image_url} alt={selectedResource.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button onClick={() => setSelectedResource(null)} className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-6">
                  <span className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-md mb-2 inline-block">
                    {selectedResource.type === "OFFLINE" ? "현장체험" : "온라인학습"}
                  </span>
                  <h2 className="text-xl font-black text-white drop-shadow-md">{selectedResource.title}</h2>
                </div>
              </div>
            )}

            {/* Header without Image */}
            {!selectedResource.image_url && (
              <div className="p-6 pb-0 flex justify-between items-start shrink-0">
                <div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md mb-2 inline-block">
                    {selectedResource.type === "OFFLINE" ? "현장체험" : "온라인학습"}
                  </span>
                  <h2 className="text-xl font-black text-slate-900">{selectedResource.title}</h2>
                </div>
                <button onClick={() => setSelectedResource(null)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">{selectedResource.category}</span>
                {selectedResource.tags?.map((tag: string) => (
                  <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>

              {/* Roadmap Link Button in Offline/Online View */}
              {activeTab !== "GRADE" && selectedResource.grade_topics?.length > 0 && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs font-black">이 장소와 관련된 로드맵이 있습니다</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.grade_topics.map((gt: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          // 학년과 리소스 ID를 URL 파라미터에 담아 이동
                          handleTabChange("roadmap", `grade=${gt.grade}&id=${selectedResource.id}`);
                        }}
                        className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-400 hover:text-white hover:border-emerald-400 transition-all shadow-sm active:scale-95"
                      >
                        {gt.grade}학년 로드맵 보기
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "GRADE" && selectedGrade && selectedResource.grade_topics?.find((gt: any) => gt.grade === selectedGrade) ? (
                <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">{selectedGrade}</div>
                      <span className="text-sm font-black text-emerald-800">학년 학습 로드맵</span>
                    </div>
                    <div className="flex gap-1">
                      {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).subject && (
                        <span className="px-2 py-1 bg-white border border-emerald-200 text-emerald-600 text-[10px] font-bold rounded-md shadow-sm">
                          {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).subject}
                        </span>
                      )}
                      {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).month && (
                        <span className="px-2 py-1 bg-white border border-emerald-200 text-emerald-600 text-[10px] font-bold rounded-md shadow-sm">
                          {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).month}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800 mb-1">“{selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).topic_title}”</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).description}</p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="bg-white/60 p-3 rounded-2xl">
                      <h5 className="text-[11px] font-black text-emerald-700 flex items-center gap-1.5 mb-2"><Info className="w-3.5 h-3.5" /> 탐구 질문</h5>
                      <ul className="space-y-1.5">
                        {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).inquiry_questions?.map((q: string, i: number) => (
                          <li key={i} className="text-[11px] text-slate-600 flex gap-2">
                            <span className="text-emerald-400">•</span> {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white/60 p-3 rounded-2xl">
                      <h5 className="text-[11px] font-black text-emerald-700 flex items-center gap-1.5 mb-2"><History className="w-3.5 h-3.5" /> 사후 활동</h5>
                      <ul className="space-y-1.5">
                        {selectedResource.grade_topics.find((gt: any) => gt.grade === selectedGrade).post_activities?.map((a: string, i: number) => (
                          <li key={i} className="text-[11px] text-slate-600 flex gap-2">
                            <span className="text-emerald-400">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">장소 소개</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedResource.description || "상세 설명이 등록되어 있지 않습니다."}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {selectedResource.recommended_grade?.length > 0 && (
                  <div className="w-full flex items-center gap-2 text-[11px] text-slate-400 font-bold mt-2">
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                    <span>권장 학년: {selectedResource.recommended_grade.join(', ')}학년</span>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 mt-auto shrink-0">
              <div className="grid grid-cols-2 gap-3">
                {selectedResource.external_url && (
                  <a href={selectedResource.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                    <ExternalLink className="w-4 h-4" /> 웹사이트
                  </a>
                )}
                {selectedResource.type === "OFFLINE" && (
                  <button
                    onClick={() => {
                      const url = `https://map.kakao.com/link/to/${selectedResource.title},${selectedResource.location.lat},${selectedResource.location.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-2xl text-xs font-black hover:bg-emerald-400 transition-all shadow-lg active:scale-95 shadow-emerald-200"
                  >
                    <Navigation className="w-4 h-4" /> 길찾기
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Info Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Map className="w-6 h-6 text-emerald-500" /> EduMaps 가이드
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-emerald-500" /> 사용법
                </h3>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed space-y-2">
                  <p><b>1. 탭 탐색하기:</b> 상단의 탭을 눌러 체험학습, 온라인, 또는 학년별 로드맵을 확인할 수 있습니다.</p>
                  <p><b>2. 학년별 필터링:</b> '학년별 로드맵' 탭에서는 원하는 학년 버튼을 눌러 맞춤형 정보를 얻어보세요.</p>
                  <p><b>3. 지도와 리스트 연동:</b> 리스트에서 카드를 클릭하거나 지도에서 마커를 클릭하면 해당 장소의 상세한 정보를 볼 수 있습니다.</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-emerald-500" /> 소중한 의견을 들려주세요
                </h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed">EduMaps는 선생님들과 학생들을 위해 계속해서 발전하고 있습니다. 사용 중 불편한 점이나 추가되었으면 하는 장소가 있다면 아래 &apos;의견 남기기&apos;를 통해 알려주세요!</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <History className="w-5 h-5 text-emerald-500" /> 최근 업데이트 내용
                </h3>
                <p className="text-[11px] text-slate-400 mb-4 ml-7 font-medium italic">데이터 최종 갱신: {updatedTime}</p>

                <ul className="text-sm text-slate-600 space-y-3 border-l-2 border-slate-200 ml-2 pl-4">
                  <li className="relative">
                    <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>
                    <strong className="text-slate-800">2026.05.04</strong> - 사용성 및 업데이트 방식을 개선하였습니다.
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-300 border-2 border-white shadow-sm"></span>
                    <strong className="text-slate-800">2026.05.03</strong> - 사이트를 처음 만들었습니다.
                  </li>
                </ul>
              </section>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <a href="https://www.dge.go.kr/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Image src="/daegu_logo.png" alt="대구교육청" width={60} height={60} className="object-contain" />
                </a>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const url = window.location.origin;
                    if (navigator.share) {
                      navigator.share({
                        title: 'EduMaps - 대구 에듀테크 지도',
                        text: '대구의 체험학습과 온라인 학습 자원을 한눈에 확인하세요!',
                        url: url,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(url).then(() => {
                        alert('사이트 주소가 복사되었습니다.');
                      });
                    }
                  }}
                  className="px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold rounded-full hover:bg-emerald-100 transition-colors text-sm flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4 rotate-45" /> 공유하기
                </button>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSdFO6QElrq-wHApWi8RUl6bDhlGDJC_IuRHIPyWvl5f9sGenA/viewform" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-50 transition-colors text-sm">의견 남기기</a>
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-800 text-white font-semibold rounded-full hover:bg-slate-700 transition-colors text-sm">닫기</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
