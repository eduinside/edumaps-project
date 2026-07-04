"use client";

import { X, Map, Info, HelpCircle, History } from "lucide-react";
import { mediaUrl } from "../lib/media";

interface ChangelogEntry {
  date: string;
  text: string;
}

interface HowToModalProps {
  isOpen: boolean;
  onClose: () => void;
  updatedTime?: string;
  changelog?: ChangelogEntry[];
}

// '변경이력' 시트가 비어있거나 아직 없을 때의 폴백 (시트 데이터가 있으면 그쪽 우선)
const DEFAULT_CHANGELOG: ChangelogEntry[] = [
  { date: "2026.06.24", text: "학년별 로드맵 본문에 관련 자료 링크를 추가했습니다." },
  { date: "2026.06.01", text: "검색창 아래 바로가기 아이콘과 추천 자료 홍보 캐러셀이 추가되었습니다." },
  { date: "2026.05.19", text: "내 근처 필터·지역 필터 시 지도 자동 이동, 로드맵 연계 버튼 개선, 학년 간 전환 기능이 추가되었습니다." },
  { date: "2026.05.08", text: "온라인 탭 UI 개선 및 학년 표시 통합으로 더 나은 사용 경험을 제공합니다." },
  { date: "2026.05.04", text: "랜딩페이지에서 학년 미선택 시에도 모든 학년 자료를 표시하도록 개선했습니다." },
  { date: "2026.05.03", text: "사이트를 처음 만들었습니다." },
];

export default function HowToModal({ isOpen, onClose, updatedTime, changelog }: HowToModalProps) {
  if (!isOpen) return null;

  const entries = changelog && changelog.length > 0 ? changelog : DEFAULT_CHANGELOG;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Map className="w-6 h-6 text-emerald-500" /> 대구 에듀맵스 이용방법
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-emerald-500" /> 사용법
            </h3>
            <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
              <p><b>1. 탭 탐색하기:</b> 상단의 탭을 눌러 체험학습, 온라인, 또는 학년별 로드맵을 확인할 수 있습니다.</p>
              <p><b>2. 학년별 필터링:</b> 학년별 로드맵 탭에서는 원하는 학년 버튼을 눌러 맞춤형 정보를 얻어보세요.</p>
              <p><b>3. 지도와 리스트 연동:</b> 리스트에서 카드를 클릭하거나 지도에서 마커를 클릭하면 해당 장소의 상세한 정보를 볼 수 있습니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-emerald-500" /> 소중한 의견을 들려주세요
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-100 dark:border-slate-600">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">대구 에듀맵스는 대구광역시교육청의 사교육비 줄이기 대책의 일환으로 '초등 자기주도학습 정보모아' 팀에서 개발하였습니다. <br></br>자료 사용 중 불편한 점이나 추가되었으면 하는 장소가 있다면 아래 '의견 남기기'를 통해 알려주세요!</p>
            </div>
          </section>

          {updatedTime && (
            <section>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                <History className="w-5 h-5 text-emerald-500" /> 최근 업데이트 내용
              </h3>
              <p className="text-[11px] text-slate-400 mb-4 ml-7 font-medium italic">데이터 최종 갱신: {updatedTime}</p>

              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-3 border-l-2 border-slate-200 dark:border-slate-600 ml-2 pl-4">
                {entries.map((entry, idx) => (
                  <li key={`${entry.date}-${idx}`} className="relative">
                    <span
                      className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${idx === entries.length - 1 ? "bg-slate-300" : "bg-emerald-500"
                        }`}
                    ></span>
                    <strong className="text-slate-800 dark:text-slate-100">{entry.date}</strong> - {entry.text}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex flex-row items-center justify-between gap-3">
          <a href="https://www.dge.go.kr/" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={mediaUrl("daegu_logo.webp")} alt="대구교육청" width={60} height={60} className="object-contain" />
          </a>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => {
                const url = window.location.origin;
                if (navigator.share) {
                  navigator.share({
                    title: '대구 에듀맵스 - 대구 에듀테크 지도',
                    text: '대구의 체험학습과 온라인 학습 자원을 한눈에 확인하세요!',
                    url: url,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(url).then(() => {
                    alert('사이트 주소가 복사되었습니다.');
                  });
                }
              }}
              className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 font-bold rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-sm flex items-center gap-1.5"
            >
              공유하기
            </button>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdFO6QElrq-wHApWi8RUl6bDhlGDJC_IuRHIPyWvl5f9sGenA/viewform" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-slate-600 dark:text-slate-200 font-bold rounded-full hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors text-sm">의견 남기기</a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-full hover:bg-slate-700 transition-colors text-sm"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
