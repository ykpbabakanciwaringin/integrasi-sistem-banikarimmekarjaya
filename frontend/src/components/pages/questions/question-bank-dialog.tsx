// LOKASI: src/components/pages/questions/question-bank-dialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Layers, Building2, BookOpen, GraduationCap, Save, AlignLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { subjectService } from "@/services/subject.service";
import { classService } from "@/services/class.service";
import { toast } from "sonner";

interface QuestionBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: any;
  institutions: any[];
  isSuperAdmin: boolean;
  userInstId: string;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

const InputLabel = ({ icon, text }: { icon?: React.ReactNode; text: string; }) => (
  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
    {icon} {text}
  </Label>
);

export function QuestionBankDialog({
  open, onOpenChange, isEditMode, initialData, institutions, isSuperAdmin, userInstId, onSubmit, isLoading,
}: QuestionBankDialogProps) {
  
  const [formData, setFormData] = useState({
    title: "", subject_id: "", grade_level: "", institution_id: isSuperAdmin ? "" : userInstId,
  });

  // Sinkronisasi data saat modal dibuka
  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        setFormData({
          title: initialData.title || "", 
          subject_id: initialData.subject_id || "",
          grade_level: initialData.grade_level ? String(initialData.grade_level) : "",
          institution_id: initialData.institution_id || (isSuperAdmin ? "" : userInstId),
        });
      } else {
        setFormData({ title: "", subject_id: "", grade_level: "", institution_id: isSuperAdmin ? "" : userInstId });
      }
    }
  }, [open, isEditMode, initialData, isSuperAdmin, userInstId]);

  const formInstID = isSuperAdmin ? formData.institution_id : userInstId;

  // 1. Mengambil Data Mata Pelajaran
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["subjects-form-dialog", formInstID],
    queryFn: async () => {
      if (!formInstID) return [];
      const res = await subjectService.getAllSubjects({ page: 1, limit: 1000, institution_id: formInstID });
      return (res as any).data || res || [];
    },
    enabled: open && !!formInstID,
  });

  // 2. Mengambil Data Kelas untuk Ekstraksi Tingkatan Kelas
  const { data: classesData = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["classes-form-dialog", formInstID],
    queryFn: async () => {
      if (!formInstID) return [];
      const res = await classService.getAll({ page: 1, limit: 500, institution_id: formInstID });
      return (res as any).data || res || [];
    },
    enabled: open && !!formInstID,
  });

  // 3. Memfilter Tingkat Kelas agar Unik dan Berurutan
  const uniqueGradeLevels = useMemo<string[]>(() => {
    if (!classesData || classesData.length === 0) return [];
    
    // Mengekstrak properti level / grade_level dari data kelas
    const levels = classesData
      .map((c: any) => c.level || c.grade_level)
      .filter((val: any) => val !== null && val !== undefined)
      .map(String);
      
    // Menghilangkan duplikat dan mengurutkan dari kecil ke besar
    return Array.from(new Set<string>(levels)).sort((a, b) => Number(a) - Number(b));
  }, [classesData]);

  const handleSubmit = () => {
    if (!formData.title || !formData.subject_id || !formData.grade_level) {
      return toast.warning("Mohon lengkapi Judul, Mata Pelajaran, dan Tingkat Kelas");
    }
    if (isSuperAdmin && !formData.institution_id) return toast.warning("Mohon pilih lembaga terlebih dahulu");
    
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[650px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        
        {/* HEADER MODAL */}
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Layers className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Edit Paket Soal" : "Buat Paket Soal Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">
                {isEditMode 
                  ? "Perbarui informasi meta data paket soal ini." 
                  : "Konfigurasi paket soal baru untuk bank data ujian."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* AREA KONTEN FORM */}
        <div className="p-6 bg-slate-50/50 max-h-[75vh] overflow-y-auto space-y-6 custom-scrollbar">
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-5">
            
            {/* Lembaga Pendidikan (Hanya Super Admin) */}
            {isSuperAdmin && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
                <InputLabel icon={<Building2 className="h-4 w-4 text-emerald-600" />} text="Lembaga Pendidikan" />
                <Select 
                  value={formData.institution_id} 
                  onValueChange={(v) => setFormData({ ...formData, institution_id: v, subject_id: "", grade_level: "" })} 
                  disabled={isEditMode || isLoading} // Terkunci jika sedang Edit atau Loading
                >
                  <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-emerald-500 font-medium text-slate-700 shadow-sm">
                    <SelectValue placeholder="Pilih Lembaga Pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((i) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                {isEditMode && <p className="text-[10px] text-amber-600 mt-2 font-medium italic">* Lembaga tidak dapat diubah setelah paket dibuat.</p>}
              </div>
            )}

            {/* Judul Paket Soal */}
            <div>
              <InputLabel icon={<AlignLeft className="h-4 w-4 text-emerald-600" />} text="Judul Paket Soal" />
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                className="h-10 font-bold text-slate-800 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm" 
                placeholder="Contoh: Penilaian Harian Matematika Bab 1" 
                disabled={isLoading} // Terkunci saat Loading
              />
            </div>

            {/* Grid Mapel & Tingkat Kelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Mata Pelajaran */}
              <div>
                <InputLabel 
                  icon={isLoadingSubjects ? <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" /> : <BookOpen className="h-4 w-4 text-emerald-600" />} 
                  text="Mata Pelajaran" 
                />
                <Select 
                  value={formData.subject_id} 
                  onValueChange={(v) => setFormData({ ...formData, subject_id: v })} 
                  disabled={(!formData.institution_id && isSuperAdmin) || isLoading || isLoadingSubjects} // Terkunci berlapis
                >
                  <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-emerald-500 shadow-sm">
                    <SelectValue placeholder={isLoadingSubjects ? "Memuat Mapel..." : "Pilih Mapel..."} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {subjects.length > 0 ? (
                      subjects.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} <span className="text-slate-400 text-[10px] ml-1">({s.code})</span>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-400 text-center font-medium">Belum ada data mapel</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Tingkat Kelas (DINAMIS) */}
              <div>
                <InputLabel 
                  icon={isLoadingClasses ? <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" /> : <GraduationCap className="h-4 w-4 text-emerald-600" />} 
                  text="Tingkat Kelas" 
                />
                <Select 
                  value={formData.grade_level} 
                  onValueChange={(v) => setFormData({ ...formData, grade_level: v })} 
                  disabled={(!formData.institution_id && isSuperAdmin) || isLoading || isLoadingClasses} // Terkunci berlapis
                >
                  <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-emerald-500 shadow-sm">
                    <SelectValue placeholder={isLoadingClasses ? "Memuat Tingkatan..." : "Pilih Tingkat..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueGradeLevels.length > 0 ? (
                      uniqueGradeLevels.map((l) => (
                        <SelectItem key={l} value={l} className="font-semibold text-slate-700">
                          Kelas {l}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-400 text-center font-medium">Belum ada data kelas</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-end gap-3 rounded-b-xl">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading} 
            className="text-slate-600 border-slate-200 hover:bg-slate-100 h-10 px-4 font-bold"
          >
            Batal
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all h-10 px-6 font-bold border-0" 
            onClick={handleSubmit} 
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan...</>
            ) : isEditMode ? (
              <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>
            ) : (
              <><Layers className="mr-2 h-4 w-4" /> Buat Paket Soal</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}