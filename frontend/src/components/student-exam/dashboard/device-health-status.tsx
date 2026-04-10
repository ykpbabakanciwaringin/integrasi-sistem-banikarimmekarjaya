"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceHealthStatusProps {
  isSafeBrowser: boolean;
  isSebRequired: boolean;
}

export function DeviceHealthStatus({ isSafeBrowser, isSebRequired }: DeviceHealthStatusProps) {
  const [isOnline, setIsOnline] = useState(true);

  // Memantau koneksi internet secara real-time di sisi klien
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in duration-500">
      {/* Indikator Koneksi Internet */}
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border backdrop-blur-sm transition-colors shadow-sm",
        isOnline 
          ? "bg-emerald-50/80 text-emerald-700 border-emerald-200" 
          : "bg-rose-50/80 text-rose-700 border-rose-200"
      )}>
        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        <span className="uppercase tracking-wider">
          {isOnline ? "Koneksi Stabil" : "Koneksi Terputus"}
        </span>
      </div>

      {/* Indikator Mode Keamanan (SEB) */}
      {isSebRequired && (
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border backdrop-blur-sm transition-colors shadow-sm",
          isSafeBrowser 
            ? "bg-blue-50/80 text-blue-700 border-blue-200" 
            : "bg-amber-50/80 text-amber-700 border-amber-200"
        )}>
          {isSafeBrowser ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          <span className="uppercase tracking-wider">
            {isSafeBrowser ? "SEB Aktif" : "SEB Tidak Terdeteksi"}
          </span>
        </div>
      )}
    </div>
  );
}