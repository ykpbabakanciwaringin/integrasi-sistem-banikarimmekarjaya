// LOKASI: src/components/pages/master-academic/subject-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookMarked, Building2, Pencil, Link2 } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import { curriculumService } from "@/services/curriculum.service";
import { Subject, Institution } from "@/types/master-academic";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: Partial<Subject>;
  onSubmit: (data: Partial<Subject>) => void;
  isLoading: boolean;
  institutions?: Institution[];
  isSuperAdmin?: boolean;
}

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export function SubjectFormDialog({
  open, onOpenChange, isEditMode, initialData, onSubmit, isLoading, institutions = [], isSuperAdmin = false,
}: SubjectFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Subject>>({
    code: "", name: "", type: "TEORI", institution_id: "", curriculum_id: "", subject_group_id: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        code: initialData.code || "", name: initialData.name || "", type: initialData.type || "TEORI",
        institution_id: initialData.institution_id || "", curriculum_id: initialData.curriculum_id || "",
        subject_group_id: initialData.subject_group_id || "",
      });
    } else {
      setFormData({ code: "", name: "", type: "TEORI", institution_id: "", curriculum_id: "", subject_group_id: "" });
    }
  }, [initialData, open]);

  const { data: curriculumsRes } = useQuery({
    queryKey: ["curriculums", formData.institution_id],
    queryFn: () => curriculumService.getCurriculums({ institution_id: formData.institution_id }),
    enabled: !!formData.institution_id && open,
  });
  const curriculums = extractArray(curriculumsRes);

  const { data: subjectGroupsRes } = useQuery({
    queryKey: ["subject-groups", formData.curriculum_id],
    queryFn: () => curriculumService.getSubjectGroups(formData.curriculum_id!),
    enabled: !!formData.curriculum_id && open,
  });
  const subjectGroups = extractArray(subjectGroupsRes);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        <VisuallyHidden.Root><DialogTitle>Form Mapel</DialogTitle></VisuallyHidden.Root>
        
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              {isEditMode ? <Pencil className="h-6 w-6 text-emerald-400" /> : <BookMarked className="h-6 w-6 text-emerald-400" />}
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
                {isEditMode ? "Edit Mata Pelajaran" : "Mapel Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs font-medium">
                Kelola master data mata pelajaran lembaga.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 bg-slate-50/50">
          {isSuperAdmin && (
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Target Lembaga <span className="text-rose-500">*</span>
              </Label>
              <Select value={formData.institution_id} onValueChange={(val) => setFormData({ ...formData, institution_id: val, curriculum_id: "", subject_group_id: "" })}>
                <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 focus:ring-emerald-500 transition-colors">
                  <SelectValue placeholder="Pilih Lembaga Penerima..." />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {institutions.map((i) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kode Mapel <span className="text-rose-500">*</span></Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="Cth: MAT" className="h-10 bg-white border-slate-200 uppercase focus-visible:ring-emerald-500 shadow-sm transition-colors" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipe Mapel <span className="text-rose-500">*</span></Label>
              <Select value={formData.type} onValueChange={(val: any) => setFormData({ ...formData, type: val })}>
                <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEORI">Teori</SelectItem>
                  <SelectItem value="PRAKTIK">Praktik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Pelajaran <span className="text-rose-500">*</span></Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Cth: Matematika Wajib" className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm transition-colors" />
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
              <Link2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Penempatan Kurikulum (Opsional)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pilih Kurikulum</Label>
                <Select value={formData.curriculum_id || ""} onValueChange={(val) => setFormData({ ...formData, curriculum_id: val, subject_group_id: "" })}>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {curriculums.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pilih Kelompok</Label>
                <Select value={formData.subject_group_id || ""} onValueChange={(val) => setFormData({ ...formData, subject_group_id: val })} disabled={!formData.curriculum_id}>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 focus:ring-emerald-500"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {subjectGroups.map((g: any) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 rounded-b-2xl">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 font-semibold hover:bg-slate-200/50">Batal</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all font-bold px-6" onClick={() => onSubmit(formData)} disabled={isLoading || !formData.code || !formData.name || (isSuperAdmin && !formData.institution_id)}>
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Simpan Mapel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}