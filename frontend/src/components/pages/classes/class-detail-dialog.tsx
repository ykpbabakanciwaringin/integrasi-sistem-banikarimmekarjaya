// LOKASI: src/components/pages/classes/class-detail-dialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Layers, Shapes, Building2, BookOpen, UserCheck, Users } from "lucide-react";

export interface ClassDetailItem {
  id: string;
  name: string;
  level: string;
  major: string;
  institution_id: string;
  student_count?: number; // 
  institution?: { name: string };
  teacher?: any;
}

interface ClassDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: ClassDetailItem | null;
  getInstName: (item: ClassDetailItem) => string;
}

export function ClassDetailDialog({ open, onOpenChange, classItem, getInstName }: ClassDetailDialogProps) {
  if (!classItem) return null;

  const teacherName = classItem.teacher?.profile?.full_name || classItem.teacher?.full_name || classItem.teacher?.name || "Belum Diatur";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        
        <DialogHeader className="p-8 bg-[#043425] text-white shrink-0 relative overflow-hidden flex flex-col items-center">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="flex flex-col items-center gap-4 relative z-10">
            <Avatar className="h-24 w-24 border-4 border-white/20 bg-white shadow-2xl rounded-2xl p-1">
              <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-4xl rounded-xl">
                {classItem.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-tight">
                {classItem.name}
              </DialogTitle>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30 px-3 tracking-wide font-mono">
                {classItem.level ? `TINGKAT ${classItem.level}` : "UMUM"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/50 space-y-5 max-h-[55vh] overflow-y-auto">
          
          {/* BLOK 1: IDENTITAS KELAS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 transition-all hover:shadow-md">
             <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 pb-2 flex items-center gap-2">
              <Shapes className="h-3.5 w-3.5 text-emerald-600" /> Identitas Kelas
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <InfoRow icon={<Layers className="h-4 w-4" />} label="Tingkat Pembelajaran" value={`Tingkat ${classItem.level}`} />
              <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Jurusan / Peminatan" value={classItem.major} />
              {/*  STATISTIK SISWA */}
              <InfoRow icon={<Users className="h-4 w-4" />} label="Total Siswa" value={`${classItem.student_count || 0} Siswa Aktif`} valueClass="text-emerald-600" />
            </div>
          </div>

          {/* BLOK 2: MANAJEMEN & LEMBAGA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 transition-all hover:shadow-md">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Manajemen & Lembaga
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <InfoRow 
                icon={<UserCheck className="h-4 w-4" />} 
                label="Wali Kelas" 
                value={teacherName} 
                valueClass={teacherName === "Belum Diatur" ? "text-rose-500 italic" : "text-indigo-700"}
              />
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Lembaga Naungan" value={getInstName(classItem)} />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-white p-4 border-t border-slate-100 shrink-0 rounded-b-2xl">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full h-11 rounded-xl bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100">
            Tutup Informasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const InfoRow = ({ icon, label, value, valueClass = "text-slate-800" }: { icon: any; label: string; value: string; valueClass?: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
      {icon} <span>{label}</span>
    </div>
    <span className={`font-bold text-sm break-words ${valueClass}`}>{value || "-"}</span>
  </div>
);