// LOKASI: src/components/pages/manage-exams/[eventId]/exam-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Loader2, CalendarClock, Clock, BookOpen, KeyRound, Save, 
  Users, UserCheck, Pencil, Dices, Building2 
} from "lucide-react";

interface ExamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData?: any | null;
  eventId: string;
  institutionId: string; 
  institutionName?: string; 
  onSubmit: (data: any) => void;
  isLoading: boolean;
  availableSubjects: any[];
  availableTeachers: any[];
}

export function ExamFormDialog({
  open, onOpenChange, isEditMode, initialData, eventId, institutionId,
  institutionName, onSubmit, isLoading, availableSubjects, availableTeachers,
}: ExamFormDialogProps) {
  
  // [PERBAIKAN]: Menambahkan pemisahan state untuk supervisor_ids dan proctor_ids
  const defaultForm = {
    title: "", token: "", start_time: "", end_time: "",
    duration_min: 120, 
    subject_names: [] as string[], 
    supervisor_ids: [] as string[],
    proctor_ids: [] as string[],
  };

  const [formData, setFormData] = useState(defaultForm);

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
    } catch (e) { return ""; }
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        const subjects = initialData.subject_list ? initialData.subject_list.split(",").map((s: string) => s.trim()) : [];
        const supervisors = initialData.supervisors ? initialData.supervisors.map((p: any) => p.teacher_id || p.id) : [];
        const proctors = initialData.proctors ? initialData.proctors.map((p: any) => p.teacher_id || p.id) : [];
        
        setFormData({
          title: initialData.title || "", token: initialData.token || "",
          start_time: formatForInput(initialData.start_time), 
          end_time: formatForInput(initialData.end_time),
          duration_min: initialData.duration_min || 120, 
          subject_names: subjects, 
          supervisor_ids: supervisors,
          proctor_ids: proctors,
        });
      } else {
        setFormData({ ...defaultForm, token: generateRandomToken() });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, initialData]);

  const handleChange = (field: string, value: any) => {
    if (field === "token") setFormData((prev) => ({ ...prev, [field]: value.toUpperCase().slice(0, 6) }));
    else setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSubject = (subjectName: string) => {
    setFormData((prev) => ({
      ...prev,
      subject_names: prev.subject_names.includes(subjectName)
        ? prev.subject_names.filter((s) => s !== subjectName)
        : [...prev.subject_names, subjectName]
    }));
  };

  const toggleSupervisor = (teacherId: string) => {
    setFormData((prev) => ({
      ...prev,
      supervisor_ids: prev.supervisor_ids.includes(teacherId)
        ? prev.supervisor_ids.filter((id) => id !== teacherId)
        : [...prev.supervisor_ids, teacherId]
    }));
  };

  const toggleProctor = (teacherId: string) => {
    setFormData((prev) => ({
      ...prev,
      proctor_ids: prev.proctor_ids.includes(teacherId)
        ? prev.proctor_ids.filter((id) => id !== teacherId)
        : [...prev.proctor_ids, teacherId]
    }));
  };

  const handleSubmit = () => {
    if (!institutionId) return toast.error("ID Lembaga belum terbaca oleh sistem.");
    if (formData.subject_names.length === 0) return toast.error("Pilih minimal 1 mata pelajaran.");
    
    // [PENYEMPURNAAN]: Payload kini memisahkan supervisor dan proctor
    const payload = {
      exam_event_id: eventId,
      institution_id: institutionId,
      title: formData.title,
      token: formData.token,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      duration_min: Number(formData.duration_min),
      subject_list: formData.subject_names.join(", "), 
      supervisor_ids: formData.supervisor_ids,
      proctor_ids: formData.proctor_ids
    };

    onSubmit(payload);
  };

  const isTimeValid = formData.start_time && formData.end_time ? new Date(formData.end_time).getTime() > new Date(formData.start_time).getTime() : false;
  const isFormValid = formData.title && formData.token && formData.start_time && formData.end_time && formData.duration_min > 0 && isTimeValid && formData.subject_names.length > 0;

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      {/* Melebarkan sedikit modal agar 3 kolom terlihat lebih proporsional */}
      <DialogContent aria-describedby={undefined} className="sm:max-w-[850px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              {isEditMode ? <Pencil className="h-6 w-6 text-emerald-400" /> : <CalendarClock className="h-6 w-6 text-emerald-400" />}
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Perbarui Jadwal Sesi" : "Buat Jadwal Sesi Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs mt-1">
                Lengkapi parameter sesi ujian beserta mata pelajaran dan petugas yang ditugaskan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 bg-slate-50/80 max-h-[65vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm">
            <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">Sesi ini diatur untuk : {institutionName}</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Judul Sesi Ujian *</Label>
              <Input
                placeholder="Contoh: Penilaian Akhir Semester - Sesi 1 Pagi"
                value={formData.title} onChange={(e) => handleChange("title", e.target.value)}
                className="h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm placeholder:text-slate-400"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Token Akses *</Label>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="6 Karakter" value={formData.token} onChange={(e) => handleChange("token", e.target.value)}
                      className="pl-9 h-10 bg-white border-slate-200 font-mono font-bold tracking-widest text-emerald-700 focus-visible:ring-emerald-500 uppercase shadow-sm"
                      maxLength={6} disabled={isLoading}
                    />
                  </div>
                  <Button variant="outline" size="icon" type="button" onClick={() => handleChange("token", generateRandomToken())} className="h-10 w-10 shrink-0 border-slate-200 bg-white shadow-sm hover:bg-emerald-50 hover:text-emerald-600">
                    <Dices className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Durasi (Menit) *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input type="number" value={formData.duration_min} onChange={(e) => handleChange("duration_min", e.target.value)} className="pl-9 h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm" min={1} disabled={isLoading} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dibuka Pada *</Label>
                <Input type="datetime-local" value={formData.start_time} onChange={(e) => handleChange("start_time", e.target.value)} className="h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>Ditutup Pada *</span>
                  {!isTimeValid && formData.end_time && <span className="text-[10px] text-rose-500 normal-case font-semibold">Tidak valid!</span>}
                </Label>
                <Input type="datetime-local" value={formData.end_time} onChange={(e) => handleChange("end_time", e.target.value)} className={`h-10 bg-white border-slate-200 text-sm shadow-sm ${!isTimeValid && formData.end_time ? 'border-rose-300 focus-visible:ring-rose-500 bg-rose-50' : 'focus-visible:ring-emerald-500'}`} disabled={isLoading} />
              </div>
            </div>
          </div>

          {/* [PENYEMPURNAAN]: Merubah layout menjadi 3 Kolom (Mapel, Pengawas, Proktor) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* KOLOM 1: MAPEL */}
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Mata Pelajaran</span>
              </Label>
              <ScrollArea className="h-[150px] pr-2">
                {availableSubjects?.length === 0 ? (
                  <p className="text-xs text-center py-6 text-slate-400">Data mapel kosong.</p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {availableSubjects?.map((sub) => (
                      <Label key={sub.id} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer border transition-colors ${formData.subject_names.includes(sub.name) ? "bg-indigo-50/50 border-indigo-200 text-indigo-800" : "bg-white border-transparent hover:bg-slate-50"}`}>
                        <Checkbox checked={formData.subject_names.includes(sub.name)} onCheckedChange={() => toggleSubject(sub.name)} disabled={isLoading} className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
                        <span className="text-xs font-semibold truncate leading-tight">{sub.name}</span>
                      </Label>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* KOLOM 2: PENGAWAS RUANG */}
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-amber-600" /> Pengawas</span>
              </Label>
              <ScrollArea className="h-[150px] pr-2">
                {availableTeachers?.length === 0 ? (
                  <p className="text-xs text-center py-6 text-slate-400">Data guru kosong.</p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {availableTeachers?.map((tch) => {
                      const teacherName = tch.profile?.full_name || tch.full_name || tch.user?.profile?.full_name || tch.name || "Nama Guru";
                      return (
                        <Label key={`sup-${tch.id}`} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer border transition-colors ${formData.supervisor_ids.includes(tch.id) ? "bg-amber-50/50 border-amber-200 text-amber-800" : "bg-white border-transparent hover:bg-slate-50"}`}>
                          <Checkbox checked={formData.supervisor_ids.includes(tch.id)} onCheckedChange={() => toggleSupervisor(tch.id)} disabled={isLoading} className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600" />
                          <span className="text-xs font-semibold truncate leading-tight">{teacherName}</span>
                        </Label>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* KOLOM 3: PROKTOR / TEKNISI */}
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-sky-600" /> Proktor</span>
              </Label>
              <ScrollArea className="h-[150px] pr-2">
                {availableTeachers?.length === 0 ? (
                  <p className="text-xs text-center py-6 text-slate-400">Data guru kosong.</p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {availableTeachers?.map((tch) => {
                      const teacherName = tch.profile?.full_name || tch.full_name || tch.user?.profile?.full_name || tch.name || "Nama Guru";
                      return (
                        <Label key={`proc-${tch.id}`} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer border transition-colors ${formData.proctor_ids.includes(tch.id) ? "bg-sky-50/50 border-sky-200 text-sky-800" : "bg-white border-transparent hover:bg-slate-50"}`}>
                          <Checkbox checked={formData.proctor_ids.includes(tch.id)} onCheckedChange={() => toggleProctor(tch.id)} disabled={isLoading} className="data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600" />
                          <span className="text-xs font-semibold truncate leading-tight">{teacherName}</span>
                        </Label>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 sm:justify-between rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 bg-white border-slate-200">Batal</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-md active:scale-95 transition-all" onClick={handleSubmit} disabled={isLoading || !isFormValid}>
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditMode ? "Simpan Perubahan" : "Buat Jadwal Sesi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}