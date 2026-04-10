// LOKASI: src/components/pages/manage-exams/[eventId]/sessions/result-detail-dialog.tsx
"use client";

import React from "react";
import { 
  CheckCircle2, Clock, ScanSearch, BookOpen, 
  User, ClipboardList, GraduationCap, X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface ResultDetailDialogProps {
  participant: any | null;
  onClose: () => void;
}

export function ResultDetailDialog({ participant, onClose }: ResultDetailDialogProps) {
  if (!participant) return null;

  const studentName = participant.student?.profile?.full_name || participant.student?.username || "Tanpa Nama";
  const nisn = participant.student?.profile?.nisn || "-";
  const className = participant.student?.profile?.class?.name || "Umum";

  return (
    <Dialog open={!!participant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-3xl p-0 overflow-hidden border-0 shadow-2xl rounded-xl bg-white animate-in zoom-in-95 duration-300 [&>button]:hidden">
        <VisuallyHidden.Root><DialogTitle>Detail Hasil Peserta</DialogTitle></VisuallyHidden.Root>

        {/* HEADER MEWAH (DNA DATA SISWA) */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-[#043425] to-[#065f46] p-8 text-white shrink-0">
          <div className="absolute -right-4 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="h-16 w-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-xl backdrop-blur-sm">
              <User className="h-8 w-8 text-emerald-300" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">
                {studentName}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[10px] font-bold text-emerald-100/70 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded border border-white/5 font-mono">
                  NISN: {nisn}
                </span>
                <span className="text-[10px] font-bold text-emerald-100/70 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" /> Kelas: {className}
                </span>
              </div>
            </div>
          </div>
          <Button 
            onClick={onClose} 
            variant="ghost" 
            className="absolute top-4 right-4 h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* BODY (DNA DATA SISWA) */}
        <div className="p-6 md:p-8 bg-slate-50/80 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-thin">
          
          {/* STATISTIK HASIL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard label="Nilai Akhir" value={(participant.final_score || 0).toFixed(1)} color="bg-emerald-600" icon={<CheckCircle2 className="w-4 h-4" />} />
            <StatsCard label="Benar (PG)" value={participant.pg_correct || 0} color="bg-blue-600" icon={<BookOpen className="w-4 h-4" />} />
            <StatsCard label="Salah (PG)" value={participant.pg_wrong || 0} color="bg-rose-600" icon={<ScanSearch className="w-4 h-4" />} />
            <StatsCard label="Kosong" value={participant.empty_answers || 0} color="bg-slate-700" icon={<Clock className="w-4 h-4" />} />
          </div>

          {/* REKAM JEJAK JAWABAN */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:border-emerald-200 transition-colors">
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Analisis Jawaban Per Nomor
              </h4>
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                Otomatis Sistem
              </span>
            </div>
            
            <div className="p-5 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
              {participant.answers_detail ? (
                participant.answers_detail.split(",").map((ans: string, idx: number) => (
                  <div key={idx} className="relative aspect-square border border-slate-100 rounded-lg flex items-center justify-center text-sm font-black text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all bg-slate-50/30 group">
                    <span className="absolute top-1 left-1.5 text-[8px] text-slate-300 font-bold group-hover:text-emerald-500">
                      {idx + 1}
                    </span>
                    <span className="mt-1">{ans.trim() || "-"}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-300">
                  <ScanSearch className="w-12 h-12 opacity-20 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Detail tidak tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER (DNA DATA SISWA) */}
        <DialogFooter className="p-4 bg-white border-t border-slate-100 sm:justify-end rounded-b-xl">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 font-bold shadow-sm px-8 rounded-xl h-11 transition-all active:scale-95"
          >
            Tutup Detail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const StatsCard = ({ label, value, color, icon }: any) => (
  <div className={`${color} p-4 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-black/5 relative overflow-hidden group border-b-4 border-black/10`}>
    <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-bl-full pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
    <div className="flex items-center gap-1.5 mb-1 text-white/70 z-10">
      {icon} <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-3xl font-black text-white z-10 tracking-tighter drop-shadow-md">{value}</span>
  </div>
);