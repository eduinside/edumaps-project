"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, MonitorPlay } from "lucide-react";
import type { Resource } from "../../lib/resourceTypes";
import { FALLBACK_IMAGE } from "../../lib/catalog";

// 썸네일: 불러오기 전에는 아이콘 자리표시, 실패하면 기본 이미지로 바꾼다.
export default function ResourceThumb({ resource, className = "", sizes = "96px", priority = false }: { resource: Resource; className?: string; sizes?: string; priority?: boolean }) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = !resource.image_url || errored ? FALLBACK_IMAGE : resource.image_url;
  const Icon = resource.type === "OFFLINE" ? MapPin : MonitorPlay;
  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      {!loaded && <Icon className="absolute left-1/2 top-1/2 h-1/3 max-h-8 w-1/3 max-w-8 -translate-x-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" aria-hidden />}
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        // 하이드레이션 전에 이미 받아 둔 이미지는 onLoad가 오지 않으므로 마운트 시 complete로 확인한다
        ref={(img) => {
          if (img?.complete && img.naturalWidth > 0 && !loaded) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
