"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Dialog from "./ui/Dialog";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
  onPrev?: () => void;
  onNext?: () => void;
  hasMultiple?: boolean;
}

export default function VideoModal({ isOpen, onClose, videoId, title, onPrev, onNext, hasMultiple }: VideoModalProps) {
  return (
    <Dialog open={isOpen && !!videoId} onClose={onClose} label={title} className="w-auto max-w-none overflow-visible bg-transparent shadow-none dark:bg-transparent">
      <div className="relative flex items-center gap-2 sm:gap-4">
        {hasMultiple && (
          <button type="button" onClick={onPrev} aria-label="이전 영상" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <div className="relative">
          <button type="button" onClick={onClose} aria-label="영상 닫기" className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full text-white/90 hover:bg-white/15">
            <X className="h-6 w-6" />
          </button>
          <div className="relative aspect-[9/16] h-[min(80dvh,860px)] max-w-[80vw] overflow-hidden rounded-2xl bg-black shadow-2xl">
            <iframe
              key={videoId}
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        {hasMultiple && (
          <button type="button" onClick={onNext} aria-label="다음 영상" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </Dialog>
  );
}
