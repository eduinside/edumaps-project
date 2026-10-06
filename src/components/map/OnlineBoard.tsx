"use client";

import { useMemo } from "react";
import { Lock } from "lucide-react";
import type { Resource } from "../../lib/resourceTypes";
import { GRADES, ONLINE_CATEGORIES, categoryTone, gradeLabel, gradesOf, requiresLogin, visibleTags } from "../../lib/catalog";
import Chip from "../ui/Chip";
import ResourceThumb from "./ResourceThumb";

interface Props {
  resources: Resource[];
  category: string | null;
  grade: number | null;
  selectedId: string | null;
  onCategoryChange: (category: string | null) => void;
  onGradeChange: (grade: number | null) => void;
  onSelect: (resource: Resource) => void;
}

// 온라인 탭: 분야별 묶음은 그대로 두고, 화면 폭에 맞춰 카드 격자로 보여 준다.
export default function OnlineBoard({ resources, category, grade, selectedId, onCategoryChange, onGradeChange, onSelect }: Props) {
  const online = useMemo(() => resources.filter((r) => r.type === "ONLINE"), [resources]);
  const filtered = useMemo(
    () => online.filter((r) => (!category || r.category === category) && (grade === null || gradesOf(r).includes(grade))),
    [online, category, grade]
  );
  const sections = (category ? [category] : ONLINE_CATEGORIES)
    .map((c) => ({ category: c, items: filtered.filter((r) => r.category === c) }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-slate-50/95 dark:bg-slate-950/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">온라인 학습</h1>
          <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white" aria-label={`${filtered.length}개`}>
            {filtered.length}
          </span>
        </div>
        <div className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5" role="group" aria-label="분야">
          <Chip selected={category === null} onClick={() => onCategoryChange(null)}>전체</Chip>
          {ONLINE_CATEGORIES.map((c) => {
            const tone = categoryTone(c);
            return (
              <Chip key={c} selected={category === c} onClick={() => onCategoryChange(category === c ? null : c)} selectedClass={tone.solid} idleClass={`${tone.soft} ${tone.text} hover:brightness-95`}>
                {c}
              </Chip>
            );
          })}
        </div>
        <div className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5" role="group" aria-label="학년">
          <Chip size="sm" selected={grade === null} onClick={() => onGradeChange(null)}>모든 학년</Chip>
          {GRADES.map((g) => (
            <Chip key={g} size="sm" selected={grade === g} onClick={() => onGradeChange(grade === g ? null : g)}>
              {g}학년
            </Chip>
          ))}
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-slate-100 py-16 text-center text-[15px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">해당 조건의 자료가 없습니다.</p>
      ) : (
        sections.map(({ category: c, items }) => {
          const tone = categoryTone(c);
          return (
            <section key={c} className="mt-6" aria-labelledby={`online-${c}`}>
              <h2 id={`online-${c}`} className="mb-3 flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden />
                {c}
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{items.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(r)}
                    aria-current={selectedId === r.id ? "true" : undefined}
                    className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-slate-800 dark:bg-slate-900 sm:flex-col"
                  >
                    <ResourceThumb resource={r} className="h-16 w-16 shrink-0 rounded-xl sm:aspect-[16/9] sm:h-auto sm:w-full" sizes="(max-width: 640px) 64px, 300px" />
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-[15px] font-bold text-slate-900 group-hover:text-brand dark:text-slate-100 dark:group-hover:text-emerald-400">{r.title}</h3>
                      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate-600 dark:text-slate-400">{r.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {requiresLogin(r) && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                            <Lock className="h-3 w-3" aria-hidden /> 로그인 필요
                          </span>
                        )}
                        {gradeLabel(r) && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{gradeLabel(r)}</span>}
                        {visibleTags(r).slice(0, 2).map((t) => (
                          <span key={t} className="text-xs text-slate-500 dark:text-slate-400">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
