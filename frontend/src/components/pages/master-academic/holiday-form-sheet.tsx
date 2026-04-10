// LOKASI: src/components/pages/master-academic/holiday-form-sheet.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarOff, Globe, Building2, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

import { curriculumService } from "@/services/curriculum.service";
import { Holiday, Institution } from "@/types/master-academic";

interface HolidayFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: Partial<Holiday>;
  institutions: Institution[];
  isSuperAdmin: boolean;
  userInstId: string;
}

export function HolidayFormSheet({ open, onOpenChange, isEditMode, initialData, institutions, isSuperAdmin, userInstId }: HolidayFormSheetProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Holiday>>({});

  useEffect(() => {
    if (open) setFormData({ ...initialData });
  }, [initialData, open]);

  const mutation = useMutation({
    mutationFn: async (data: Partial<Holiday>) => {
      const payload: any = { ...data };
      if (payload.is_global) delete payload.institution_id;
      if (!isSuperAdmin) payload.institution_id = userInstId;

      if (isEditMode && payload.id) return curriculumService.updateHoliday(payload.id, payload);
      return curriculumService.createHoliday(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      onOpenChange(false);
      toast.success(isEditMode ? "Libur diperbarui" : "Libur ditambahkan");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menyimpan data"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px] p-0 flex flex-col bg-white border-l border-slate-200 shadow-2xl">
        <SheetHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
           <SheetTitle className="text-xl font-bold text-white flex items-center gap-2 relative z-10">
             <CalendarOff className="h-5 w-5 text-emerald-400" /> {isEditMode ? "Edit Libur" : "Tambah Libur"}
           </SheetTitle>
           <SheetDescription className="text-emerald-100/80 text-xs relative z-10">
             Lengkapi detail hari libur insidental di bawah ini.
           </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
          {isSuperAdmin && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-white shadow-sm transition-all hover:border-emerald-200">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-600"/> Libur Global?</Label>
                <p className="text-[10px] text-slate-500">Berlaku untuk semua lembaga.</p>
              </div>
              <Switch checked={formData.is_global} onCheckedChange={(c) => setFormData({ ...formData, is_global: c, institution_id: c ? "" : formData.institution_id })} className="data-[state=checked]:bg-emerald-600" />
            </div>
          )}

          {(!formData.is_global && isSuperAdmin) && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-emerald-600"/> Target Lembaga</Label>
              <Select value={formData.institution_id || ""} onValueChange={(v) => setFormData({ ...formData, institution_id: v })}>
                <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Pilih Lembaga..." /></SelectTrigger>
                <SelectContent className="max-h-[250px] rounded-xl">{institutions.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Tanggal Libur <span className="text-rose-500">*</span></Label>
              <Input type="date" value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="h-11 rounded-xl bg-white shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Keterangan / Acara <span className="text-rose-500">*</span></Label>
              <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: Hari Raya Idul Fitri" className="h-11 rounded-xl bg-white shadow-sm" />
            </div>
          </div>
        </div>

        <SheetFooter className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 font-bold rounded-xl hover:bg-slate-100">Batal</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all font-bold px-6 rounded-xl" onClick={() => mutation.mutate(formData)} disabled={mutation.isPending || !formData.date || !formData.name || (!formData.is_global && isSuperAdmin && !formData.institution_id)}>
            {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <CalendarCheck className="w-4 h-4 mr-2"/>} Simpan Libur
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}