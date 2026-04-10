// LOKASI: src/components/pages/manage-exams/[eventId]/sessions/session-detail-header.tsx
"use client";

import React from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Calendar,
  Clock,
  KeyRound,
  UserCheck,
  FileSpreadsheet,
  Plus,
  Copy,
  Camera,
  LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";

interface SessionDetailHeaderProps {
  sessionDetail: any;
  onBack: () => void;
  onImportClick: () => void;
  onUploadPhotoClick: () => void;
  onAddClick: () => void;
  isLoading?: boolean;
  role?: string;
}

export function SessionDetailHeader({
  sessionDetail,
  onBack,
  onImportClick,
  onUploadPhotoClick,
  onAddClick,
  isLoading,
  role
}: SessionDetailHeaderProps) {
  
  const handleCopyToken = () => {
    if (sessionDetail?.token) {
      navigator.clipboard.writeText(sessionDetail.token);
      toast.success("Token ujian berhasil disalin ke clipboard!");
    }
  };

  const isTeacher = role === "TEACHER";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64 bg-slate-200 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-slate-200 rounded-lg" />
            <Skeleton className="h-10 w-32 bg-slate-200 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl bg-slate-200" />
          <Skeleton className="h-32 rounded-xl bg-slate-200" />
          <Skeleton className="h-32 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* HEADER UTAMA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 -ml-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all" 
              onClick={onBack}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <LayoutDashboard className="h-6 w-6 text-emerald-600" /> Detail Sesi & Peserta Ujian
            </h1>
          </div>
          <p className="text-slate-500 text-sm pl-9">
            Kelola daftar hadir, token, dan paket soal peserta dalam sesi ini.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 pl-9 md:pl-0">
          {!isTeacher && (
            <>
              <Button 
                variant="outline" 
                onClick={onUploadPhotoClick}
                className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200 shadow-sm h-10 font-bold transition-all active:scale-95"
              >
                <Camera className="h-4 w-4 mr-2" /> Upload Massal Foto Peserta
              </Button>

              <Button 
                variant="outline" 
                onClick={onImportClick}
                className="bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm h-10 font-bold transition-all active:scale-95"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Unggah Data Peserta
              </Button>

              <Button 
                onClick={onAddClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md h-10 font-bold transition-all active:scale-95 px-5"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Tambah Manual Peserta
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KARTU INFORMASI */}
      {sessionDetail && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            icon={<Calendar className="text-blue-600" />}
            color="bg-blue-50"
            label="Jadwal Ujian"
            value={
              <div className="flex flex-col">
                <span className="text-slate-800 font-bold text-sm">
                  {sessionDetail.start_time ? format(new Date(sessionDetail.start_time), "EEEE, dd MMM yyyy", { locale: idLocale }) : "-"}
                </span>
                <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {sessionDetail.start_time ? format(new Date(sessionDetail.start_time), "HH:mm") : "-"} - {sessionDetail.end_time ? format(new Date(sessionDetail.end_time), "HH:mm") : "-"} WIB
                </span>
              </div>
            }
          />
          <InfoCard
            icon={<KeyRound className="text-amber-600" />}
            color="bg-amber-50"
            label="Token Akses Sesi"
            value={
              <div className="flex items-center gap-2">
                <span className="text-amber-700 font-mono font-black text-xl tracking-widest bg-amber-100/50 px-3 py-1 rounded-lg border border-amber-200/50 shadow-inner">
                  {sessionDetail.token || "------"}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleCopyToken}
                  className="h-9 w-9 hover:bg-amber-100 text-amber-600 rounded-lg active:scale-90"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            }
          />
          <InfoCard
            icon={<UserCheck className="text-emerald-600" />}
            color="bg-emerald-50"
            label="Total Terdaftar"
            value={
              <div className="flex items-center gap-2">
                <span className="text-emerald-900 font-black text-2xl leading-none">
                  {sessionDetail.participant_count || 0}
                </span>
                <span className="text-emerald-600/70 font-bold text-[10px] uppercase tracking-widest bg-white border border-emerald-100 px-2 py-1 rounded-md shadow-sm">
                  Siswa Peserta
                </span>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}

const InfoCard = ({ icon, color, label, value }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all duration-300 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-50 to-transparent opacity-50 rounded-bl-full pointer-events-none"></div>
    <div className={`h-14 w-14 rounded-xl ${color} flex items-center justify-center shrink-0 border border-white shadow-inner group-hover:scale-105 transition-transform duration-300`}>
      {React.cloneElement(icon, { className: "h-6 w-6 " + icon.props.className })}
    </div>
    <div className="flex flex-col z-10">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
      {value}
    </div>
  </div>
);