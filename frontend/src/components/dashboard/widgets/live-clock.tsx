// LOKASI: src/components/dashboard/widgets/live-clock.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";

interface LiveClockProps {
  userName?: string;
}

export function LiveClock({ userName }: LiveClockProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    if (!time) return "Selamat Datang";
    const hour = time.getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }, [time]);

  // Skeleton saat jam belum di-load agar UI tidak bergeser
  if (!time) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-6 w-32 bg-slate-100 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <>
      <div className="relative z-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          {greeting},{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            {userName || "Pengguna"}
          </span>
          ! 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
          Sistem Informasi Akademik Terpadu Yayasan Kebajikan Pesantren.
        </p>
      </div>
      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-md border border-slate-100 mt-2 sm:mt-0 w-fit">
        <Clock className="h-3 w-3" />
        {time.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}{" "}
        WIB
      </div>
    </>
  );
}