"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Download, MonitorPlay, PlayCircle, Pause, Play } from "lucide-react";
import VideoModal from "./VideoModal";
import carouselData from "../../public/banners/carousel.json";

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

// 빌드 시점에 JSON을 넣어 정적 HTML에 배너가 바로 그려지게 한다(public/banners/carousel.json은 그대로 관리)
const SLIDES: Slide[] = ((carouselData as { slides?: Slide[] }).slides || []).filter((s) => s && s.featured !== false);

const AUTOPLAY_MS = 5000;
const TEXT_SHADOW = { textShadow: "0 1px 4px rgba(0,0,0,0.55)" };
const OVERLAY = "linear-gradient(rgba(0,0,0,0.40), rgba(0,0,0,0.60))";

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

// 유튜브 앱으로 바로 연결하기 위한 모바일 기기 판별 (클릭 시점에만 사용)
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
  const backgroundImage = slide.bgImage ? `${OVERLAY}, url("${encodeURI(slide.bgImage)}")` : `${OVERLAY}, ${fallback}`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage }} />
      <div className="relative flex h-full flex-col justify-end px-14 py-5 sm:px-16 sm:py-6">
        <span className="absolute left-14 top-4 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm sm:left-16">
          {isDownload ? (
            <><Download className="h-3.5 w-3.5" aria-hidden />자료실</>
          ) : isVideo ? (
            <><PlayCircle className="h-3.5 w-3.5" aria-hidden />영상</>
          ) : (
            <><MonitorPlay className="h-3.5 w-3.5" aria-hidden />온라인</>
          )}
        </span>
        <h3 className="line-clamp-1 text-base font-extrabold leading-snug text-white sm:text-lg" style={TEXT_SHADOW}>
          {slide.title}
        </h3>
        {slide.subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[13px] text-white/90 sm:text-sm" style={TEXT_SHADOW}>
            {slide.subtitle}
          </p>
        )}
        <span className="mt-2.5 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-slate-900 shadow-md transition-colors group-hover:bg-emerald-50">
          {isDownload ? (
            <>다운로드 <Download className="h-3.5 w-3.5" aria-hidden /></>
          ) : isVideo ? (
            <>영상보기 <PlayCircle className="h-3.5 w-3.5" aria-hidden /></>
          ) : (
            <>{slide.linkLabel || "바로가기"} <ArrowRight className="h-3.5 w-3.5" aria-hidden /></>
          )}
        </span>
      </div>
    </div>
  );
}

function CarouselSlide({ slide, active, onOpenVideo }: { slide: Slide; active: boolean; onOpenVideo: (slide: Slide) => void }) {
  const slideClass = "block h-full w-full min-w-full shrink-0 group focus-visible:outline-none";
  // 보이지 않는 슬라이드는 키보드 포커스·화면낭독기에서 뺀다
  const common = { className: slideClass, tabIndex: active ? 0 : -1, "aria-hidden": !active || undefined, draggable: false };

  if (slide.type === "download") {
    return (
      <a href={encodeURI(slide.fileUrl || "")} download onClick={() => trackDownload(slide)} {...common}>
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
        {...common}
      >
        <SlideBody slide={slide} />
      </a>
    );
  }

  const href = slide.linkUrl || "#";
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...common}>
        <SlideBody slide={slide} />
      </a>
    );
  }
  return (
    <Link href={href} {...common}>
      <SlideBody slide={slide} />
    </Link>
  );
}

export default function HomeCarousel() {
  const slides = SLIDES;
  const count = slides.length;
  const [current, setCurrent] = useState(0);
  // 사용자가 직접 멈춤 / 마우스·포커스·터치로 잠시 멈춤을 구분한다
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  const videoSlides = slides.filter((s) => s.type === "video");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const go = useCallback((next: number) => setCurrent(count === 0 ? 0 : (next + count) % count), [count]);

  const paused = userPaused || hoverPaused || reducedMotion || videoIndex !== null;

  // 자동 넘김 (현재 슬라이드 변경 시 타이머 리셋)
  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [current, count, paused]);

  if (count === 0) return null;

  const openVideo = (slide: Slide) => {
    const idx = videoSlides.findIndex((s) => s.id === slide.id);
    if (idx >= 0) setVideoIndex(idx);
  };
  const goVideo = (delta: number) => {
    setVideoIndex((i) => (i === null || videoSlides.length === 0 ? i : (i + delta + videoSlides.length) % videoSlides.length));
  };
  const activeVideo = videoIndex !== null ? videoSlides[videoIndex] : null;

  // 좌우 스와이프(세로 스크롤은 방해하지 않음)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    touchStart.current = { x: e.clientX, y: e.clientY };
    setHoverPaused(true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s) return;
    setHoverPaused(false);
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      suppressClick.current = true;
      go(current + (dx < 0 ? 1 : -1));
    }
  };

  const arrowClass =
    "absolute top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-800 shadow-md transition-colors hover:bg-white dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900";

  return (
    <>
      <section className="mb-10 mt-8" aria-roledescription="carousel" aria-label="추천 자료 배너">
        <div
          className="relative h-40 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm dark:border-slate-800 sm:h-44"
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onFocus={() => setHoverPaused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setHoverPaused(false);
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (touchStart.current = null)}
          onClickCapture={(e) => {
            if (suppressClick.current) {
              suppressClick.current = false;
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          style={{ touchAction: "pan-y" }}
        >
          <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }} aria-live={paused ? "polite" : "off"}>
            {slides.map((slide, i) => (
              <CarouselSlide key={slide.id} slide={slide} active={i === current} onOpenVideo={openVideo} />
            ))}
          </div>

          {count > 1 && (
            <>
              <button type="button" onClick={() => go(current - 1)} aria-label="이전 배너" className={`${arrowClass} left-2`}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => go(current + 1)} aria-label="다음 배너" className={`${arrowClass} right-2`}>
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`${i + 1}번째 배너로 이동`}
                    aria-current={i === current ? "true" : undefined}
                    className="grid h-6 w-4 place-items-center"
                  >
                    <span className={`block h-2 rounded-full transition-all ${i === current ? "w-4 bg-white" : "w-2 bg-white/55"}`} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? "배너 자동 넘김 재생" : "배너 자동 넘김 멈춤"}
                  className="ml-1 grid h-7 w-7 place-items-center rounded-full bg-black/35 text-white hover:bg-black/55"
                >
                  {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </button>
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
