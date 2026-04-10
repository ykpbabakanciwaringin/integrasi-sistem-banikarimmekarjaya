// LOKASI: src/components/pages/manage-lessons/allocation-form-dialog.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, AlertTriangle } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import { teacherService } from "@/services/teacher.service";
import { subjectService } from "@/services/subject.service";
import { scheduleService } from "@/services/schedule.service";
import { toast } from "sonner";

interface AllocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId: string;
  academicYearId: string;
  classId: string;
}

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export function AllocationFormDialog({
  open,
  onOpenChange,
  institutionId,
  academicYearId,
  classId,
}: AllocationFormDialogProps) {
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const { data: teachersRes, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["teachers", institutionId],
    queryFn: () => teacherService.getAll({ institution_id: institutionId, limit: 1000 }),
    enabled: open && !!institutionId,
  });
  const teachers = extractArray(teachersRes);

  const { data: subjectsRes, isLoading: isLoadingSubjects } = useQuery({
    //  SINKRONISASI: Memastikan key sama dengan yang ada di page.tsx
    queryKey: ["subjects", institutionId],
    queryFn: () => subjectService.getAllSubjects({ institution_id: institutionId, limit: 1000 }),
    enabled: open && !!institutionId,
  });
  const subjects = extractArray(subjectsRes);

  const mutation = useMutation({
    mutationFn: () => scheduleService.createAllocation({
      academic_year_id: academicYearId,
      institution_id: institutionId,
      class_id: classId,
      teacher_id: teacherId,
      subject_id: subjectId,
    } as any),
    onSuccess: (res) => {
      const newAlloc = res.data;
      if (newAlloc) {
        queryClient.setQueryData(["allocations", institutionId, academicYearId, classId], (old: any) => {
          if (!old) return [newAlloc];
          return [...old, newAlloc];
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["allocations", institutionId, academicYearId, classId] });
      }
      
      //  TRIGGER SINKRONISASI MASTER MATRIKS
      queryClient.invalidateQueries({ queryKey: ["allocations_master", institutionId, academicYearId] });
      
      toast.success("Guru berhasil ditugaskan!");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Gagal menugaskan guru"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[400px] p-0 overflow-hidden rounded-xl border-0 bg-white">
        <VisuallyHidden.Root><DialogTitle>Tugaskan Guru</DialogTitle></VisuallyHidden.Root>
        <DialogHeader className="p-6 bg-emerald-600 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-emerald-100" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold">Tugaskan Guru</h2>
              <DialogDescription className="text-emerald-200 text-xs">Pilih guru dan mapel untuk kelas ini.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {!academicYearId && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p><strong>Peringatan:</strong> Anda belum mengaktifkan Tahun Ajaran. Silakan ke menu <em>Tahun Ajaran</em> dan klik <strong>Set Aktif</strong> terlebih dahulu.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500">Pilih Guru <span className="text-rose-500">*</span></Label>
            <Select value={teacherId} onValueChange={setTeacherId} disabled={isLoadingTeachers || !academicYearId}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder={isLoadingTeachers ? "Memuat..." : "Pilih Guru Pengampu"} />
              </SelectTrigger>
              <SelectContent>
                {teachers.length > 0 ? teachers.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.profile?.full_name || t.full_name || t.username || "Guru Tanpa Nama"}
                  </SelectItem>
                )) : (
                  <SelectItem value="empty" disabled>Belum ada data guru</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500">Mata Pelajaran <span className="text-rose-500">*</span></Label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={isLoadingSubjects || !academicYearId}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                 <SelectValue placeholder={isLoadingSubjects ? "Memuat..." : "Pilih Mata Pelajaran"} />
              </SelectTrigger>
              <SelectContent>
                {subjects.length > 0 ? subjects.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                )) : (
                  <SelectItem value="empty" disabled>Belum ada mata pelajaran</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button 
            className="bg-[#047857] hover:bg-[#065f46] text-white" 
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending || !teacherId || !subjectId || !academicYearId}
          >
            {mutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Tugaskan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}