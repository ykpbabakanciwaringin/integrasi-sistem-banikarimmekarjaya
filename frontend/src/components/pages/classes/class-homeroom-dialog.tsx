// LOKASI: src/components/pages/classes/class-homeroom-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/axios";

interface ClassHomeroomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: any | null;
  onSubmit: (classId: string, teacherId: string) => void;
  isLoading: boolean;
}

export function ClassHomeroomDialog({ open, onOpenChange, classItem, onSubmit, isLoading }: ClassHomeroomDialogProps) {
  const [teacherId, setTeacherId] = useState<string>("");

  const { data: teachers = [], isLoading: isLoadingTeachers, refetch } = useQuery({
    queryKey: ["teachers_list", classItem?.institution_id],
    queryFn: async () => {
      const res = await api.get("/teachers", { params: { limit: 1000, institution_id: classItem?.institution_id } });
      return res.data?.data || res.data || [];
    },
    enabled: open && !!classItem?.institution_id,
    staleTime: 0,
  });

  useEffect(() => {
    if (open && classItem) {
      setTeacherId(classItem.teacher_id || "");
      refetch();
    }
  }, [open, classItem, refetch]);

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      {/*  SELARAS DENGAN LEMBAGA: bg-white */}
      <DialogContent aria-describedby={undefined} className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <UserCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">Set Wali Kelas</DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">Tentukan wali kelas untuk rombel <b>{classItem?.name}</b></DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/*  SELARAS DENGAN LEMBAGA: bg-slate-50/50 inner wrapper */}
        <div className="p-6 bg-slate-50/50">
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-3">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pilih Guru</Label>
            <Select value={teacherId} onValueChange={setTeacherId} disabled={isLoading || isLoadingTeachers}>
              <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-emerald-500">
                <SelectValue placeholder={isLoadingTeachers ? "Memuat data guru..." : "Pilih Wali Kelas"} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(teachers) && teachers.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.profile?.full_name || t.full_name || t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teachers.length === 0 && !isLoadingTeachers && (
              <p className="text-[11px] text-rose-500 font-medium bg-rose-50 p-2 rounded border border-rose-100">
                Belum ada data guru di lembaga ini. Silakan tambah guru terlebih dahulu.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500">Batal</Button>
          <Button className="bg-[#043425] hover:bg-[#054a35] text-white shadow-md active:scale-95 transition-all" onClick={() => classItem && onSubmit(classItem.id, teacherId)} disabled={isLoading || !teacherId}>
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan...</> : "Simpan Wali Kelas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}