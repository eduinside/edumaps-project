"use client";

import { useState } from "react";
import { Check, ChevronDown, HelpCircle, History, Info, Map, MessageSquarePlus, Send, X } from "lucide-react";
import { mediaUrl } from "../lib/media";
import Dialog from "./ui/Dialog";

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

// 변경이력 데이터가 비어 있을 때의 폴백
const DEFAULT_CHANGELOG: ChangelogEntry[] = [
  { date: "2026.06.24", text: "학년별 로드맵 본문에 관련 자료 링크를 추가했습니다." },
  { date: "2026.06.01", text: "검색창 아래 바로가기 아이콘과 추천 자료 홍보 캐러셀이 추가되었습니다." },
  { date: "2026.05.19", text: "내 근처 필터·지역 필터 시 지도 자동 이동, 로드맵 연계 버튼 개선, 학년 간 전환 기능이 추가되었습니다." },
  { date: "2026.05.08", text: "온라인 탭 UI 개선 및 학년 표시 통합으로 더 나은 사용 경험을 제공합니다." },
  { date: "2026.05.04", text: "랜딩페이지에서 학년 미선택 시에도 모든 학년 자료를 표시하도록 개선했습니다." },
  { date: "2026.05.03", text: "사이트를 처음 만들었습니다." },
];

export default function HowToModal({ isOpen, onClose, updatedTime, changelog }: HowToModalProps) {
  const entries = changelog && changelog.length > 0 ? changelog : DEFAULT_CHANGELOG;
  const [copied, setCopied] = useState(false);

  const share = () => {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: "대구 에듀맵스 - 대구 에듀테크 지도", text: "대구의 체험학습과 온라인 학습 자원을 한눈에 확인하세요!", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} labelledBy="howto-title" className="max-w-2xl">
      <div className="flex max-h-[min(88dvh,900px)] flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 id="howto-title" className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-slate-50">
            <Map className="h-6 w-6 text-brand" aria-hidden /> 대구 에듀맵스 이용방법
          </h2>
          <button type="button" onClick={onClose} aria-label="이용방법 닫기" className="grid h-10 w-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-7 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="mb-2.5 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Info className="h-5 w-5 text-brand" aria-hidden /> 사용법
            </h3>
            <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-[15px] leading-relaxed text-slate-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-slate-300">
              <p><b>1. 탭 탐색하기:</b> 상단의 탭을 눌러 체험학습, 온라인, 또는 학년별 로드맵을 확인할 수 있습니다.</p>
              <p><b>2. 학년별 필터링:</b> 학년별 로드맵 탭에서는 원하는 학년 버튼을 눌러 맞춤형 정보를 얻어보세요.</p>
              <p><b>3. 지도와 리스트 연동:</b> 리스트에서 카드를 클릭하거나 지도에서 마커를 클릭하면 해당 장소의 상세한 정보를 볼 수 있습니다.</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2.5 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <HelpCircle className="h-5 w-5 text-brand" aria-hidden /> 소중한 의견을 들려주세요
            </h3>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                대구 에듀맵스는 대구광역시교육청의 사교육비 줄이기 대책의 일환으로 &apos;초등 자기주도학습 정보모아&apos; 팀에서 개발하였습니다.
                <br />
                자료 사용 중 불편한 점이나 추가되었으면 하는 장소가 있다면 아래 &apos;의견 보내기&apos;를 통해 알려주세요!
              </p>
              <FeedbackForm />
            </div>
          </section>

          {updatedTime && (
            <section>
              <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <History className="h-5 w-5 text-brand" aria-hidden /> 최근 업데이트 내용
              </h3>
              <p className="mb-4 ml-7 text-[13px] text-slate-500 dark:text-slate-400">데이터 최종 갱신: {updatedTime}</p>
              <ul className="ml-2 space-y-3 border-l-2 border-slate-200 pl-4 text-[15px] text-slate-700 dark:border-slate-700 dark:text-slate-300">
                {entries.map((entry, idx) => (
                  <li key={`${entry.date}-${idx}`} className="relative">
                    <span
                      className={`absolute -left-[21px] top-2 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${idx === entries.length - 1 ? "bg-slate-300 dark:bg-slate-600" : "bg-brand"}`}
                      aria-hidden
                    />
                    <strong className="text-slate-900 dark:text-slate-100">{entry.date}</strong> - {entry.text}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <a href="https://www.dge.go.kr/" target="_blank" rel="noopener noreferrer" className="shrink-0 hover:opacity-80" aria-label="대구광역시교육청 누리집">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl("daegu_logo.webp")} alt="" width={48} height={48} className="object-contain" />
          </a>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={share}
              className="h-10 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {copied ? "주소 복사됨" : "공유하기"}
            </button>
            <button type="button" onClick={onClose} className="h-10 rounded-full bg-slate-800 px-5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
              닫기
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

const KINDS = ["정보 수정", "장소·자료 추천", "기능 제안", "기타 의견"];

// 의견 보내기: /api/feedback(Cloudflare Pages Function) → Resend로 운영자 메일에 전달. 사이트에는 저장하지 않는다.
function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error ?? "보내지 못했어요. 잠시 뒤 다시 시도해 주세요.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "보내지 못했어요. 잠시 뒤 다시 시도해 주세요.");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[15px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        <Check className="h-5 w-5" aria-hidden /> 보내 주셔서 고맙습니다. 확인 후 반영하겠습니다.
      </p>
    );
  }

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="feedback-form"
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-hover"
      >
        <MessageSquarePlus className="h-4 w-4" aria-hidden /> 의견 보내기
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <form id="feedback-form" onSubmit={submit} className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1">
          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">유형</legend>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k, i) => (
                <label
                  key={k}
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 has-[:checked]:border-brand has-[:checked]:bg-emerald-50 has-[:checked]:font-bold has-[:checked]:text-emerald-800 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:has-[:checked]:bg-emerald-950/50 dark:has-[:checked]:text-emerald-200"
                >
                  <input type="radio" name="kind" value={k} defaultChecked={i === 0} className="sr-only" /> {k}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-800 dark:text-slate-200">내용</span>
            <textarea name="message" required minLength={5} maxLength={3000} rows={5} className={field} placeholder="어떤 장소·자료의 어떤 내용이 다른지, 추천하고 싶은 곳이나 바라는 점을 적어 주세요." />
          </label>
          {/* 봇이 채우는 숨은 칸(허니팟) */}
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={state === "sending"}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden /> {state === "sending" ? "보내는 중…" : "보내기"}
          </button>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            적어 주신 내용은 이메일 발송 서비스(Resend)를 거쳐 운영자 메일로만 전달되며 사이트에 저장하지 않습니다. 이름·연락처 같은 개인정보는 적지 말아 주세요.
          </p>
        </form>
      )}
    </>
  );
}
