"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Download, MonitorPlay, PlayCircle } from "lucide-react";
import VideoModal from "./VideoModal";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface Slide {
  id: string;
  type: "promo" | "download" | "video";
  title: string;
  subtitle?: string;
  bgImage?: string;
  linkUrl?: string;
  linkLabel?: string;
  fileUrl?: string;
  videoId?: string;
  featured?: boolean;
}

const AUTOPLAY_MS = 4000;
const TEXT_SHADOW = { textShadow: "0 1px 4px rgba(0,0,0,0.55)" };
const OVERLAY = "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55))";

function getExtension(url?: string): string {
  if (!url) return "";
  const clean = url.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

// GA4 표준 다운로드 이벤트 전송
function trackDownload(slide: Slide) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "file_download", {
    file_name: slide.title,
    file_id: slide.id,
    file_extension: getExtension(slide.fileUrl),
    link_url: slide.fileUrl,
  });
}

function trackVideoClick(slide: Slide, target: "app" | "modal") {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "video_click", {
    video_title: slide.title,
    video_id: slide.videoId,
    open_target: target,
  });
}

// 유튜브 앱으로 바로 연결하기 위한 모바일 기기 판별 (레이아웃 반응형과는 별개로 클릭 시점에만 사용)
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function SlideBody({ slide }: { slide: Slide }) {
  const isDownload = slide.type === "download";
  const isVideo = slide.type === "video";
  const fallback = isDownload
    ? "linear-gradient(135deg, #059669, #0ea5e9)"
    : isVideo
      ? "linear-gradient(135deg, #e11d48, #f97316)"
      : "linear-gradient(135deg, #0ea5e9, #6366f1)";
  const backgroundImage = slide.bgImage
    ? `${OVERLAY}, url("${encodeURI(slide.bgImage)}")`
    : `${OVERLAY}, ${fallback}`;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage }}
      />
      <div className="relative h-full flex flex-col justify-end px-14 sm:px-16 py-5 sm:py-6">
        <span className="absolute top-4 left-14 sm:left-16 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white bg-white/20 backdrop-blur-sm">
          {isDownload ? (
            <><Download className="w-3 h-3" />자료실</>
          ) : isVideo ? (
            <><PlayCircle className="w-3 h-3" />영상</>
          ) : (
            <><MonitorPlay className="w-3 h-3" />온라인</>
          )}
        </span>
        <h3 className="text-white font-black text-base sm:text-lg leading-snug line-clamp-1" style={TEXT_SHADOW}>
          {slide.title}
        </h3>
        {slide.subtitle && (
          <p className="text-white/90 text-xs sm:text-sm line-clamp-1 mt-0.5" style={TEXT_SHADOW}>
            {slide.subtitle}
          </p>
        )}
        <span className="mt-2.5 inline-flex w-fit items-center gap-1 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-md group-hover:bg-emerald-50 transition-colors">
          {isDownload ? (
            <>다운로드 <Download className="w-3.5 h-3.5" /></>
          ) : isVideo ? (
            <>영상보기 <PlayCircle className="w-3.5 h-3.5" /></>
          ) : (
            <>{slide.linkLabel || "바로가기"} <ArrowRight className="w-3.5 h-3.5" /></>
          )}
        </span>
      </div>
    </div>
  );
}

function CarouselSlide({ slide, onOpenVideo }: { slide: Slide; onOpenVideo: (slide: Slide) => void }) {
  const slideClass = "block min-w-full w-full shrink-0 h-full group";

  if (slide.type === "download") {
    return (
      <a href={encodeURI(slide.fileUrl || "")} download onClick={() => trackDownload(slide)} className={slideClass}>
        <SlideBody slide={slide} />
      </a>
    );
  }

  if (slide.type === "video") {
    const videoId = slide.videoId || "";
    return (
      <a
        href={`https://www.youtube.com/shorts/${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          // 모바일은 유튜브 앱(딥링크)으로, 데스크탑은 모달 재생으로 분기
          if (isMobileDevice()) {
            trackVideoClick(slide, "app");
            return;
          }
          e.preventDefault();
          trackVideoClick(slide, "modal");
          onOpenVideo(slide);
        }}
        className={slideClass}
      >
        <SlideBody slide={slide} />
      </a>
    );
  }

  const href = slide.linkUrl || "#";
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={slideClass}>
        <SlideBody slide={slide} />
      </a>
    );
  }
  return (
    <Link href={href} className={slideClass}>
      <SlideBody slide={slide} />
    </Link>
  );
}

function CarouselSkeleton() {
  return (
    <section className="mt-8 mb-10">
      <div className="relative h-40 sm:h-44 rounded-3xl bg-slate-200 dark:bg-slate-700 border border-slate-100 dark:border-slate-700 animate-pulse">
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeCarousel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/banners/carousel.json")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: Slide[] = Array.isArray(data) ? data : data.slides || [];
        setSlides(list.filter((s) => s && s.featured !== false));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const count = slides.length;
  const videoSlides = slides.filter((s) => s.type === "video");

  const go = useCallback(
    (next: number) => {
      setCurrent((c) => (count === 0 ? 0 : (next + count) % count));
    },
    [count],
  );

  // 자동 슬라이드 (현재 슬라이드 변경 시 타이머 리셋, 호버 시 일시정지)
  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [current, count, paused]);

  if (loading) return <CarouselSkeleton />;
  if (count === 0) return null;

  const openVideo = (slide: Slide) => {
    const idx = videoSlides.findIndex((s) => s.id === slide.id);
    if (idx >= 0) setVideoIndex(idx);
  };

  const goVideo = (delta: number) => {
    setVideoIndex((i) => (i === null || videoSlides.length === 0 ? i : (i + delta + videoSlides.length) % videoSlides.length));
  };

  const activeVideo = videoIndex !== null ? videoSlides[videoIndex] : null;

  return (
    <>
      <section className="mt-8 mb-10" aria-label="추천 자료 배너">
        <div
          className="relative overflow-hidden rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-40 sm:h-44"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((slide) => (
              <CarouselSlide key={slide.id} slide={slide} onOpenVideo={openVideo} />
            ))}
          </div>

          {count > 1 && (
            <>
              <button
                onClick={() => go(current - 1)}
                aria-label="이전 배너"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => go(current + 1)}
                aria-label="다음 배너"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrent(i)}
                    aria-label={`${i + 1}번째 배너로 이동`}
                    className={`h-2 rounded-full transition-all ${i === current ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <VideoModal
        isOpen={!!activeVideo}
        onClose={() => setVideoIndex(null)}
        videoId={activeVideo?.videoId || ""}
        title={activeVideo?.title || ""}
        onPrev={() => goVideo(-1)}
        onNext={() => goVideo(1)}
        hasMultiple={videoSlides.length > 1}
      />
    </>
  );
}
