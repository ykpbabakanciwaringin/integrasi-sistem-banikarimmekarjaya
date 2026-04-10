// LOKASI: src/components/pages/manage-exams/[eventId]/monitor/monitor-detail-header.tsx
"use client";

import React, { useState, useEffect } from "react";
import { format, differenceInSeconds } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ChevronLeft, Clock, BookOpen, ShieldCheck, 
  ShieldAlert, PauseCircle, PlayCircle, Copy, Users, Timer, AlertCircle
} from "lucide-react";

interface MonitorDetailHeaderProps {
  sessionData: any;
  onBack: () => void;
  isLoading: boolean;
  onToggleStatus: () => void;
  role?: string; 
}

export function MonitorDetailHeader({ 
  sessionData, onBack, isLoading, onToggleStatus, role 
}: MonitorDetailHeaderProps) {
  
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  useEffect(() => {
    if (!sessionData?.end_time) return;
    const end = new Date(sessionData.end_time);
    
    const updateTimer = () => {
      if (!sessionData.is_active) {
        setTimeLeft("SESI DIJEDA");
        return;
      }
      const now = new Date();
      const diff = differenceInSeconds(end, now);
      if (diff <= 0) {
        setTimeLeft("WAKTU HABIS");
      } else {
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        setTimeLeft(`${h}:${m}:${s}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionData]);

  const handleCopyToken = () => {
    if (sessionData?.token) {
      navigator.clipboard.writeText(sessionData.token);
      toast.success("Token ujian berhasil disalin!");
    }
  };

  const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
      if (!dateStr) return "-";
      return format(new Date(dateStr), formatStr, { locale: idLocale });
    } catch (e) { return "-"; }
  };

  const isSebRequired = sessionData?.exam_event?.is_seb_required || false;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 mb-6">
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-48 rounded-2xl bg-slate-200" />
          <Skeleton className="h-48 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      
      <Button variant="ghost" className="w-fit -ml-2 text-slate-500 hover:text-slate-900 mb-1 h-8 px-2 group" onClick={onBack}>
        <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Kembali ke Kelola Sesi
      </Button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        
        {/* WIDGET KIRI: INFO UTAMA & TOKEN */}
        <div className="xl:col-span-2 bg-gradient-to-br from-[#043425] to-[#065f46] rounded-2xl p-6 md:p-8 border border-[#065f46] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 text-white">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="flex flex-col gap-3 relative z-10 w-full justify-center">
            <div className="flex flex-wrap items-center gap-2">
              {sessionData?.is_active ? (
                <Badge className="bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 flex items-center gap-1.5 px-2.5 py-1 shadow-none font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ujian Aktif
                </Badge>
              ) : (
                <Badge className="bg-rose-500/20 text-rose-200 border border-rose-400/30 flex items-center gap-1.5 px-2.5 py-1 shadow-none font-bold text-[11px]">
                  <AlertCircle className="w-3 h-3" /> Sesi Dijeda
                </Badge>
              )}
              {isSebRequired && (
                <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/30 flex items-center gap-1 px-2.5 py-1 shadow-none font-bold text-[11px]">
                  <ShieldAlert className="w-3 h-3" /> Wajib SEB
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight line-clamp-2">
              {sessionData?.title || "Live Monitoring"}
            </h1>
            
            <div className="flex items-center gap-2 text-emerald-100 font-medium mt-1">
              <BookOpen className="h-4 w-4 opacity-70" />
              <span className="truncate">{sessionData?.subject_list || "Mata Pelajaran"}</span>
            </div>
          </div>

          {/* TOKEN AKSES */}
          <div className="flex flex-col items-start md:items-end justify-center shrink-0 relative z-10 mt-4 md:mt-0">
            <p className="text-[12px] font-bold text-emerald-200 uppercase tracking-widest mb-1 px-1">Token Akses</p>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-1.5 flex items-center shadow-inner group backdrop-blur-sm">
              <div className="px-6 py-2">
                <span className="text-6xl md:text-7xl font-black tracking-[0.15em] text-white uppercase font-mono">
                  {sessionData?.token || "------"}
                </span>
              </div>
              <Button 
                variant="ghost" size="icon" onClick={handleCopyToken}
                className="h-14 w-14 rounded-xl bg-white/10 hover:bg-white/20 text-white shadow-sm border border-white/10 shrink-0 mx-1 transition-all active:scale-95"
                title="Salin Token"
              >
                <Copy className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* WIDGET KANAN: TIMER & KENDALI DARURAT */}
        <div className={`rounded-2xl p-6 shadow-md border relative overflow-hidden flex flex-col justify-center items-center text-center transition-all duration-500 ${sessionData?.is_active ? 'bg-white border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
          <Timer className={`h-8 w-8 mb-3 ${sessionData?.is_active ? 'text-emerald-600' : 'text-rose-500'}`} />
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${sessionData?.is_active ? 'text-slate-500' : 'text-rose-600'}`}>Sisa Waktu Ujian</p>
          <p className={`text-4xl md:text-5xl font-mono font-black tracking-tight mb-6 drop-shadow-sm ${sessionData?.is_active ? 'text-slate-800' : 'text-rose-700'}`}>
            {timeLeft}
          </p>

          {isAdmin ? (
            sessionData?.is_active ? (
              <Button onClick={onToggleStatus} className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-md font-bold text-sm h-11 rounded-xl active:scale-95 transition-all">
                <PauseCircle className="mr-2 h-5 w-5" /> Jeda Ujian (Darurat)
              </Button>
            ) : (
              <Button onClick={onToggleStatus} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold text-sm h-11 rounded-xl active:scale-95 transition-all animate-pulse">
                <PlayCircle className="mr-2 h-5 w-5" /> Lanjutkan Ujian
              </Button>
            )
          ) : (
            <div className={`text-[10px] font-medium px-4 py-2 rounded-lg border ${sessionData?.is_active ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-rose-100 border-rose-200 text-rose-700'}`}>
               Kontrol Jeda hanya untuk Admin
            </div>
          )}
        </div>
      </div>

      {/* INFO CARDS Bawah */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard icon={<Clock className="text-blue-600" />} color="bg-blue-50 border-blue-100" label="Rentang Waktu" value={<span className="text-slate-800 font-bold">{safeFormatDate(sessionData?.start_time, "HH:mm")} - {safeFormatDate(sessionData?.end_time, "HH:mm")} WIB</span>} />
        <InfoCard icon={<Users className="text-emerald-600" />} color="bg-emerald-50 border-emerald-100" label="Total Terdaftar" value={<span className="text-slate-800 font-bold">{sessionData?.participant_count || 0} <span className="text-slate-500 text-[10px] font-normal uppercase ml-1">Siswa</span></span>} />
        <InfoCard icon={<ShieldCheck className="text-amber-600" />} color="bg-amber-50 border-amber-100" label="Pengawas" value={<span className="text-slate-800 font-bold truncate">{sessionData?.proctors?.length > 0 ? sessionData.proctors.map((p: any) => p.teacher?.profile?.full_name || p.teacher?.full_name || "Guru").join(", ") : "Belum diatur"}</span>} />
      </div>
    </div>
  );
}

const InfoCard = ({ icon, color, label, value }: any) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-colors relative overflow-hidden group">
    <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform`}>
      {React.cloneElement(icon, { className: "h-5 w-5 " + icon.props.className })}
    </div>
    <div className="flex flex-col z-10 w-full overflow-hidden">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
      <div className="truncate text-sm">{value}</div>
    </div>
  </div>
);