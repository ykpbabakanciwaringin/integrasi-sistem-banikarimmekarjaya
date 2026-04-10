// LOKASI: src/app/dashboard/manage-exams/event-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarRange, Save, Building2, Pencil, ShieldAlert, BookOpen, AlertTriangle } from "lucide-react";
import { ExamEvent } from "@/types/exam";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData?: ExamEvent | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  institutions: any[];
  isSuperAdmin: boolean;
  userInstId: string;
}

export function EventFormDialog({
  open,
  onOpenChange,
  isEditMode,
  initialData,
  onSubmit,
  isLoading,
  institutions,
  isSuperAdmin,
  userInstId,
}: EventFormDialogProps) {
  
  const defaultForm = {
    institution_id: isSuperAdmin ? "" : userInstId,
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: false,
    is_seb_required: false,
    room_count: 1, 
    subject_count: 1, 
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        // [PENYEMPURNAAN KINERJA]: Logika Timezone absolut bebas bug browser (Safari/Mobile)
        const formatForInput = (isoString?: string) => {
          if (!isoString) return "";
          try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return "";
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          } catch (e) {
            return "";
          }
        };
        
        setFormData({
          institution_id: initialData.institution_id || (isSuperAdmin ? "" : userInstId),
          title: initialData.title || "",
          description: initialData.description || "",
          start_date: formatForInput(initialData.start_date),
          end_date: formatForInput(initialData.end_date),
          is_active: initialData.is_active || false,
          is_seb_required: initialData.is_seb_required || false,
          room_count: initialData.room_count || 1,
          subject_count: initialData.subject_count || 1,
        });
      } else {
        setFormData({
          ...defaultForm,
          institution_id: isSuperAdmin ? "" : userInstId,
          room_count: 1, 
          subject_count: 1,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, initialData, isSuperAdmin, userInstId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
    };
    onSubmit(payload);
  };

  const isFormValid = 
    formData.title && 
    formData.start_date && 
    formData.end_date && 
    formData.room_count >= 1 &&
    formData.subject_count >= 1 &&
    (!isSuperAdmin || formData.institution_id);

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[650px] p-0 overflow-hidden border-0 shadow-2xl rounded-xl bg-white">
        
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              {isEditMode ? <Pencil className="h-6 w-6 text-emerald-400" /> : <CalendarRange className="h-6 w-6 text-emerald-400" />}
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Perbarui Kegiatan Ujian" : "Buat Kegiatan Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">
                Lengkapi informasi di bawah untuk mengatur jadwal, ruangan, dan pengamanan ujian.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 bg-slate-50/50 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-5">
            
            {isSuperAdmin && (
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <Label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5 tracking-wider">
                  <Building2 className="w-3.5 h-3.5" /> Lembaga Penyelenggara {!isEditMode && "*"}
                </Label>
                {isEditMode ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-500 shadow-sm flex flex-col gap-1">
                    <span className="font-semibold text-slate-700 block">Terkunci (Mode Edit)</span>
                    <span className="text-[10px] italic text-amber-600">Lembaga tidak dapat diubah setelah kegiatan dibuat.</span>
                  </div>
                ) : (
                  <Select value={formData.institution_id} onValueChange={(v) => handleChange("institution_id", v)} disabled={isLoading}>
                    <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-emerald-500 shadow-sm text-sm">
                      <SelectValue placeholder="Pilih Lembaga Penyelenggara" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                      {institutions?.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Kegiatan Ujian *</Label>
              <Input
                placeholder="Contoh: Penilaian Akhir Semester (PAS) Ganjil 2024"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi (Opsional)</Label>
              <Input
                placeholder="Keterangan tambahan atau tahun ajaran..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Mulai *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-sm"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Selesai *</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => handleChange("end_date", e.target.value)}
                  className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Jumlah Ruangan *
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Contoh: 5"
                  value={formData.room_count}
                  onChange={(e) => handleChange("room_count", parseInt(e.target.value) || 1)}
                  className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-sm font-semibold"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Maks. Mapel / Sesi *
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Contoh: 8"
                  value={formData.subject_count}
                  onChange={(e) => handleChange("subject_count", parseInt(e.target.value) || 1)}
                  className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-sm font-semibold"
                  disabled={isLoading}
                />
              </div>
              
              {/* [PENYEMPURNAAN UI/UX]: Peringatan saat merubah kerangka kolom di mode Edit */}
              {isEditMode ? (
                <div className="col-span-1 md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 mt-1 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-800">Perhatian: Modifikasi Kerangka Ujian</p>
                    <p className="text-[11px] leading-relaxed text-amber-700/90">
                      Mengubah Jumlah Ruangan atau Maksimal Mapel akan merubah susunan kerangka kolom pada Excel. Jika Anda sudah mengunduh Template Sesi Ujian, Anda harus mengunduh ulang template yang baru.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="col-span-1 md:col-span-2">
                  <p className="text-[10px] leading-relaxed text-slate-400 italic">
                    * Angka ini akan otomatis membentuk struktur kerangka kolom Pengawas, Proktor, dan Mata Pelajaran saat Anda mengunduh Template Excel Jadwal Sesi.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 bg-rose-50/80 border border-rose-100 rounded-xl shadow-sm hover:border-rose-200 transition-colors">
              <div className="space-y-1">
                <Label className="text-sm font-bold text-rose-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Wajibkan Safe Exam Browser
                </Label>
                <p className="text-[11px] text-rose-600/80 pr-4 leading-relaxed font-medium">
                  Kunci antarmuka ujian dan blokir akses dari browser biasa (Chrome/Safari).
                </p>
              </div>
              <Switch
                checked={formData.is_seb_required}
                onCheckedChange={(v) => handleChange("is_seb_required", v)}
                disabled={isLoading}
                className="data-[state=checked]:bg-rose-600 shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
              <div className="space-y-1">
                <Label className="text-sm font-bold text-slate-800">Status Kegiatan Aktif</Label>
                <p className="text-[11px] text-slate-500 font-medium">Aktifkan agar sesi ujian di dalamnya bisa dijalankan oleh peserta.</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => handleChange("is_active", v)}
                disabled={isLoading}
                className="data-[state=checked]:bg-emerald-600 shadow-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-white border-t border-slate-100 flex justify-between items-center sm:justify-between rounded-b-xl shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-10 px-4 font-semibold">
            Batal
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all h-10 px-6 font-bold"
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Memproses...</> : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? "Simpan Perubahan" : "Buat Kegiatan"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}