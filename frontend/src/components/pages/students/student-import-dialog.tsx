// LOKASI: src/components/pages/students/student-import-dialog.tsx
"use client";

import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileSpreadsheet, Download, UploadCloud, CheckCircle2 } from "lucide-react";
import { studentService } from "@/services/student.service";
import { toast } from "sonner";

interface StudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  institutions: any[];
  isSuperAdmin: boolean;
  userInstId: string;
}

export function StudentImportDialog({
  open,
  onOpenChange,
  onSuccess,
  institutions,
  isSuperAdmin,
  userInstId,
}: StudentImportDialogProps) {
  const [selectedInst, setSelectedInst] = useState<string>(isSuperAdmin ? "" : userInstId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Format file harus Excel (.xlsx atau .xls)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDownloadTemplate = async () => {
    if (isSuperAdmin && !selectedInst) {
      toast.error("Pilih lembaga terlebih dahulu untuk mengunduh template spesifik.");
      return;
    }
    try {
      setIsDownloading(true);
      await studentService.downloadTemplate(selectedInst);
      toast.success("Template berhasil diunduh.");
    } catch (error) {
      toast.error("Gagal mengunduh template.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return toast.error("Pilih file Excel terlebih dahulu.");
    if (isSuperAdmin && !selectedInst) return toast.error("Pilih lembaga formal tujuan.");

    try {
      setIsUploading(true);
      await studentService.importBatch(selectedFile, selectedInst);
      toast.success("Data siswa berhasil diimpor!");
      
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (isSuperAdmin) setSelectedInst("");
      
      onSuccess(); 
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Terjadi kesalahan saat mengimpor data siswa.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedFile(null);
      if (isSuperAdmin) setSelectedInst("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={!isUploading ? handleOpenChange : undefined}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Import Data Siswa
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">
                Tambahkan siswa secara massal menggunakan file Excel (.xlsx).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lembaga Formal *</Label>
              <Select value={selectedInst} onValueChange={setSelectedInst} disabled={isUploading || isDownloading}>
                <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500">
                  <SelectValue placeholder="Pilih lembaga target import..." />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Langkah 1: Unduh Format</Label>
            </div>
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center justify-between">
              <div className="text-sm text-emerald-800">
                <p className="font-semibold">Template_Siswa.xlsx</p>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">Berisi daftar kelas sesuai lembaga yang dipilih.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                onClick={handleDownloadTemplate}
                disabled={isDownloading || (isSuperAdmin && !selectedInst)}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />} Unduh
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Langkah 2: Unggah Data</Label>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
              
              {!selectedFile ? (
                <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
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
                    <p className="text-sm font-bold text-emerald-700 truncate max-w-[250px]">{selectedFile.name}</p>
                    <p className="text-xs text-emerald-600/80 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setSelectedFile(null)}>
                    Batal Pilih
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 sm:justify-between">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading} className="text-slate-500">Batal</Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95" 
            onClick={handleUpload} 
            disabled={isUploading || !selectedFile || (isSuperAdmin && !selectedInst)}
          >
            {isUploading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Mengimpor...</> : "Mulai Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}