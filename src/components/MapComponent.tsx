"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapComponentProps {
  className?: string;
  resources: any[];
  centerOn?: { lat: number; lng: number } | null;
  onMarkerClick?: (resource: any) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export interface MapHandle {
  resetView: () => void;
  fitToPoints: (points: { lat: number; lng: number }[]) => void;
}

const INITIAL_CENTER = { lat: 35.8714, lng: 128.6014 };
const INITIAL_LEVEL = 8;

const MapComponent = forwardRef<MapHandle, MapComponentProps>(
  ({ className, resources, centerOn, onMarkerClick, userLocation }, ref) => {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userOverlayRef = useRef<any>(null);
    const pendingFitRef = useRef<{ lat: number; lng: number }[] | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const doFit = (points: { lat: number; lng: number }[]) => {
      if (!mapInstance.current || !window.kakao?.maps) {
        pendingFitRef.current = points;
        return;
      }
      const bounds = new window.kakao.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
      mapInstance.current.setBounds(bounds, 80, 80, 80, 80);
      mapInstance.current.setLevel(mapInstance.current.getLevel() + 1);
      pendingFitRef.current = null;
    };

    useImperativeHandle(ref, () => ({
      resetView() {
        pendingFitRef.current = null;
        if (!mapInstance.current || !window.kakao?.maps) return;
        mapInstance.current.setCenter(new window.kakao.maps.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng));
        mapInstance.current.setLevel(INITIAL_LEVEL, { animate: true });
      },
      fitToPoints(points: { lat: number; lng: number }[]) {
        if (!points.length) return;
        doFit(points);
      },
    }));

    const applyUserOverlay = (loc: { lat: number; lng: number } | null | undefined) => {
      if (!mapInstance.current || !window.kakao?.maps) return;
      if (userOverlayRef.current) {
        userOverlayRef.current.setMap(null);
        userOverlayRef.current = null;
      }
      if (loc) {
        const content = document.createElement("div");
        content.style.cssText = "width:20px;height:20px;position:relative;";
        content.innerHTML = `
          <div style="position:absolute;inset:0;background:rgba(59,130,246,0.25);border-radius:50%;animation:edumaps-pulse 1.5s ease-out infinite;"></div>
          <div style="position:absolute;inset:4px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
          <style>@keyframes edumaps-pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}}</style>
        `;
        const position = new window.kakao.maps.LatLng(loc.lat, loc.lng);
        userOverlayRef.current = new window.kakao.maps.CustomOverlay({
          position, content, yAnchor: 0.5, xAnchor: 0.5, zIndex: 100,
        });
        userOverlayRef.current.setMap(mapInstance.current);
      }
    };

    const updateMarkers = () => {
      if (!mapInstance.current || !window.kakao?.maps) return;
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      resources.forEach((resource) => {
        if (resource.type === "OFFLINE" && resource.location?.lat) {
          const position = new window.kakao.maps.LatLng(resource.location.lat, resource.location.lng);
          const marker = new window.kakao.maps.Marker({ position, map: mapInstance.current });
          window.kakao.maps.event.addListener(marker, "click", () => { if (onMarkerClick) onMarkerClick(resource); });
          markersRef.current.push(marker);
        }
      });
      if (pendingFitRef.current) doFit(pendingFitRef.current);
    };

    const initMap = () => {
      if (!mapElement.current || !window.kakao?.maps) return;
      if (!mapInstance.current) {
        window.kakao.maps.load(() => {
          mapInstance.current = new window.kakao.maps.Map(mapElement.current, {
            center: new window.kakao.maps.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng),
            level: INITIAL_LEVEL,
          });
          updateMarkers();
          applyUserOverlay(userLocation);
        });
      } else {
        updateMarkers();
      }
    };

    useEffect(() => {
      if (window.kakao?.maps) { setMapLoaded(true); initMap(); }
    }, []);

    useEffect(() => {
      if (mapLoaded) initMap();
    }, [mapLoaded, resources]);

    useEffect(() => {
      if (mapInstance.current && window.kakao && centerOn) {
        mapInstance.current.setCenter(new window.kakao.maps.LatLng(centerOn.lat, centerOn.lng));
        mapInstance.current.setLevel(3, { animate: true });
      }
    }, [centerOn]);

    useEffect(() => {
      applyUserOverlay(userLocation);
    }, [userLocation, mapLoaded]);

    return (
      <>
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID}&autoload=false`}
          onLoad={() => setMapLoaded(true)}
        />
        <div ref={mapElement} className={`w-full h-full ${className}`} />
      </>
    );
  }
);

MapComponent.displayName = "MapComponent";
export default MapComponent;
