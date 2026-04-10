// LOKASI: src/components/pages/manage-exams/[eventId]/monitor/violation-gallery-modal.tsx
"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { 
  Camera, ExternalLink, Clock, AlertTriangle, 
  User, School, ShieldX, Image as ImageIcon 
} from "lucide-react";
import { getUniversalImageUrl } from "@/lib/axios";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ViolationGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: any | null;
}

export function ViolationGalleryModal({ isOpen, onClose, participant }: ViolationGalleryModalProps) {
  if (!participant) return null;

  const logs = participant.violation_logs || [];
  const profile = participant.student?.profile || {};
  const studentName = profile.full_name || participant.student?.username || "Siswa";
  const className = profile.class?.name || "Umum";

  const getViolationLabel = (type: string) => {
    const types: Record<string, string> = {
      "TAB_SWITCH": "Pindah Tab / Aplikasi",
      "FULLSCREEN_EXIT": "Keluar Mode Layar Penuh",
      "MULTIPLE_FACES": "Terdeteksi Lebih dari 1 Orang",
      "NO_FACE": "Wajah Tidak Terdeteksi",
      "UNAUTHORIZED_PERSON": "Orang Tidak Dikenal",
      "SCREEN_SHARING": "Deteksi Berbagi Layar",
    };
    return types[type] || type?.replace(/_/g, ' ') || "Aktivitas Mencurigakan";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-4xl p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl z-[9999] flex flex-col max-h-[90vh]">
        
        {/* HEADER MODAL */}
        <DialogHeader className="bg-gradient-to-br from-rose-700 to-rose-600 p-6 md:p-8 text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <ShieldX className="w-7 h-7 text-white" />
              </div>
              <div className="text-left space-y-1">
                <DialogTitle className="text-2xl font-black tracking-tight text-white leading-tight">
                  Log Pelanggaran SEB
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-rose-100/90 font-bold text-[11px] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {studentName}</span>
                  <span className="flex items-center gap-1.5"><School className="w-3.5 h-3.5" /> {className}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 px-5 py-2.5 rounded-xl hidden md:block shadow-inner backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase text-rose-200 tracking-widest mb-0.5">Total Bukti</p>
              <p className="text-xl font-black text-white">{logs.length} Snapshot</p>
            </div>
          </div>
        </DialogHeader>

        {/* BODY: GRID FOTO */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/50 scrollbar-thin">
          {logs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {logs.map((log: any, idx: number) => (
                <div key={idx} className="group flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  
                  {/* Container Gambar */}
                  <div className="relative aspect-video overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img 
                      src={getUniversalImageUrl(log.snapshot_url)} 
                      alt="Bukti Pelanggaran" 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                    />
                    
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button asChild variant="secondary" size="sm" className="rounded-lg font-bold shadow-xl">
                        <a href={getUniversalImageUrl(log.snapshot_url)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" /> Buka Penuh
                        </a>
                      </Button>
                    </div>

                    <div className="absolute top-2 left-2">
                       <Badge className="bg-rose-600/90 text-white border-0 text-[9px] font-black backdrop-blur-sm shadow-sm rounded-md px-2 py-0.5">
                         {log.violation_type === "SNAPSHOT" ? "REAL-TIME MONITOR" : "AUTO TRIGGER"}
                       </Badge>
                    </div>
                  </div>

                  {/* Keterangan Pelanggaran */}
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 uppercase leading-tight">
                        {getViolationLabel(log.violation_type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(log.created_at), "HH:mm:ss", { locale: idLocale })} WIB
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        IMG_{idx+1}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <ImageIcon className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-bold text-slate-700 text-lg">Tertib & Aman</p>
              <p className="text-sm text-slate-500 max-w-xs text-center mt-1">
                Belum ada rekaman aktivitas mencurigakan yang tertangkap sistem.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-white p-4 border-t border-slate-100 flex items-center justify-between shrink-0 rounded-b-xl">
          <p className="text-[10px] font-semibold text-slate-400 hidden sm:block italic px-2">
            *Sistem mengambil snapshot secara otomatis saat mendeteksi anomali.
          </p>
          <Button 
            onClick={onClose} 
            variant="outline"
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold h-10 px-6 shadow-sm border-slate-200 active:scale-95 transition-all w-full sm:w-auto"
          >
            Tutup Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}