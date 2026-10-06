"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- 카카오 지도 SDK는 타입 정의가 없어 any로 다룬다 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";
import type { Resource } from "../lib/resourceTypes";
import { hasCoords, placeTheme } from "../lib/catalog";

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapComponentProps {
  className?: string;
  resources: Resource[];
  selectedId?: string | null;
  centerOn?: { lat: number; lng: number; key: number } | null;
  onMarkerClick?: (resource: Resource) => void;
  userLocation?: { lat: number; lng: number } | null;
  // 지도를 가리는 영역(머리·목록 패널·상세·하단 시트, px). 선택한 장소를 보이는 영역 가운데에 둔다.
  insets?: Insets;
}

export type Insets = { top: number; right: number; bottom: number; left: number };
const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export interface MapHandle {
  resetView: () => void;
  fitToPoints: (points: { lat: number; lng: number }[]) => void;
  relayout: () => void;
}

const INITIAL_CENTER = { lat: 35.8714, lng: 128.6014 };
const INITIAL_LEVEL = 8;

const MapComponent = forwardRef<MapHandle, MapComponentProps>(
  ({ className = "", resources, selectedId, centerOn, onMarkerClick, userLocation, insets = NO_INSETS }, ref) => {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const overlaysRef = useRef<Map<string, { overlay: any; el: HTMLButtonElement }>>(new Map());
    const userOverlayRef = useRef<any>(null);
    const pendingFitRef = useRef<{ lat: number; lng: number }[] | null>(null);
    const clickRef = useRef(onMarkerClick);
    const insetRef = useRef(insets);
    const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    clickRef.current = onMarkerClick;
    insetRef.current = insets;

    const kakao = () => (typeof window !== "undefined" ? window.kakao?.maps : undefined);

    // 가려진 영역을 빼고 실제로 보이는 영역의 가운데에 좌표가 오도록 옮긴다
    const panToVisible = (lat: number, lng: number, level?: number) => {
      const maps = kakao();
      const map = mapInstance.current;
      if (!maps || !map) return;
      if (level) map.setLevel(level, { animate: false });
      const target = new maps.LatLng(lat, lng);
      const { top, right, bottom, left } = insetRef.current;
      const dx = (right - left) / 2;
      const dy = (bottom - top) / 2;
      if (!dx && !dy) {
        map.panTo(target);
        return;
      }
      // 화면 중심을 목표에서 (dx, dy)만큼 옮겨 두면 목표가 보이는 영역의 가운데에 온다
      map.setCenter(target);
      const proj = map.getProjection();
      const p = proj.containerPointFromCoords(target);
      map.setCenter(proj.coordsFromContainerPoint(new maps.Point(p.x + dx, p.y + dy)));
    };

    const doFit = (points: { lat: number; lng: number }[]) => {
      const maps = kakao();
      if (!mapInstance.current || !maps) {
        pendingFitRef.current = points;
        return;
      }
      const bounds = new maps.LatLngBounds();
      points.forEach((p) => bounds.extend(new maps.LatLng(p.lat, p.lng)));
      const pad = 40;
      const i = insetRef.current;
      mapInstance.current.setBounds(bounds, pad + i.top, pad + i.right, pad + i.bottom, pad + i.left);
      pendingFitRef.current = null;
    };

    useImperativeHandle(ref, () => ({
      resetView() {
        pendingFitRef.current = null;
        const maps = kakao();
        if (!mapInstance.current || !maps) return;
        mapInstance.current.setLevel(INITIAL_LEVEL, { animate: true });
        panToVisible(INITIAL_CENTER.lat, INITIAL_CENTER.lng);
      },
      fitToPoints(points) {
        if (points.length) doFit(points);
      },
      relayout() {
        mapInstance.current?.relayout();
      },
    }));

    // SDK가 이미 로드된 상태로 다시 마운트되는 경우(탭 이동)
    useEffect(() => {
      if (window.kakao?.maps) setSdkReady(true);
    }, []);

    useEffect(() => {
      if (!sdkReady || mapInstance.current || !mapElement.current) return;
      window.kakao.maps.load(() => {
        if (!mapElement.current) return;
        mapInstance.current = new window.kakao.maps.Map(mapElement.current, {
          center: new window.kakao.maps.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng),
          level: INITIAL_LEVEL,
        });
        setMapReady(true);
      });
    }, [sdkReady]);

    // 마커: 대표 주제 색의 핀(버튼). 키보드로도 선택할 수 있다.
    useEffect(() => {
      const maps = kakao();
      if (!mapReady || !maps) return;
      overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
      overlaysRef.current.clear();
      resources.forEach((resource) => {
        if (resource.type !== "OFFLINE" || !hasCoords(resource)) return;
        const el = document.createElement("button");
        el.type = "button";
        el.className = "edumaps-marker";
        el.style.background = placeTheme(resource).color;
        el.setAttribute("aria-label", resource.title);
        el.title = resource.title;
        el.innerHTML = "<span></span>";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          clickRef.current?.(resource);
        });
        const overlay = new maps.CustomOverlay({
          position: new maps.LatLng(resource.location.lat, resource.location.lng),
          content: el,
          xAnchor: 0.5,
          yAnchor: 1.1,
          clickable: true,
          zIndex: 3,
        });
        overlay.setMap(mapInstance.current);
        overlaysRef.current.set(resource.id, { overlay, el });
      });
      if (pendingFitRef.current) doFit(pendingFitRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapReady, resources]);

    // 선택 표시는 마커를 다시 만들지 않고 속성만 바꾼다
    useEffect(() => {
      overlaysRef.current.forEach(({ overlay, el }, id) => {
        const active = id === selectedId;
        el.setAttribute("aria-current", active ? "true" : "false");
        overlay.setZIndex(active ? 10 : 3);
      });
    }, [selectedId, resources, mapReady]);

    useEffect(() => {
      if (!mapReady || !centerOn) return;
      lastCenterRef.current = centerOn;
      const level = Math.min(mapInstance.current.getLevel(), 5);
      panToVisible(centerOn.lat, centerOn.lng, level);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centerOn, mapReady]);

    // 하단 시트·상세 높이가 정해지면(열린 직후 측정) 선택한 장소가 가려지지 않게 다시 맞춘다
    useEffect(() => {
      const c = lastCenterRef.current;
      if (!mapReady || !c || !selectedId) return;
      panToVisible(c.lat, c.lng);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [insets.top, insets.right, insets.bottom, insets.left]);

    useEffect(() => {
      const maps = kakao();
      if (!mapReady || !maps) return;
      userOverlayRef.current?.setMap(null);
      userOverlayRef.current = null;
      if (!userLocation) return;
      const content = document.createElement("div");
      content.style.cssText = "width:20px;height:20px;position:relative;";
      content.setAttribute("aria-label", "내 위치");
      content.innerHTML = `
        <div style="position:absolute;inset:0;background:rgba(59,130,246,0.25);border-radius:50%;animation:edumaps-pulse 1.5s ease-out infinite;"></div>
        <div style="position:absolute;inset:4px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`;
      userOverlayRef.current = new maps.CustomOverlay({
        position: new maps.LatLng(userLocation.lat, userLocation.lng),
        content,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 100,
      });
      userOverlayRef.current.setMap(mapInstance.current);
    }, [userLocation, mapReady]);

    return (
      <>
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID}&autoload=false`}
          onLoad={() => setSdkReady(true)}
        />
        <div ref={mapElement} className={`h-full w-full bg-slate-200 dark:bg-slate-800 ${className}`} role="region" aria-label="체험학습 장소 지도" />
      </>
    );
  }
);

MapComponent.displayName = "MapComponent";
export default MapComponent;
