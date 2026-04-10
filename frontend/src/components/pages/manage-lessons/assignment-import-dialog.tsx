// LOKASI: src/components/pages/manage-lessons/assignment-import-dialog.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Loader2, UploadCloud, FileSpreadsheet, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { subjectService } from "@/services/subject.service";

interface AssignmentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId: string;
}

export function AssignmentImportDialog({
  open,
  onOpenChange,
  institutionId,
}: AssignmentImportDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      await subjectService.downloadAssignmentTemplate(institutionId);
      toast.success("Template Master Jadwal berhasil diunduh");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh template");
    } finally {
      setIsDownloading(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (selectedFile: File) => {
      return await subjectService.importAssignments(selectedFile, institutionId);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Master Jadwal & Penugasan berhasil diimpor!");
      // KUNCI SULAP REAL-TIME: Invalidasi semua cache yang berkaitan dengan jadwal dan guru
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-workload"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["allocations_master"] });
      handleClose();
    },
    onError: (error: any) => {
      // Menangkap pesan error presisi (beserta nomor baris) yang dilempar dari Backend
      toast.error(error?.response?.data?.error || error.message || "Gagal mengimpor data jadwal");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith(".xlsx")) {
        toast.error("Format file tidak didukung! Harap gunakan file .xlsx");
        setFile(null);
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Pilih file Excel terlebih dahulu");
      return;
    }
    if (!institutionId) {
      toast.error("ID Lembaga tidak ditemukan");
      return;
    }
    importMutation.mutate(file);
  };

  const handleClose = () => {
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-white p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">Import Master Jadwal & Penugasan</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Unggah file Excel (.xlsx) untuk memploting guru, jadwal kelas, dan KKM secara serentak.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm text-amber-800">
                <p className="font-semibold leading-none">Format Excel Baru!</p>
                <p className="text-xs text-amber-700/80">Gunakan template terbaru yang sudah dilengkapi dropdown dinamis untuk Mapel, Kelas, Guru, Hari, dan Sesi.</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 w-full sm:w-auto shrink-0"
              onClick={handleDownloadTemplate}
              disabled={isDownloading || !institutionId}
            >
              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Unduh Template
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700">Pilih File Excel (.xlsx)</Label>
            <div className="relative group">
              <Input
                type="file"
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={importMutation.isPending}
                className="pr-10 file:bg-slate-100 file:text-slate-700 file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded-md file:font-medium file:cursor-pointer hover:file:bg-slate-200 h-14 pt-2 border-slate-300 cursor-pointer"
              />
              <UploadCloud className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            {file && (
              <p className="text-xs text-emerald-600 font-medium pl-1">
                File siap diproses: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
            Batal
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={!file || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              "Mulai Import Master"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}