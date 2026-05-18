"use client";

import { useState, useEffect } from "react";
import { FileDown } from "lucide-react";

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
            className="group flex items-center gap-4 p-5 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <FileDown className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-slate-800 truncate">{item.title}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
