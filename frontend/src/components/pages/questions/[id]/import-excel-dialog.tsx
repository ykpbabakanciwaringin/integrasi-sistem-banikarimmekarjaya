"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileSpreadsheet, Download, UploadCloud, CheckCircle2, X } from "lucide-react";
import { questionService } from "@/services/question.service";

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => void;
  isImporting: boolean;
}

export function ImportExcelDialog({
  open, onOpenChange, onImport, isImporting,
}: ImportExcelDialogProps) {
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setSelectedImportFile(null);
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImportFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedImportFile) onImport(selectedImportFile);
  };

  return (
    <Dialog open={open} onOpenChange={!isImporting ? handleClose : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        
        {/*  FIX: Header Mewah Sesuai Standar Form Data Siswa */}
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">Import Soal dari Excel</DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">Unggah file template Excel untuk menambahkan butir soal massal.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/50 space-y-6">
          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-sm font-bold text-emerald-800">Unduh Format Template</h4>
              <p className="text-xs text-emerald-600/80">Gunakan file ini agar format kolom terbaca oleh sistem (termasuk deteksi PG/Essay otomatis).</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => questionService.downloadTemplate()} className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm whitespace-nowrap">
              <Download className="mr-2 h-4 w-4" /> Unduh .xlsx
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pilih File Data Excel</h4>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-white ${selectedImportFile ? "border-emerald-300 hover:bg-emerald-50" : "border-slate-300 hover:bg-slate-50 hover:border-emerald-400"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileSelect} disabled={isImporting} />
              
              {selectedImportFile ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700 truncate max-w-[250px]">{selectedImportFile.name}</p>
                    <p className="text-xs text-emerald-600/80 mt-1">{(selectedImportFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); setSelectedImportFile(null); }}>
                    Batal Pilih
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-10 w-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-500">Klik / Drag File Excel ke Area Ini</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="p-4 bg-white border-t border-slate-100 shrink-0 flex justify-between sm:justify-between items-center rounded-b-xl">
          <Button variant="ghost" onClick={handleClose} disabled={isImporting} className="text-slate-500 hover:text-slate-700 h-10 px-4">Batal</Button>
          <Button onClick={handleSubmit} disabled={!selectedImportFile || isImporting} className="bg-[#043425] hover:bg-[#054a35] text-white shadow-md active:scale-95 transition-all h-10 px-6">
            {isImporting ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Proses Import...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Unggah Sekarang</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}