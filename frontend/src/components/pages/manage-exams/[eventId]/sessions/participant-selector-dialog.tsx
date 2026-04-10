// LOKASI: src/components/pages/manage-exams/[eventId]/sessions/participant-selector-dialog.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, SearchX, CheckSquare, UserPlus, 
  BookOpen, School, Info 
} from "lucide-react";
import { cn } from "@/lib/utils";

import { classService } from "@/services/class.service";
import { studentService } from "@/services/student.service";

interface ParticipantSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // [PERBAIKAN FASE MULTI-MAPEL]: onSubmit kini menerima qbankIds sebagai Array
  onSubmit: (studentIds: string[], qbankIds: string[]) => void;
  isLoading: boolean;
  questionBanks: any[];
  institutionId: string;
  sessionSubjectList?: string; 
}

export function ParticipantSelectorDialog({
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading, 
  questionBanks, 
  institutionId,
  sessionSubjectList,
}: ParticipantSelectorDialogProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // [PERBAIKAN FASE MULTI-MAPEL]: Menggunakan Array untuk menampung banyak pilihan mapel
  const [selectedQBankIds, setSelectedQBankIds] = useState<string[]>([]);

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

  const { data: classesData, isLoading: isClassesLoading } = useQuery({
    queryKey: ["selector-classes", institutionId],
    queryFn: () => classService.getAll({ limit: 500, institution_id: institutionId }),
    enabled: open,
  });

  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ["selector-students", selectedClassId],
    queryFn: () => studentService.getAll({ limit: 500, class_id: selectedClassId, status: "ACTIVE" }),
    enabled: open && selectedClassId !== "",
  });

  const students = studentsData?.data || [];
  const classes = classesData?.data || [];

  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) setSelectedStudentIds(students.map((s: any) => s.id));
    else setSelectedStudentIds([]);
  };

  const handleSelectOneStudent = (id: string, checked: boolean) => {
    if (checked) setSelectedStudentIds(prev => [...prev, id]);
    else setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
  };

  // [PERBAIKAN FASE MULTI-MAPEL]: Logika Toggle untuk Checkbox Bank Soal
  const handleToggleQBank = (id: string) => {
    setSelectedQBankIds((prev) => 
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedClassId("");
      setSelectedStudentIds([]);
      setSelectedQBankIds([]); // Reset pilihan mapel saat modal ditutup
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={!isLoading ? handleOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[800px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <UserPlus className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Pendaftaran Peserta Ujian
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs mt-1">
                Pilih siswa dari kelas dan centang paket soal yang akan diujikan kepada mereka.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* KOLOM KIRI: FILTER & MAPEL */}
          <div className="md:col-span-5 flex flex-col gap-4 h-[360px]">
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex gap-2.5 items-start shadow-sm shrink-0">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-tighter">Filter Sesi Aktif</p>
                <p className="text-[10px] text-indigo-700 leading-tight font-medium">
                  Bank soal disaring sesuai mapel: <b className="text-indigo-900">{sessionSubjectList || "Semua"}</b>
                </p>
              </div>
            </div>

            <div className="space-y-2 shrink-0">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-500" /> Pilih Kelas Siswa
              </Label>
              <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedStudentIds([]); }}>
                <SelectTrigger className="h-11 bg-white border-slate-200 focus:ring-emerald-500 text-sm font-medium shadow-sm">
                  <SelectValue placeholder={isClassesLoading ? "Memuat..." : "Pilih Kelas"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl max-h-60">
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* [PERBAIKAN FASE MULTI-MAPEL]: Dropdown diubah menjadi ScrollArea Checkbox */}
            <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Paket Soal (Multi-Mapel)
                </span>
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">{selectedQBankIds.length} Dipilih</span>
              </Label>
              <ScrollArea className="flex-1 pr-2 mt-1">
                {filteredQuestionBanks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6">
                    <BookOpen className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-[11px] text-center italic font-medium px-4">Tidak ada bank soal yang tersedia untuk mapel sesi ini.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredQuestionBanks.map((q: any) => (
                      <Label 
                        key={q.id} 
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors",
                          selectedQBankIds.includes(q.id) ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-transparent hover:bg-slate-50"
                        )}
                      >
                        <Checkbox 
                          checked={selectedQBankIds.includes(q.id)} 
                          onCheckedChange={() => handleToggleQBank(q.id)}
                          className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <div className="flex flex-col">
                          <span className={cn("text-xs font-bold leading-tight line-clamp-2", selectedQBankIds.includes(q.id) ? "text-emerald-900" : "text-slate-700")}>{q.title}</span>
                          <span className="text-emerald-600 text-[9px] font-black uppercase tracking-tighter mt-0.5">{q.subject_name}</span>
                        </div>
                      </Label>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <p className="text-[9px] text-slate-400 italic text-center mt-2 pb-1">
                * Biarkan kosong jika ingin mengatur paket soal secara manual nanti.
              </p>
            </div>
          </div>

          {/* KOLOM KANAN: DAFTAR SISWA */}
          <div className="md:col-span-7 border border-slate-200 rounded-[1.25rem] bg-white overflow-hidden flex flex-col h-[360px] shadow-sm">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0">
              <Checkbox 
                checked={students.length > 0 && selectedStudentIds.length === students.length}
                onCheckedChange={(c) => handleSelectAllStudents(c as boolean)}
                disabled={!selectedClassId || students.length === 0}
                className="w-5 h-5"
              />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Pilih Semua Siswa</span>
            </div>
            
            <ScrollArea className="flex-1 p-2">
              {!selectedClassId ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 mt-16">
                  <School className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-bold">Silakan tentukan kelas terlebih dahulu.</p>
                </div>
              ) : isStudentsLoading ? (
                <div className="flex flex-col justify-center items-center h-full mt-20">
                  <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
                </div>
              ) : students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-16">
                  <SearchX className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-bold">Data siswa tidak ditemukan di kelas ini.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {students.map((s: any) => (
                    <Label 
                      key={s.id} 
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all duration-200",
                        selectedStudentIds.includes(s.id) ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-transparent hover:bg-slate-50"
                      )}
                    >
                      <Checkbox 
                        checked={selectedStudentIds.includes(s.id)}
                        onCheckedChange={(c) => handleSelectOneStudent(s.id, c as boolean)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className={cn("text-sm font-bold truncate", selectedStudentIds.includes(s.id) ? "text-emerald-900" : "text-slate-800")}>{s.profile?.full_name || s.username}</span>
                        <span className="text-[10px] text-slate-500 font-mono">NISN: {s.profile?.nisn || "-"}</span>
                      </div>
                    </Label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-slate-600"><b className="text-emerald-600 text-sm">{selectedStudentIds.length}</b> Siswa Terpilih</span>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading} className="text-slate-500 hover:text-slate-700 bg-white font-bold rounded-xl h-11 px-6 shadow-sm border-slate-200 flex-1 sm:flex-none">Batal</Button>
            <Button 
              className={cn("bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition-all px-8 rounded-xl h-11 flex-1 sm:flex-none active:scale-95", (isLoading || selectedStudentIds.length === 0) && "opacity-80")} 
              onClick={() => onSubmit(selectedStudentIds, selectedQBankIds)} 
              disabled={isLoading || selectedStudentIds.length === 0}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Tambahkan Peserta
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}