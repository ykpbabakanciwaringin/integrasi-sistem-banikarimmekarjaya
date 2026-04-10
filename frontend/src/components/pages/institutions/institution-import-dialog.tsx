// LOKASI: src/components/pages/institutions/institution-import-dialog.tsx
"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, FileSpreadsheet, Download, UploadCloud, CheckCircle2 } from "lucide-react";
import { institutionService } from "@/services/institution.service";
import { toast } from "sonner";

interface InstitutionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importFile: File | null;
  setImportFile: (file: File | null) => void;
  onImport: () => void;
  isPending: boolean;
}

export function InstitutionImportDialog({
  open,
  onOpenChange,
  importFile,
  setImportFile,
  onImport,
  isPending,
}: InstitutionImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Format file harus Excel (.xlsx atau .xls)");
        return;
      }
      setImportFile(file);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      await institutionService.downloadTemplate();
      toast.success("Template berhasil diunduh.");
    } catch (error) {
      toast.error("Gagal mengunduh template.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setImportFile(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={!isPending ? handleClose : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Import Data Lembaga
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs mt-1">
                Tambahkan lembaga massal menggunakan file Excel (.xlsx).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-slate-50/50">
          
          {/* Langkah 1 */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Langkah 1: Unduh Format</Label>
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center justify-between">
              <div className="text-sm text-emerald-800">
                <p className="font-semibold">Template_Lembaga.xlsx</p>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">Format standar tabel kolom yang dibutuhkan.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm" 
                onClick={handleDownloadTemplate}
                disabled={isDownloading || isPending}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />} Unduh
              </Button>
            </div>
          </div>

          {/* Langkah 2 */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Langkah 2: Unggah Data</Label>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors bg-white shadow-sm ${
                importFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
              
              {!importFile ? (
                <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">Klik untuk memilih file Excel</p>
                    <p className="text-[11px] text-slate-500">Maksimal 5MB (.xlsx, .xls)</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700 truncate max-w-[250px]">{importFile.name}</p>
                    <p className="text-xs text-emerald-600/80 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setImportFile(null)}>
                    Batal Pilih
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>

        <DialogFooter className="p-4 bg-white border-t border-slate-100 shrink-0 sm:justify-between rounded-b-xl">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending} className="text-slate-500 border-slate-200">Batal</Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95" 
            onClick={onImport} 
            disabled={isPending || !importFile}
          >
            {isPending ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Mengimpor...</> : "Proses Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}