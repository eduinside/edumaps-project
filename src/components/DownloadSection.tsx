"use client";

import { useState, useEffect } from "react";

interface PdfItem {
  title: string;
  filename: string;
  description: string;
}

export default function DownloadSection() {
  const [items, setItems] = useState<PdfItem[]>([]);

  useEffect(() => {
    fetch("/downloads/pdf-list.json")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mt-4 mb-10">
      <div className="flex flex-col gap-4 max-w-full lg:max-w-[50%] mx-auto">
        {items.map((item) => (
          <a
            key={item.filename}
            href={`/downloads/${item.filename}`}
            download
            className="group flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                {/* 종이 몸체 */}
                <path d="M7 4a2 2 0 0 1 2-2h10l6 6v18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.2"/>
                {/* 접힌 모서리 */}
                <path d="M19 2v5a1 1 0 0 0 1 1h5" stroke="#f87171" strokeWidth="1.2"/>
                {/* PDF 텍스트 */}
                <text x="16" y="22" textAnchor="middle" fontSize="7" fontWeight="900" fill="#dc2626" fontFamily="sans-serif" letterSpacing="0.5">PDF</text>
                {/* 아래 화살표 */}
                <path d="M16 11v6m-2.5-2 2.5 2.5 2.5-2.5" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{item.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
