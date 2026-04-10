"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, Edit3, Trash2, CheckCircle2, ClipboardList, Loader2, BookOpen, Clock, AlertCircle, Building2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { journalService } from "@/services/journal.service";
import { classService } from "@/services/class.service";
import { academicYearService } from "@/services/academic-year.service";
import { scheduleService } from "@/services/schedule.service";
import { apiClient } from "@/lib/axios"; 

import { JournalFormDialog } from "../journal-form-dialog";
import { AttendanceDialog } from "../attendance-dialog";
import { TeacherAttendanceDialog } from "../teacher-attendance-dialog";

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

const getIndonesianDay = (date: any) => {
  const days = ["AHAD", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
  return days[dayjs(date).day()];
};

interface HistoryTabProps {
  user: any;
  isTeacher: boolean;
  isAdminOrSuper: boolean;
}

export function HistoryTab({ user, isTeacher, isAdminOrSuper }: HistoryTabProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const queryClient = useQueryClient();

  //  LOGIKA IDENTIFIKASI ROLE KHUSUS
  const isGuruPiket = user?.profile?.position === "GURU PIKET" || user?.profile?.position === "Piket" || user?.profile?.position === "WAKABID KURIKULUM";
  
  // Jika dia guru TAPI bukan piket, maka dia "Guru Reguler" (hanya lihat jadwal sendiri)
  const isRegularTeacher = isTeacher && !isGuruPiket;

  const [isPiketOpen, setIsPiketOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [selectedInstId, setSelectedInstId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAttendOpen, setIsAttendOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);
  const [quickAllocId, setQuickAllocId] = useState<string>("");

  const actualInstId = isSuperAdmin ? selectedInstId : user?.institution_id;

  // 0. Tarik Data Lembaga (KHUSUS SUPER ADMIN)
  const { data: instRes, isLoading: loadInst } = useQuery({
    queryKey: ["institutions_history"],
    queryFn: async () => {
      const res = await apiClient.get("/institutions");
      return res.data;
    },
    enabled: isSuperAdmin,
  });
  const institutions = extractArray(instRes);

  // 1. Tarik Data Kelas untuk Filter
  const { data: classesRes } = useQuery({
    queryKey: ["classes_history", actualInstId],
    queryFn: () => classService.getAll({ institution_id: actualInstId, limit: 500 }),
    enabled: !!actualInstId,
  });
  const classes = extractArray(classesRes);

  // 2. Tarik Data Jurnal  (LOGIKA DIPERBAIKI)
  const { data: journalsRes, isLoading: loadJournals } = useQuery({
    queryKey: ["journals", actualInstId, isRegularTeacher, user?.id],
    queryFn: () => {
      const payload: any = { institution_id: actualInstId, limit: 1000 };
      // HANYA kunci ke user ID jika dia Guru Reguler (bukan Piket/Admin)
      if (isRegularTeacher) {
        payload.teacher_id = user?.id;
      }
      return journalService.getJournals(payload);
    },
    enabled: !!actualInstId,
  });
  const allJournals = extractArray(journalsRes);

  // 3. Tarik Tahun Ajaran & Jadwal  (LOGIKA DIPERBAIKI)
  const { data: activeAyRes } = useQuery({
    queryKey: ["active_ay_history", actualInstId],
    queryFn: () => academicYearService.getActive(actualInstId),
    enabled: !!actualInstId,
  });
  const activeAyId = (activeAyRes as any)?.data?.id || (activeAyRes as any)?.id;

  const { data: allocsRes, isLoading: loadAllocs } = useQuery({
    queryKey: ["allocs_today", actualInstId, activeAyId, isRegularTeacher],
    queryFn: () => {
      const payload: any = {
        institution_id: actualInstId,
        academic_year_id: activeAyId,
      };
      // HANYA kunci ID jika Guru Reguler
      if (isRegularTeacher) {
        payload.teacher_id = user?.id;
      }
      return scheduleService.getAllocations(payload);
    },
    enabled: !!actualInstId && !!activeAyId,
  });
  const myAllocations = extractArray(allocsRes);

  const todaysAllocations = useMemo(() => {
    const todayName = getIndonesianDay(dayjs());
    return myAllocations.filter((a: any) => {
      const schedules = a.schedules || a.Schedules || a.class_schedules || a.ClassSchedules || [];
      return schedules.some((s: any) => (s.day_of_week || s.DayOfWeek || "").toUpperCase() === todayName);
    });
  }, [myAllocations]);

  // Filter Jurnal Berdasarkan Bulan & Kelas
  const filteredJournals = useMemo(() => {
    return allJournals
      .filter((j: any) => {
        const matchMonth = selectedMonth ? dayjs(j.date || j.Date).format("YYYY-MM") === selectedMonth : true;
        const matchClass = selectedClassId !== "all" ? (j.allocation?.class_id || j.Allocation?.ClassID) === selectedClassId : true;
        return matchMonth && matchClass;
      })
      .sort((a: any, b: any) => new Date(b.date || b.Date).getTime() - new Date(a.date || a.Date).getTime());
  }, [allJournals, selectedMonth, selectedClassId]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await apiClient.delete(`/journals/${id}`),
    onSuccess: () => {
      toast.success("Jurnal dihapus.");
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      setJournalToDelete(null);
    },
  });

  const submitJournalMutation = useMutation({
    mutationFn: async (data: any) => {
      const id = selectedJournal?.id || selectedJournal?.ID;
      if (id) return await journalService.updateJournal(id, data);
      return await journalService.createJournal(data);
    },
    onSuccess: (resData: any) => {
      toast.success("Jurnal berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      setIsFormOpen(false);
      const savedJournal = resData?.data || resData;
      if (savedJournal && (savedJournal.id || savedJournal.ID)) {
         setSelectedJournal(savedJournal);
         setTimeout(() => setIsAttendOpen(true), 400);
      }
    },
    onError: () => toast.error("Gagal menyimpan jurnal.")
  });

  const handleAdd = () => {
    setSelectedJournal(null);
    setQuickAllocId("");
    setIsFormOpen(true);
  };

  const handleQuickJournal = (allocId: string) => {
    setSelectedJournal(null);
    setQuickAllocId(allocId);
    setIsFormOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between md:items-end">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="space-y-1.5 w-full md:w-40">
            <label className="text-xs font-bold text-slate-500 uppercase">Pilih Bulan</label>
            <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 h-10" />
          </div>

          {(isSuperAdmin || isGuruPiket) && (
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase">Filter Kelas</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={!actualInstId}>
                <SelectTrigger className="bg-slate-50 h-10">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id || c.ID} value={c.id || c.ID}>{c.name || c.Name || c.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {isGuruPiket && (
            <Button variant="outline" onClick={() => setIsPiketOpen(true)} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-10 shadow-sm whitespace-nowrap">
              <ClipboardList className="w-4 h-4 mr-2" /> Menu Guru Piket
            </Button>
          )}

          {(isTeacher || isAdminOrSuper) && (
            <Button onClick={handleAdd} disabled={isSuperAdmin && !actualInstId} className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 shadow-sm whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> Buat Jurnal Bebas
            </Button>
          )}
        </div>
      </div>

      {/*  GRID KARTU JADWAL HARI INI */}
      <div className="mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2 mb-3 px-1">
          <Clock className="w-4 h-4 text-indigo-600" /> 
          {isGuruPiket ? "Pantauan KBM Hari Ini" : "Jadwal Mengajar Anda Hari Ini"} ({dayjs().format('dddd, DD MMMM YYYY')})
        </h3>
        
        {loadAllocs ? (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
             <div className="min-w-[280px] h-[100px] bg-white animate-pulse rounded-2xl border border-slate-200 shrink-0"></div>
          </div>
        ) : todaysAllocations.length === 0 ? (
          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm text-indigo-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-500" />
            <span>Tidak ada jadwal mengajar yang terdeteksi untuk hari ini.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todaysAllocations.map((alloc: any) => {
               const allocId = alloc.id || alloc.ID;
               const teacherName = alloc.teacher?.full_name || alloc.Teacher?.FullName || "Guru";
               const subjectName = alloc.subject?.name || alloc.Subject?.Name || "Mapel";

               return (
                 <div key={allocId} onClick={() => handleQuickJournal(allocId)} className="relative p-5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-start mb-2 pl-2">
                       <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase">
                         {alloc.class?.name || "Kelas"}
                       </span>
                    </div>
                    <div className="font-bold text-slate-800 text-[14px] pl-2 truncate">{subjectName}</div>
                    <div className="text-[11px] text-slate-500 pl-2 mt-1 italic">{isGuruPiket ? teacherName : "Jadwal Anda"}</div>
                 </div>
               );
            })}
          </div>
        )}
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {loadJournals ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : filteredJournals.length === 0 ? (
          <div className="py-20 text-center text-slate-400"><BookOpen className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>Belum ada riwayat jurnal.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b text-[11px] uppercase">
                <tr>
                  <th className="px-5 py-4 text-center">No</th>
                  <th className="px-5 py-4">Tanggal & Waktu</th>
                  <th className="px-5 py-4">Mata Pelajaran & Kelas</th>
                  <th className="px-5 py-4">Topik</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredJournals.map((journal: any, index: number) => (
                  <tr key={journal.id || journal.ID} className="hover:bg-slate-50/80 group">
                    <td className="px-5 py-4 text-center text-slate-500">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{dayjs(journal.date || journal.Date).format("DD MMM YYYY")}</div>
                      <div className="text-[10px] text-slate-500">{journal.started_at || "00:00"} - {journal.ended_at || "00:00"}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{journal.allocation?.subject?.name || "Mapel"}</div>
                      <div className="text-[10px] bg-slate-100 px-2 rounded w-fit">{journal.allocation?.class?.name || "Kelas"}</div>
                      {isGuruPiket && <div className="text-[10px] text-indigo-600 mt-1 font-medium">{journal.allocation?.teacher?.full_name || "Guru"}</div>}
                    </td>
                    <td className="px-5 py-4 text-slate-600 truncate max-w-[200px]">{journal.topic || "-"}</td>
                    <td className="px-5 py-4 text-center">
                      {(journal.status === "VERIFIED" || journal.Status === "VERIFIED") ? 
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold">Terverifikasi</span> :
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-bold">Draft</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-right">
                       <Button variant="outline" size="sm" onClick={() => { setSelectedJournal(journal); setIsAttendOpen(true); }} className="border-indigo-200 text-indigo-700">Presensi</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <JournalFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} journal={selectedJournal} defaultAllocationId={quickAllocId} onSubmit={(data: any) => submitJournalMutation.mutate(data)} isLoading={submitJournalMutation.isPending} />
      <AttendanceDialog open={isAttendOpen} onOpenChange={setIsAttendOpen} journal={selectedJournal} />
      <TeacherAttendanceDialog open={isPiketOpen} onOpenChange={setIsPiketOpen} institutionId={actualInstId} />
    </div>
  );
}