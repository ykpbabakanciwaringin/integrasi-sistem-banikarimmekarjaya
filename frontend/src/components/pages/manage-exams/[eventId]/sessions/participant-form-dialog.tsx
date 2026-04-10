// LOKASI: src/components/pages/manage-exams/[eventId]/sessions/participant-form-dialog.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Pencil, KeyRound, BookOpen, Info, CheckSquare } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ParticipantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: any;
  // [PERBAIKAN FASE MULTI-MAPEL]: onSubmit kini mengirimkan payload dengan question_bank_ids (Array)
  onSubmit: (data: any) => void;
  isLoading: boolean;
  questionBanks: any[];
  sessionSubjectList?: string; 
}

export function ParticipantFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
  questionBanks,
  sessionSubjectList,
}: ParticipantFormDialogProps) {
  const [examNumber, setExamNumber] = useState("");
  
  // [PERBAIKAN FASE MULTI-MAPEL]: Menggunakan Array untuk menampung banyak pilihan bank soal
  const [selectedQBankIds, setSelectedQBankIds] = useState<string[]>([]);

  // Filter bank soal berdasarkan mata pelajaran yang diizinkan dalam sesi ini
  const allowedSubjects = useMemo(() => {
    if (!sessionSubjectList) return [];
    return sessionSubjectList.split(",").map((s) => s.trim());
  }, [sessionSubjectList]);

  const filteredQuestionBanks = useMemo(() => {
    if (allowedSubjects.length === 0) return questionBanks;
    return questionBanks.filter((qb: any) => 
      allowedSubjects.includes(qb.subject_name)
    );
  }, [questionBanks, allowedSubjects]);

  // Sinkronisasi data awal saat modal dibuka
  useEffect(() => {
    if (initialData && open) {
      setExamNumber(initialData.exam_number || "");
      
      // [PERBAIKAN FASE MULTI-MAPEL]: Memetakan ID bank soal dari relasi Subtests
      if (initialData.subtests && Array.isArray(initialData.subtests)) {
        const existingIds = initialData.subtests.map((s: any) => s.question_bank_id);
        setSelectedQBankIds(existingIds);
      } else {
        // Fallback untuk data lama (Migrasi)
        const singleId = initialData.question_bank_id || initialData.qbank_id;
        if (singleId && singleId !== "00000000-0000-0000-0000-000000000000") {
          setSelectedQBankIds([singleId]);
        } else {
          setSelectedQBankIds([]);
        }
      }
    }
  }, [initialData, open]);

  // Logika Toggle Checkbox
  const handleToggleQBank = (id: string) => {
    setSelectedQBankIds((prev) => 
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      exam_number: examNumber,
      // Dikirim sebagai Array agar selaras dengan update service.ts dan backend
      question_bank_ids: selectedQBankIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[480px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Pencil className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Perbarui Paket Ujian
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs mt-1">
                Atur ulang nomor ujian dan daftar paket soal yang ditugaskan untuk siswa ini.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 md:p-8 space-y-6 bg-slate-50/50">
          
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex gap-3 items-start shadow-sm">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-indigo-900 leading-none">Filter Sesi Aktif</p>
              <p className="text-[10px] text-indigo-700/80 leading-relaxed font-medium">
                Menampilkan bank soal mapel: <b className="text-indigo-900">{sessionSubjectList || "Belum ditentukan"}</b>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Nomor Ujian Siswa *
            </Label>
            <Input
              value={examNumber}
              onChange={(e) => setExamNumber(e.target.value)}
              disabled={isLoading}
              className="h-11 bg-white border-slate-200 focus-visible:ring-emerald-500 shadow-sm text-sm font-medium"
              placeholder="Contoh: 001-002-003"
            />
          </div>

          {/* [PERBAIKAN FASE MULTI-MAPEL]: Dropdown diganti menjadi area seleksi Checkbox */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[240px] overflow-hidden">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Paket Soal Ditugaskan
              </span>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">{selectedQBankIds.length} Paket</span>
            </Label>
            
            <ScrollArea className="flex-1 pr-2 mt-2">
              {filteredQuestionBanks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                  <BookOpen className="w-10 h-10 opacity-10 mb-2" />
                  <p className="text-[11px] text-center italic px-6">Tidak tersedia bank soal yang cocok dengan mata pelajaran sesi ini.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredQuestionBanks.map((q: any) => (
                    <Label 
                      key={q.id} 
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200",
                        selectedQBankIds.includes(q.id) ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-transparent hover:bg-slate-50"
                      )}
                    >
                      <Checkbox 
                        checked={selectedQBankIds.includes(q.id)} 
                        onCheckedChange={() => handleToggleQBank(q.id)}
                        className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className={cn("text-xs font-bold leading-tight line-clamp-2", selectedQBankIds.includes(q.id) ? "text-emerald-900" : "text-slate-700")}>{q.title}</span>
                        <span className="text-emerald-600 text-[9px] font-black uppercase tracking-tighter mt-1">{q.subject_name}</span>
                      </div>
                    </Label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex flex-row items-center justify-end gap-3 rounded-b-xl">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading} 
            className="text-slate-500 hover:text-slate-700 bg-white font-bold rounded-xl h-11 px-6 shadow-sm border-slate-200"
          >
            Batal
          </Button>
          
          <Button
            className={cn(
              "font-black text-white shadow-md active:scale-95 transition-all px-8 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700",
              (isLoading || !examNumber) && "opacity-80 cursor-not-allowed"
            )}
            onClick={handleSubmit}
            disabled={isLoading || !examNumber}
          >
            {isLoading ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan...</>
            ) : (
              <><Pencil className="mr-2 h-4 w-4" /> Simpan Perubahan</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}