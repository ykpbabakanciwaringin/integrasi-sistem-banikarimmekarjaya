// LOKASI: src/components/pages/master-academic/subject-group-dialog.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Layers, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { curriculumService } from "@/services/curriculum.service";
import { Curriculum, SubjectGroup } from "@/types/master-academic";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface SubjectGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curriculum: Curriculum | null;
}

export function SubjectGroupDialog({ open, onOpenChange, curriculum }: SubjectGroupDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["subject-groups", curriculum?.id],
    queryFn: () => curriculumService.getSubjectGroups(curriculum!.id),
    enabled: !!curriculum?.id && open,
  });

  const createMutation = useMutation({
    mutationFn: (groupName: string) => curriculumService.createSubjectGroup(curriculum!.id, { name: groupName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-groups", curriculum?.id] });
      setName("");
      toast.success("Kelompok mata pelajaran ditambahkan.");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menambahkan data kelompok."),
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId: string) => curriculumService.deleteSubjectGroup(curriculum!.id, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-groups", curriculum?.id] });
      setDeleteId(null);
      toast.success("Kelompok mata pelajaran dihapus.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Gagal menghapus data kelompok.");
      setDeleteId(null);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate(name);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Kelompok Mata Pelajaran</DialogTitle></VisuallyHidden.Root>
          
          <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                <Layers className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-left space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
                  Kelompok Mata Pelajaran
                </DialogTitle>
                <DialogDescription className="text-emerald-100/80 text-xs font-medium">
                  {curriculum?.name ? `Kurikulum: ${curriculum.name}` : "Kelola kelompok untuk kurikulum ini."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Contoh: Muatan Nasional / Kelompok A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="h-10 bg-white border-slate-200 shadow-sm focus-visible:ring-emerald-500 transition-colors"
              />
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createMutation.isPending}
                className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all px-4"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {isLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
              ) : groups.length > 0 ? (
                groups.map((group: SubjectGroup) => (
                  <div key={group.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200 transition-colors group">
                    <span className="font-bold text-sm text-slate-700">{group.name}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 opacity-80 group-hover:opacity-100 hover:bg-rose-50 transition-all" onClick={() => setDeleteId(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm font-medium text-slate-400 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-xl">
                  <Layers className="h-8 w-8 mb-2 opacity-20" />
                  Belum ada kelompok mapel terdaftar.
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0 rounded-b-2xl">
             <Button variant="outline" onClick={() => onOpenChange(false)} className="font-semibold text-slate-600 shadow-sm hover:bg-slate-200/50">
               Selesai
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">Hapus Kelompok Mata Pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>Data kelompok ini akan dihapus secara permanen. Pastikan tidak ada mapel yang masih terikat.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-50 border-slate-200 font-semibold text-slate-600">Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 font-bold" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}