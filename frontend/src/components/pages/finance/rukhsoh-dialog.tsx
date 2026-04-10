// LOKASI: src/components/pages/finance/rukhsoh-dialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText } from "lucide-react";
import { financeService } from "@/services/finance.service";
import { toast } from "sonner";

interface RukhsohDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RukhsohDialog({ open, onOpenChange }: RukhsohDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [totalDebt, setTotalDebt] = useState("");
  const [promisedDate, setPromisedDate] = useState("");
  const [reason, setReason] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!studentId || !promisedDate || !totalDebt) return;
    setIsGenerating(true);
    try {
      await financeService.generateSuratPernyataan({
        student_id: studentId,
        total_debt: Number(totalDebt),
        promised_date: promisedDate,
        reason
      });
      toast.success("Surat Pernyataan berhasil diunduh.");
      onOpenChange(false);
    } catch (error) {
      toast.error("Gagal membuat Surat Pernyataan.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 bg-white rounded-xl">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-amber-600" /> Buat Surat Pernyataan</DialogTitle>
          <DialogDescription>Cetak surat pernyataan kesanggupan membayar.</DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase">ID Siswa (UUID) *</Label>
            <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Masukkan ID Siswa..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase">Total Tunggakan (Rp) *</Label>
            <Input type="number" value={totalDebt} onChange={(e) => setTotalDebt(e.target.value)} placeholder="Contoh: 1500000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase">Tanggal Janji Lunas *</Label>
            <Input type="date" value={promisedDate} onChange={(e) => setPromisedDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase">Alasan Keringanan</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: Menunggu panen..." />
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>Batal</Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !studentId || !promisedDate || !totalDebt} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isGenerating ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Membuat PDF...</> : "Cetak PDF Surat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}