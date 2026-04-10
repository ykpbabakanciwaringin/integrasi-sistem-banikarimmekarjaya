// LOKASI: src/components/pages/master-academic/academic-year-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarCheck, Building2, Pencil } from "lucide-react";
import { AcademicYear, Institution } from "@/types/master-academic";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface AcademicYearFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: Partial<AcademicYear>;
  onSubmit: (data: Partial<AcademicYear>) => void;
  isLoading: boolean;
  institutions?: Institution[];
  isSuperAdmin?: boolean;
}

export function AcademicYearFormDialog({
  open,
  onOpenChange,
  isEditMode,
  initialData,
  onSubmit,
  isLoading,
  institutions = [],
  isSuperAdmin = false,
}: AcademicYearFormDialogProps) {
  const [formData, setFormData] = useState<Partial<AcademicYear>>({
    name: "",
    semester: "Ganjil",
    institution_id: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: initialData.name || "",
        semester: initialData.semester || "Ganjil",
        institution_id: initialData.institution_id || "",
      });
    } else {
      // Membersihkan form saat ditutup agar tidak bocor ke sesi berikutnya
      setFormData({ name: "", semester: "Ganjil", institution_id: "" });
    }
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[450px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl"
      >
        <VisuallyHidden.Root>
          <DialogTitle>Form Tahun Ajaran</DialogTitle>
        </VisuallyHidden.Root>

        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              {isEditMode ? (
                <Pencil className="h-6 w-6 text-emerald-400" />
              ) : (
                <CalendarCheck className="h-6 w-6 text-emerald-400" />
              )}
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Edit Tahun Ajaran" : "Tahun Ajaran Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs font-medium">
                Kelola periode akademik untuk lembaga Anda.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 bg-slate-50/50">
          
          {/* HANYA MUNCUL JIKA SUPER ADMIN */}
          {isSuperAdmin && (
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Target Lembaga Pendidikan <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.institution_id}
                onValueChange={(val) => setFormData({ ...formData, institution_id: val })}
              >
                <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 focus:ring-emerald-500 transition-colors">
                  <SelectValue placeholder="Pilih Lembaga Penerima..." />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Tahun Ajaran <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Cth: 2024/2025"
                className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Semester <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.semester}
                onValueChange={(val) => setFormData({ ...formData, semester: val as "Ganjil" | "Genap" })}
              >
                <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-emerald-500 shadow-sm">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ganjil">Ganjil</SelectItem>
                  <SelectItem value="Genap">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 rounded-b-xl">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 font-semibold">
            Batal
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95 transition-all font-bold px-6"
            onClick={() => onSubmit(formData)}
            disabled={isLoading || !formData.name || (isSuperAdmin && !formData.institution_id)}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Simpan Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}