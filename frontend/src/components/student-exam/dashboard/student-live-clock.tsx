"use client";

import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

interface StudentLiveClockProps {
  userName?: string;
}

export function StudentLiveClock({ userName }: StudentLiveClockProps) {
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

  // SKELETON: Mencegah Layar Melompat (CLS)
  if (!time) {
    return (
      <div className="flex flex-col gap-2 mb-4">
        <Skeleton className="h-10 w-3/4 md:w-[350px] bg-slate-200/60 rounded-xl" />
        <Skeleton className="h-6 w-1/2 md:w-[250px] bg-slate-200/60 rounded-lg" />
      </div>
    );
  }

  const formattedDate = time.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = time.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="relative z-10 mb-4 animate-in fade-in slide-in-from-left-4 duration-700">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 flex-wrap">
        <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          {greeting},
        </span>
        <span className="text-slate-800 line-clamp-1">
          {userName ? userName : "Siswa"}
        </span>
      </h1>
      
      <div className="flex items-center gap-2.5 mt-2 text-slate-500 font-medium text-sm md:text-base">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100/80 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <span>{formattedDate}</span>
        <span className="text-slate-300">|</span>
        <span className="font-mono font-black text-emerald-600 tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shadow-sm">
          {formattedTime} WIB
        </span>
      </div>
    </div>
  );
}