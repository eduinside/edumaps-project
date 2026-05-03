"use client";

import { useEffect, useRef, useState } from "react";
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
}

export default function MapComponent({ className, resources, centerOn, onMarkerClick }: MapComponentProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Handle flyTo when centerOn changes
  useEffect(() => {
    if (mapInstance.current && window.kakao && centerOn) {
      const moveLatLon = new window.kakao.maps.LatLng(centerOn.lat, centerOn.lng);
      mapInstance.current.setCenter(moveLatLon);
      mapInstance.current.setLevel(4, { animate: true });
    }
  }, [centerOn]);

  const initMap = () => {
    if (!mapElement.current || !window.kakao || !window.kakao.maps) return;

    if (!mapInstance.current) {
      window.kakao.maps.load(() => {
        const options = {
          center: new window.kakao.maps.LatLng(35.8714, 128.6014), // Default to Daegu
          level: 8,
        };
        mapInstance.current = new window.kakao.maps.Map(mapElement.current, options);
        updateMarkers();
      });
    } else {
      updateMarkers();
    }
  };

  const updateMarkers = () => {
    if (!mapInstance.current || !window.kakao || !window.kakao.maps) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    resources.forEach((resource) => {
      if (resource.type === "OFFLINE" && resource.location && resource.location.lat) {
        const position = new window.kakao.maps.LatLng(resource.location.lat, resource.location.lng);
        const marker = new window.kakao.maps.Marker({
          position: position,
          map: mapInstance.current,
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          if (onMarkerClick) onMarkerClick(resource);
        });

        markersRef.current.push(marker);
      }
    });
  };

  useEffect(() => {
    // 이미 스크립트가 로드되어 있는 경우 (탭 전환 시)
    if (window.kakao && window.kakao.maps) {
      setMapLoaded(true);
      initMap();
    }
  }, []);

  useEffect(() => {
    if (mapLoaded) {
      initMap();
    }
  }, [mapLoaded, resources]);

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
