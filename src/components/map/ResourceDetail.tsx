"use client";

import { BookOpen, ExternalLink, History, Lightbulb, Lock, Navigation, X } from "lucide-react";
import type { Resource } from "../../lib/resourceTypes";
import { categoryTone, gradeLabel, placeTheme, requiresLogin, topicGrades, visibleTags, type TabKey } from "../../lib/catalog";
import { renderRichText } from "../../lib/richText";
import { trackResourceStat } from "../../lib/trackResourceStat";
import ResourceThumb from "./ResourceThumb";

interface Props {
  resource: Resource;
  tab: TabKey;
  selectedGrade: number | null;
  onGradeChange: (grade: number) => void;
  onClose: () => void;
  onOpenRoadmap: (resource: Resource, grade: number) => void;
}

// 상세 내용. 위치(오른쪽 패널·하단 시트·가운데 창)는 감싸는 쪽이 정한다.
export default function ResourceDetail({ resource, tab, selectedGrade, onGradeChange, onClose, onOpenRoadmap }: Props) {
  const isOffline = resource.type === "OFFLINE";
  const topics = resource.grade_topics || [];
  const grades = topicGrades(resource);
  const showRoadmap = tab === "roadmap" && selectedGrade !== null && topics.some((gt) => gt.grade === selectedGrade);
  const matching = showRoadmap ? topics.filter((gt) => gt.grade === selectedGrade) : [];
  const tone = categoryTone(resource.category);
  const label = gradeLabel(resource);

  const openDirections = () => {
    const { lat, lng } = resource.location;
    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(resource.title)},${lat},${lng}`, "_blank", "noopener");
  };

  return (
    <div className="flex max-h-full min-h-0 flex-col">
      {/* 머리: 사진 + 제목 */}
      <div className="relative h-36 shrink-0 sm:h-44">
        <ResourceThumb resource={resource} className="h-full w-full" sizes="(max-width: 640px) 100vw, 440px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <button
          type="button"
          onClick={onClose}
          aria-label="상세 닫기"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="absolute inset-x-5 bottom-4">
          <span className="mb-1.5 inline-block rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-white">
            {isOffline ? "현장체험" : "온라인 학습"}
          </span>
          <h2 id="resource-detail-title" className="text-xl font-extrabold leading-snug text-white drop-shadow sm:text-2xl">
            {resource.title}
          </h2>
        </div>
      </div>

      {/* 본문 */}
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${isOffline ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" : `${tone.soft} ${tone.text}`}`}>
            {isOffline && <span className="h-2 w-2 rounded-full" style={{ background: placeTheme(resource).color }} aria-hidden />}
            {resource.category}
          </span>
          {requiresLogin(resource) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[13px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <Lock className="h-3.5 w-3.5" aria-hidden /> 로그인 필요
            </span>
          )}
          {visibleTags(resource).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[13px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              #{tag}
            </span>
          ))}
        </div>

        {!showRoadmap && (
          <>
            <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
              {resource.description || "상세 설명이 등록되어 있지 않습니다."}
            </p>
            {label && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">권장 학년</span>
                <span className="ml-2 rounded-full bg-brand-soft px-2.5 py-0.5 font-bold text-emerald-700 dark:bg-brand-soft-dark dark:text-emerald-300">{label}</span>
              </p>
            )}
          </>
        )}

        {showRoadmap && (
          <section aria-label="학년별 로드맵" className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            {grades.length > 1 && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="학년 선택">
                {grades.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onGradeChange(g)}
                    aria-pressed={selectedGrade === g}
                    className={`h-8 rounded-full px-3 text-[13px] font-bold transition-colors ${
                      selectedGrade === g
                        ? "bg-brand text-white"
                        : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
                    }`}
                  >
                    {g}학년
                  </button>
                ))}
              </div>
            )}
            {matching.map((gt, idx) => (
              <article key={`${gt.grade}-${idx}`} className={idx > 0 ? "border-t border-emerald-100 pt-4 dark:border-emerald-900" : ""}>
                <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
                  <span className="rounded-full bg-brand px-2.5 py-0.5 text-white">
                    {gt.grade}학년{matching.length > 1 ? ` (${idx + 1}/${matching.length})` : ""}
                  </span>
                  {gt.subject && <span className="rounded-full bg-white px-2.5 py-0.5 text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">{gt.subject}</span>}
                  {gt.month && <span className="rounded-full bg-white px-2.5 py-0.5 text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">{gt.month}</span>}
                </div>
                <h3 className="text-lg font-extrabold leading-snug text-slate-900 dark:text-slate-50">“{gt.topic_title}”</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{renderRichText(gt.description)}</p>
                <TopicList icon={<Lightbulb className="h-4 w-4" aria-hidden />} title="탐구 질문" items={gt.inquiry_questions} />
                <TopicList icon={<History className="h-4 w-4" aria-hidden />} title="사후 활동" items={gt.post_activities} />
              </article>
            ))}
          </section>
        )}

        {tab !== "roadmap" && grades.length > 0 && (
          <section aria-label="학년별 로드맵 바로가기">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <BookOpen className="h-4 w-4" aria-hidden /> 학년별 로드맵
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {grades.map((g) => {
                const title = topics.find((gt) => gt.grade === g)?.topic_title;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onOpenRoadmap(resource, g)}
                    className="flex flex-col items-start rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60"
                  >
                    <span className="text-[15px] font-extrabold text-emerald-700 dark:text-emerald-300">{g}학년</span>
                    {title && <span className="line-clamp-1 text-xs font-medium text-emerald-800/80 dark:text-emerald-300/80">{title}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* 하단 고정 버튼: 본문을 가리지 않도록 별도 영역에 둔다 */}
      <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900">
        {resource.external_url && (
          <a
            href={resource.external_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackResourceStat(resource.id, "download")}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 text-[15px] font-bold text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> 웹사이트
          </a>
        )}
        {isOffline && (
          <button
            type="button"
            onClick={openDirections}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
          >
            <Navigation className="h-4 w-4" aria-hidden /> 길찾기
          </button>
        )}
      </div>
    </div>
  );
}

function TopicList({ icon, title, items }: { icon: React.ReactNode; title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3 rounded-xl bg-white/80 p-3.5 dark:bg-slate-900/60">
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
        {icon} {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((text, i) => (
          <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
            <span>{renderRichText(text)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
