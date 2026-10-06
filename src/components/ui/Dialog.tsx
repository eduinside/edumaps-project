"use client";

import { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}

// 네이티브 <dialog>를 모달로 연다: ESC 닫기·포커스 가두기·닫은 뒤 포커스 복귀를 브라우저가 처리한다.
export default function Dialog({ open, onClose, labelledBy, label, className = "", children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // 열린 동안 뒤 페이지 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // 바깥(배경) 클릭 시 닫기: dialog 자체가 클릭 대상이면 배경을 누른 것
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-auto max-h-[min(88dvh,900px)] w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50 dark:bg-slate-900 dark:text-slate-100 open:animate-in open:fade-in open:zoom-in-95 ${className}`}
    >
      {open && children}
    </dialog>
  );
}
