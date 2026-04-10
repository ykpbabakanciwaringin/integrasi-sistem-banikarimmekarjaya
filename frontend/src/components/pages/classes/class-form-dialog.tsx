// LOKASI: src/components/pages/classes/class-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shapes, Building2, Layers, BookOpen } from "lucide-react";

export interface ClassFormPayload {
  id?: string;
  name: string;
  level: string;
  major: string;
  institution_id: string;
}

export interface InstitutionOption {
  id: string;
  name: string;
  level_code?: string;
  category?: string;
}

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: ClassFormPayload | any;
  onSubmit: (data: ClassFormPayload | any) => void;
  isLoading: boolean;
  institutions: InstitutionOption[] | any[];
  isSuperAdmin: boolean;
}

export function ClassFormDialog({
  open, onOpenChange, isEditMode, initialData, onSubmit, isLoading, institutions, isSuperAdmin,
}: ClassFormDialogProps) {
  const [formData, setFormData] = useState<any>(initialData);
  const [options, setOptions] = useState({ levels: [] as string[], majors: [] as string[] });

  useEffect(() => {
    setFormData(initialData);
    if (initialData.institution_id) updateOptions(initialData.institution_id);
  }, [initialData, open]);

  const updateOptions = (instId: string) => {
    const inst = institutions.find((i: any) => i.id === instId);
    if (!inst) return;
    let levels: string[] = [];
    let majors: string[] = ["TIDAK ADA JURUSAN", "UMUM", "MIPA", "IIS", "IBB", "IIK", "EKOS", "MPI"];
    const code = inst.level_code || "";
    const cat = inst.category || "";

    if (code.includes("SD") || code.includes("MI")) levels = ["1", "2", "3", "4", "5", "6"];
    else if (code.includes("SMP") || code.includes("MTs")) levels = ["VII", "VIII", "IX"];
    else if (code.includes("SMA") || code.includes("MA") || code.includes("SMK")) levels = ["X", "XI", "XII"];
    else if (code.includes("TINGGI")) levels = ["SMT-I", "SMT-II", "SMT-III", "SMT-IV", "SMT-V", "SMT-VI", "SMT-VII", "SMT-VIII"];
    else levels = ["ULA", "WUSTHA", "ULYA"];

    if (code.includes("SMA") || code.includes("MA") || code.includes("SMK")) majors = ["TIDAK ADA JURUSAN", "MIPA", "IIS", "IBB", "IIK"];
    else if (code.includes("TINGGI")) majors = ["TIDAK ADA JURUSAN", "EKOS", "MPI"];
    else if (cat === "PONDOK") majors = ["FIQH", "AL-QURAN", "HADITS", "BAHASA ARAB"];

    setOptions({ levels, majors });
  };

  const handleInstChange = (val: string) => {
    setFormData((prev: any) => ({ ...prev, institution_id: val, level: "", major: "" }));
    updateOptions(val);
  };

  const handleChange = (key: string, value: string) => { setFormData((prev: any) => ({ ...prev, [key]: value })); };
  const isFormValid = formData.name && formData.level && formData.major && formData.institution_id;

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      {/*  SELARAS DENGAN LEMBAGA: bg-white */}
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Shapes className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">{isEditMode ? "Edit Data Kelas" : "Buat Kelas Baru"}</DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">Atur nama kelas, tingkat, dan jurusan sesuai lembaga.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/*  SELARAS DENGAN LEMBAGA: bg-slate-50/50 inner wrapper */}
        <div className="p-6 bg-slate-50/50 max-h-[75vh] overflow-y-auto space-y-6">
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-5">
            {/*  SELARAS DENGAN LEMBAGA: Header section khusus */}
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 text-emerald-700 flex items-center gap-2">
              <Shapes className="h-4 w-4" /> Formulir Identitas Kelas
            </h3>

            {isSuperAdmin && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Lembaga Naungan
                </Label>
                <Select value={formData.institution_id} onValueChange={handleInstChange} disabled={isLoading || isEditMode}>
                  <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="Pilih Lembaga" /></SelectTrigger>
                  <SelectContent>{institutions.map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Tingkat</Label>
                <Select value={formData.level} onValueChange={(v) => handleChange("level", v)} disabled={isLoading || !formData.institution_id}>
                  <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="Pilih Tingkat" /></SelectTrigger>
                  <SelectContent>{options.levels.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Jurusan</Label>
                <Select value={formData.major} onValueChange={(v) => handleChange("major", v)} disabled={isLoading || !formData.institution_id}>
                  <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="Pilih Jurusan" /></SelectTrigger>
                  <SelectContent>{options.majors.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Shapes className="h-3.5 w-3.5" /> Nama Kelas *</Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500" placeholder="Contoh: X MIPA 1" disabled={isLoading} />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500">Batal</Button>
          <Button className="bg-[#043425] hover:bg-[#054a35] text-white shadow-md active:scale-95 transition-all" onClick={() => onSubmit(formData)} disabled={isLoading || !isFormValid}>
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan...</> : "Simpan Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}