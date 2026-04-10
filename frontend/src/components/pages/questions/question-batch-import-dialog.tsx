// LOKASI: src/components/pages/questions/question-batch-import-dialog.tsx
"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2, UploadCloud, Download, X } from "lucide-react";
import { toast } from "sonner";

interface QuestionBatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadTemplate: () => Promise<void>;
  onSubmit: (file: File) => Promise<void>;
  isLoading: boolean;
}

export function QuestionBatchImportDialog({
  open,
  onOpenChange,
  onDownloadTemplate,
  onSubmit,
  isLoading,
}: QuestionBatchImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        toast.error("Format file tidak didukung. Harap unggah file Excel (.xlsx atau .xls)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadTemplate();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.warning("Silakan pilih file Excel terlebih dahulu");
      return;
    }
    await onSubmit(selectedFile);
    setSelectedFile(null); // Reset setelah berhasil
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl border-0 shadow-2xl">
        
        {/* HEADER */}
        <DialogHeader className="p-6 bg-slate-900 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight">Import Batch Paket Soal</DialogTitle>
              <DialogDescription className="text-slate-300 text-xs">
                Unggah banyak paket soal sekaligus menggunakan format Excel Cerdas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50 space-y-6">
          
          {/* STEP 1: DOWNLOAD TEMPLATE */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">Langkah 1</span>
              Unduh Template Cerdas
            </h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Template Excel ini sudah dilengkapi dengan <b>Dropdown Otomatis</b> yang memuat data Mata Pelajaran dan Guru sesuai dengan lembaga Anda.
            </p>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={isDownloading || isLoading}
              className="w-full text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 font-semibold shadow-sm"
            >
              {isDownloading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Unduh Template Excel
            </Button>
          </div>

          {/* STEP 2: UPLOAD FILE */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">Langkah 2</span>
              Unggah File Isian
            </h4>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx, .xls"
              className="hidden"
            />

            {!selectedFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-emerald-400 transition-colors"
              >
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="h-5 w-5 text-slate-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Klik untuk memilih file</p>
                <p className="text-xs text-slate-400 mt-1">Format: .xlsx (Maks. 5MB)</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-8 w-8 bg-emerald-100 rounded-md flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-emerald-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-emerald-600">Siap untuk diunggah</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-rose-500 hover:bg-rose-100 shrink-0" 
                  onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 font-semibold">
            Batal
          </Button>
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md" 
            onClick={handleSubmit} 
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Memproses...</> : "Mulai Import"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}