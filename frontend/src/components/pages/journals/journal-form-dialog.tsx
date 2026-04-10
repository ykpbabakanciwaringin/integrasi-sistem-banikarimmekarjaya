// LOKASI: src/components/pages/journals/journal-form-dialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BookOpenCheck, Calendar, GraduationCap, Link as LinkIcon, FileText, Edit3, Lock } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import dayjs from "dayjs";
import 'dayjs/locale/id';

import { scheduleService } from "@/services/schedule.service";
import { academicYearService } from "@/services/academic-year.service";
import { useAuthStore } from "@/stores/use-auth-store";

interface JournalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  defaultAllocationId?: string;
  journal?: any;
}

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

// Fungsi konversi hari (0 = Ahad, 1 = Senin, dst ke teks bahasa Indonesia)
const getIndonesianDay = (dateString: string) => {
  const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayIndex = dayjs(dateString).day();
  return days[dayIndex].toUpperCase();
};

export function JournalFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultAllocationId,
  journal,
}: JournalFormDialogProps) {
  const { user } = useAuthStore();
  const isTeacher = user?.role === "TEACHER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"; // Admin bebas hambatan
  const userInstId = user?.institution_id || "";

  const [formData, setFormData] = useState({
    teaching_allocation_id: "",
    date: dayjs().format("YYYY-MM-DD"),
    topic: "",
    description: "",
    attachment_link: "",
    has_assignment: "false",
    assignment_detail: "",
    started_at: "",
  });

  useEffect(() => {
    if (open) {
      if (journal) {
        setFormData({
          teaching_allocation_id: journal.teaching_allocation_id || defaultAllocationId || "",
          date: journal.date ? dayjs(journal.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
          topic: journal.topic || "",
          description: journal.description || "",
          attachment_link: journal.attachment_link || "",
          has_assignment: journal.has_assignment ? "true" : "false",
          assignment_detail: journal.assignment_detail || "",
          started_at: journal.started_at || new Date().toISOString(),
        });
      } else {
        setFormData({
          teaching_allocation_id: defaultAllocationId || "",
          date: dayjs().format("YYYY-MM-DD"),
          topic: "",
          description: "",
          attachment_link: "",
          has_assignment: "false",
          assignment_detail: "",
          started_at: new Date().toISOString(),
        });
      }
    }
  }, [open, journal, defaultAllocationId]);

  const { data: activeAy } = useQuery({
    queryKey: ["active_ay_journal", userInstId],
    queryFn: () => academicYearService.getActive(userInstId),
    enabled: open && !!userInstId,
  });

  const { data: allocsRes, isLoading: loadingAllocs } = useQuery({
    queryKey: ["allocs_for_journal", userInstId, activeAy?.id],
    queryFn: () => scheduleService.getAllocations({
      institution_id: userInstId,
      academic_year_id: activeAy?.id,
      teacher_id: isTeacher ? user?.id : undefined,
    }),
    enabled: open && !!userInstId && !!activeAy?.id,
  });
  
  const allAllocations = extractArray(allocsRes);

  //  FILTER CERDAS SOP: Hanya tampilkan jadwal yang harinya SAMA dengan hari yang dipilih di form
  // (Jika Guru, tanggal form dikunci hari ini, sehingga otomatis hanya jadwal hari ini yang muncul)
  const filteredAllocations = useMemo(() => {
    // Jika SuperAdmin/Admin, biarkan mereka melihat semua jadwal tanpa filter hari
    if (isSuperAdmin) return allAllocations;

    // Jika mode edit, kita tetap memunculkan alokasi jurnal tersebut walaupun beda hari (untuk perbaikan data/topic)
    if (journal) return allAllocations;

    const selectedDayName = getIndonesianDay(formData.date);
    
    return allAllocations.filter((a: any) => {
      const scheduleDay = a.day_of_week?.toUpperCase() || "";
      // Jika di database tidak ada day_of_week, tampilkan saja agar tidak nge-bug
      if (!scheduleDay) return true; 
      return scheduleDay === selectedDayName;
    });
  }, [allAllocations, formData.date, isSuperAdmin, journal]);

  const isFormValid = formData.teaching_allocation_id && formData.date && formData.topic.trim().length > 0;

  const handleSave = () => {
    const payload = { 
      ...formData, 
      institution_id: userInstId,
      has_assignment: formData.has_assignment === "true",
      ended_at: new Date().toISOString() 
    };
    onSubmit(payload);
  };

  const isEditMode = !!journal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl border-0 shadow-2xl bg-white max-h-[90vh] overflow-y-auto scrollbar-thin">
        <VisuallyHidden.Root><DialogTitle>{isEditMode ? "Edit Jurnal KBM" : "Input Jurnal KBM"}</DialogTitle></VisuallyHidden.Root>
        
        <DialogHeader className={`p-6 text-white shrink-0 sticky top-0 z-10 shadow-sm ${isEditMode ? 'bg-amber-600' : 'bg-indigo-600'}`}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
              {isEditMode ? <Edit3 className="h-6 w-6 text-amber-50" /> : <BookOpenCheck className="h-6 w-6 text-indigo-50" />}
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold tracking-tight">
                {isEditMode ? "Edit Jurnal KBM" : "Jurnal KBM & E-Learning"}
              </h2>
              <DialogDescription className="text-white/80 text-xs mt-0.5">
                {isEditMode ? "Perbarui materi, tugas, atau catatan kelas yang sudah lewat." : "Catat materi, lampirkan modul, dan berikan tugas kelas."}
              </DialogDescription>
            </div>
          </div>
          
          {/*  Peringatan SOP Kunci Tanggal untuk Guru */}
          {isTeacher && !isEditMode && (
            <div className="mt-4 flex items-center bg-black/10 p-2 rounded-lg text-xs font-medium border border-white/20">
              <Lock className="w-3.5 h-3.5 mr-2 shrink-0 text-white/80" />
              SOP Aktif: Pengisian jurnal dikunci khusus untuk jadwal hari ini.
            </div>
          )}
        </DialogHeader>

        <div className="p-6 space-y-5 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Tanggal */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Tanggal <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.date}
                //  JIKA GURU DAN BUAT BARU: KUNCI TANGGAL (Tidak bisa diubah)
                disabled={isTeacher && !isEditMode}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value, teaching_allocation_id: "" });
                }}
                className={`bg-white border-slate-200 shadow-sm ${isTeacher && !isEditMode ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
              />
            </div>

            {/* Pilihan Kelas & Mapel */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> Kelas & Mapel <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.teaching_allocation_id}
                onValueChange={(val) => setFormData({ ...formData, teaching_allocation_id: val })}
                disabled={loadingAllocs || !!defaultAllocationId || isEditMode}
              >
                <SelectTrigger className={`border-slate-200 shadow-sm ${defaultAllocationId || isEditMode ? 'bg-slate-100 opacity-80 cursor-not-allowed' : 'bg-white'}`}>
                  <SelectValue placeholder={loadingAllocs ? "Memuat..." : "Pilih Kelas"} />
                </SelectTrigger>
                <SelectContent>
                  {/* Tampilkan pesan jika tidak ada jadwal di hari tersebut */}
                  {filteredAllocations.length === 0 && (
                     <div className="p-3 text-xs text-center text-rose-500 italic">
                        Tidak ada jadwal mengajar untuk hari {getIndonesianDay(formData.date)}.
                     </div>
                  )}
                  {filteredAllocations.map((a: any) => (
                    <SelectItem key={a.id || a.ID} value={a.id || a.ID}>
                      Kelas {a.class?.level || ""}-{a.class?.name || "???"} ({a.subject?.name || "???"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-500 uppercase">
              Topik / Bab Materi <span className="text-rose-500">*</span>
            </Label>
            <Input
              placeholder="Contoh: Bab 1 - Aljabar Linear"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="bg-white border-slate-200 shadow-sm font-medium text-slate-800"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5" /> Link Materi Pembelajaran (Opsional)
            </Label>
            <Input
              placeholder="Masukkan link Google Drive, Video YouTube, Canva, dll..."
              value={formData.attachment_link}
              onChange={(e) => setFormData({ ...formData, attachment_link: e.target.value })}
              className="bg-white border-slate-200 shadow-sm text-blue-600 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-2 md:col-span-1">
              <Label className="text-xs font-bold text-slate-500 uppercase">Ada Tugas/PR?</Label>
              <Select value={formData.has_assignment} onValueChange={(val) => setFormData({ ...formData, has_assignment: val, assignment_detail: val === "false" ? "" : formData.assignment_detail })}>
                <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Tidak Ada</SelectItem>
                  <SelectItem value="true">Ya, Ada Tugas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.has_assignment === "true" && (
              <div className="space-y-2 md:col-span-2 animate-in fade-in zoom-in duration-300">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Detail Tugas
                </Label>
                <Input
                  placeholder="Cth: Kerjakan LKS Hal. 24..."
                  value={formData.assignment_detail}
                  onChange={(e) => setFormData({ ...formData, assignment_detail: e.target.value })}
                  className="bg-amber-50 border-amber-200 focus-visible:ring-amber-500"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-500 uppercase">
              Catatan Kelas (Opsional)
            </Label>
            <Textarea
              placeholder="Tuliskan dinamika kelas hari ini atau kendala yang dihadapi..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white border-slate-200 shadow-sm min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="p-4 bg-white border-t border-slate-100 shrink-0 sticky bottom-0 z-10">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200">
            Batal
          </Button>
          <Button
            className={`${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-md transition-all`}
            onClick={handleSave}
            disabled={isLoading || !isFormValid || filteredAllocations.length === 0}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : isEditMode ? "Simpan Perubahan" : "Simpan & Absen Siswa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}