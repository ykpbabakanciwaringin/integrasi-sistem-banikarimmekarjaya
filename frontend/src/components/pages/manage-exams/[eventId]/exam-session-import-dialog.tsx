// LOKASI: src/components/pages/manage-exams/[eventId]/exam-session-import-dialog.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExamSessionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<any>;
  isLoading: boolean;
  onDownloadTemplate: () => Promise<void>;
  // [PERBAIKAN]: Menambahkan props untuk menerima detail error dari controller
  errorLogs: string[];
  setErrorLogs: (errors: string[]) => void;
}

export function ExamSessionImportDialog({
  open, 
  onOpenChange, 
  onImport, 
  isLoading, 
  onDownloadTemplate,
  errorLogs,     // Menerima detail_errors dari backend
  setErrorLogs   // Fungsi untuk mereset error
}: ExamSessionImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bersihkan form saat modal dibuka/ditutup
  useEffect(() => {
    if (open) { 
      setFile(null); 
      setErrorLogs([]); // Bersihkan error dari percobaan sebelumnya
      setIsDragging(false); 
    }
  }, [open, setErrorLogs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setFile(selectedFile); 
        setErrorLogs([]); // Bersihkan UI error saat file baru dipilih
      } else {
        toast.error("Format tidak didukung", { description: "Harap unggah file Excel (.xlsx)" });
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) {
        setFile(droppedFile); 
        setErrorLogs([]); // Bersihkan UI error
      } else {
        toast.error("Format tidak didukung", { description: "Harap unggah file Excel (.xlsx)" });
      }
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await onDownloadTemplate();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      // Panggil fungsi mutasi dari controller
      await onImport(file);
      // Catatan: Jika sukses, controller akan menutup modal (onOpenChange(false))
      // Jika gagal, controller akan mengisi errorLogs melalui props, sehingga UI ini menampilkan error-nya.
    } catch (error) {
      // Penanganan error kini terpusat di controller (onMutate/onError)
      console.error("Gagal memulai import:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">Import Jadwal Sesi</DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">
                Tambahkan sesi ujian secara massal menggunakan format Excel.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          
          {/* LANGKAH 1: UNDUH FORMAT */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Langkah 1: Unduh Format</Label>
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center justify-between">
              <div className="text-sm text-emerald-800">
                <p className="font-semibold">Template_Jadwal_Sesi.xlsx</p>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">Berisi format kolom standar untuk jadwal sesi.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm" 
                onClick={handleDownload}
                disabled={isDownloading || isLoading}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />} Unduh
              </Button>
            </div>
          </div>

          {/* LANGKAH 2: UNGGAH DATA */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Langkah 2: Unggah Data</Label>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging ? "border-emerald-500 bg-emerald-50/50" :
                file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isLoading} />
              
              {!file ? (
                <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer">
                  <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                    <UploadCloud className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">Klik atau Drag & Drop file Excel</p>
                    <p className="text-[11px] text-slate-500">Maksimal 5MB (.xlsx)</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700 truncate max-w-[250px]">{file.name}</p>
                    <p className="text-xs text-emerald-600/80 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {!isLoading && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); setFile(null); setErrorLogs([]); }}>
                      Batal Pilih
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================= */}
          {/* BLOK PESAN ERROR (Terhubung dengan State Controller)      */}
          {/* ======================================================= */}
          {errorLogs && errorLogs.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="bg-rose-100/50 px-3 py-2 border-b border-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-700">Terdapat Kesalahan Format Data</span>
              </div>
              <ScrollArea className="h-32 p-3">
                <ul className="space-y-1.5 list-disc list-inside px-1 text-xs font-medium text-rose-600/90">
                  {errorLogs.map((log, i) => <li key={i} className="leading-snug">{log}</li>)}
                </ul>
              </ScrollArea>
            </div>
          )}

        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 sm:justify-between rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 bg-white">Batal</Button>
          <Button onClick={handleSubmit} disabled={!file || isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95">
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Mengimpor...</> : "Mulai Import Jadwal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}