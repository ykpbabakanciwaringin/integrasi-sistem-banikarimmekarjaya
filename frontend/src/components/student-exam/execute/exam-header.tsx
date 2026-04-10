"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  WifiOff,
  Loader2,
  Database,
  UserCircle2,
  Wifi,
} from "lucide-react";
import { useStudentExamStore } from "@/stores/use-student-exam-store";
import { dbProvider } from "@/lib/db";
import { cn } from "@/lib/utils"; // Pastikan cn di-import untuk manajemen class dinamis

interface ExamHeaderProps {
  title: string;
  studentName: string;
  onTimeUp: () => void;
}

export const ExamHeader = ({
  title,
  studentName,
  onTimeUp,
}: ExamHeaderProps) => {
  const { isOnline, isSyncing, timeRemaining, decrementTime } = useStudentExamStore();
  const [pendingCount, setPendingCount] = useState(0);

  // 1. Pantau jumlah antrean jawaban secara berkala (Logika Asli Dipertahankan)
  useEffect(() => {
    const checkPending = async () => {
      const unsynced = await dbProvider.getUnsyncedAnswers();
      setPendingCount(unsynced.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  // 2. Ticker Waktu Anti-Cheat (Logika Asli Dipertahankan)
  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      decrementTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, decrementTime, onTimeUp]);

  // 3. Format Waktu (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeCritical = timeRemaining < 300; // Merah jika kurang dari 5 menit (300 detik)

  return (
    <header className="sticky top-4 z-40 w-full px-4 md:px-8 transition-all mb-4 md:mb-6">
      {/* Container Utama Header bergaya Premium Card */}
      <div className="max-w-[1400px] mx-auto bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-200/50 rounded-[2rem] h-20 md:h-24 px-5 md:px-8 flex items-center justify-between">
        
        {/* KIRI: Judul Ujian & Nama Siswa */}
        <div className="flex flex-col justify-center">
          <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1 md:mb-1.5 drop-shadow-sm line-clamp-1">
            {title}
          </h1>
          <div className="flex items-center text-emerald-600 text-[10px] md:text-xs font-bold tracking-widest uppercase">
            <UserCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
            <span className="truncate max-w-[150px] md:max-w-xs">
              {studentName}
            </span>
          </div>
        </div>

        {/* KANAN: Status Jaringan & Sisa Waktu */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Indikator Status Server & Antrean (Disembunyikan di layar HP agar tidak sempit) */}
          <div
            className={cn(
              "hidden md:flex items-center gap-3 px-4 h-12 md:h-14 rounded-2xl border transition-all duration-300 shadow-sm",
              !isOnline
                ? "bg-rose-50 border-rose-200"
                : pendingCount > 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-slate-50 border-slate-100 hover:bg-white"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center border shadow-inner transition-colors",
                !isOnline
                  ? "bg-rose-100 text-rose-600 border-rose-200"
                  : pendingCount > 0
                    ? "bg-amber-100 text-amber-600 border-amber-200"
                    : "bg-white text-emerald-500 border-emerald-100"
              )}
            >
              {!isOnline ? (
                <WifiOff className="w-4 h-4 animate-pulse" />
              ) : isSyncing || pendingCount > 0 ? (
                <Database className="w-4 h-4 animate-pulse" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col leading-none pr-2">
              <span
                className={cn(
                  "text-[8px] font-black uppercase tracking-[0.2em] mb-1.5",
                  !isOnline ? "text-rose-400" : pendingCount > 0 ? "text-amber-500" : "text-slate-400"
                )}
              >
                {pendingCount > 0 ? `${pendingCount} Antrean` : "Koneksi Server"}
              </span>
              <span className={cn(
                "text-xs font-black tracking-tight",
                !isOnline ? "text-rose-700" : pendingCount > 0 ? "text-amber-700" : "text-slate-700"
              )}>
                {!isOnline
                  ? "Terputus"
                  : isSyncing
                    ? "Menyinkronkan..."
                    : "Terhubung Aman"}
              </span>
            </div>
          </div>

          {/* Indikator Sisa Waktu (Selalu tampil di semua layar) */}
          <div
            className={cn(
              "flex items-center gap-2 md:gap-3 px-3 md:px-4 h-12 md:h-14 rounded-2xl border transition-all duration-300 shadow-sm",
              isTimeCritical
                ? "bg-rose-50 border-rose-200 shadow-rose-500/20"
                : "bg-emerald-50 border-emerald-100"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center border shadow-inner transition-colors",
                isTimeCritical
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : "bg-emerald-500 text-white border-emerald-600"
              )}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-none pr-1 md:pr-2">
              <span
                className={cn(
                  "text-[8px] font-black uppercase tracking-[0.2em] mb-1.5",
                  isTimeCritical ? "text-rose-500" : "text-emerald-600"
                )}
              >
                Sisa Waktu
              </span>
              <span className={cn(
                "text-sm md:text-base font-black font-mono tracking-wider",
                isTimeCritical ? "text-rose-700" : "text-emerald-950"
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};