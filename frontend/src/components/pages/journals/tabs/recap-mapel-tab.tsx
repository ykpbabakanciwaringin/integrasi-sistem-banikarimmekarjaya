// LOKASI: src/components/pages/journals/tabs/recap-mapel-tab.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileSpreadsheet, FileText, Search, Building2, Info, Calendar } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";

import { studentService } from "@/services/student.service";
import { journalService } from "@/services/journal.service";
import { scheduleService } from "@/services/schedule.service";
import { classService } from "@/services/class.service";
import { academicYearService } from "@/services/academic-year.service";
import { curriculumService } from "@/services/curriculum.service";

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export function RecapMapelTab({ institutionId }: { institutionId: string }) {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === "TEACHER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [selectedInstId, setSelectedInstId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedAllocId, setSelectedAllocId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  const actualInstId = isSuperAdmin ? selectedInstId : institutionId;

  // 1. Tarik Data Lembaga
  const { data: instRes, isLoading: loadInst } = useQuery({
    queryKey: ["institutions_recap_mapel_v3"],
    queryFn: async () => {
      const res = await apiClient.get("/institutions", { params: { limit: 1000 } });
      return res.data;
    },
    enabled: true,
  });
  const institutions = extractArray(instRes);

  // 2. Tahun Ajaran & Daftar Kelas
  const { data: activeYear } = useQuery({
    queryKey: ["active_academic_year", actualInstId],
    queryFn: () => academicYearService.getActive(actualInstId),
    enabled: !!actualInstId,
  });

  const { data: classesRes } = useQuery({
    queryKey: ["classes_filter", actualInstId],
    queryFn: () => classService.getAll({ institution_id: actualInstId, limit: 500 }),
    enabled: !isTeacher && !!actualInstId,
  });
  const classes = extractArray(classesRes);

  // 3. Alokasi Mengajar (Mencakup data Jadwal/Schedules)
  const { data: allocationsRes, isLoading: loadAlloc } = useQuery({
    queryKey: ["allocations_filter", actualInstId, selectedClassId],
    queryFn: () => scheduleService.getAllocations({ institution_id: actualInstId, class_id: selectedClassId, limit: 500 }),
    enabled: !!actualInstId && (isTeacher || !!selectedClassId),
  });
  const allocations = extractArray(allocationsRes);

  const selectedAlloc = allocations.find((a: any) => (a.id || a.ID) === selectedAllocId);
  const actualClassId = isTeacher ? (selectedAlloc?.class_id || selectedAlloc?.ClassID) : selectedClassId;

  // 4. Daftar Siswa
  const { data: studentsRes } = useQuery({
    queryKey: ["students_recap", actualClassId],
    queryFn: () => studentService.getAll({ class_id: actualClassId, limit: 1000 }),
    enabled: !!actualClassId,
  });
  const students = extractArray(studentsRes);

  // 5. Data Jurnal (Data Absensi Nyata)
  const { data: journalsRes, isLoading: loadJournals } = useQuery({
    queryKey: ["journals_recap_real", selectedAllocId],
    queryFn: () => journalService.getJournals({ teaching_allocation_id: selectedAllocId, limit: 500 }),
    enabled: !!selectedAllocId,
  });
  const realJournals = extractArray(journalsRes);

  // 6. Data Hari Libur
  const { data: holidayRes } = useQuery({
    queryKey: ["holidays_mapel_auto", actualInstId, selectedMonth],
    queryFn: () => curriculumService.getHolidays({ institution_id: actualInstId, month: selectedMonth }),
    enabled: !!actualInstId,
  });
  const holidays = extractArray(holidayRes);

  //  7. ENGINE OTOMATISASI KOLOM (Kombinasi Jadwal + Jurnal Nyata)
  const projectedMeetings = useMemo(() => {
    if (!selectedAlloc) return [];

    const activeInst = institutions.find((i: any) => i.id === actualInstId);
    const weeklyDayOff = activeInst?.weekly_day_off || "JUMAT";
    
    // Ambil daftar hari mengajar dari jadwal (Senin, Selasa, dsb)
    const scheduledDays = (selectedAlloc.schedules || selectedAlloc.Schedules || []).map((s: any) => (s.day_of_week || s.DayOfWeek || "").toUpperCase());

    const startDate = dayjs(`${selectedMonth}-01`);
    const endDate = startDate.endOf("month");
    const meetings: any[] = [];

    let current = startDate;
    while (current.isBefore(endDate) || current.isSame(endDate)) {
      const dayName = current.locale("id").format("SABTU").toUpperCase();
      
      // Cek apakah tanggal ini ada di jadwal mengajar
      const isScheduled = scheduledDays.includes(dayName);
      
      // Cek apakah hari ini libur
      const isWeeklyOff = dayName === weeklyDayOff;
      const isIncidental = holidays.some((h: any) => dayjs(h.date).isSame(current, "day"));
      const isHoliday = isWeeklyOff || isIncidental;

      // Cari apakah sudah ada jurnal nyata di tanggal ini
      const existingJournal = realJournals.find((j: any) => dayjs(j.date || j.Date).isSame(current, "day"));

      // ATURAN: Masukkan ke list jika: 
      // 1. Ada jurnal nyata (meski tidak dijadwal)
      // 2. Ada jadwal rutin (meski belum absen atau sedang libur)
      if (existingJournal || isScheduled) {
        meetings.push({
          date: current.format("YYYY-MM-DD"),
          isHoliday: isHoliday,
          journal: existingJournal || null
        });
      }

      current = current.add(1, "day");
    }

    return meetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedAlloc, selectedMonth, realJournals, holidays, institutions, actualInstId]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    toast.info(`Membangun dokumen ${format.toUpperCase()}...`);
    try {
      await journalService.exportRecap('mapel', selectedMonth, format, undefined, selectedAllocId);
      toast.success("Dokumen berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal mengunduh dokumen.");
    }
  };

  const isLoading = loadAlloc || loadJournals;
  const maxCols = Math.max(24, projectedMeetings.length);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          {isSuperAdmin && (
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Building2 className="w-3 h-3" /> 1. Lembaga</label>
              <Select value={selectedInstId} onValueChange={(val) => { setSelectedInstId(val); setSelectedClassId(""); setSelectedAllocId(""); }}>
                <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Lembaga..." /></SelectTrigger>
                <SelectContent>{institutions.map((i: any) => (<SelectItem key={i.id || i.ID} value={i.id || i.ID}>{i.name || i.Name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          )}
          {!isTeacher && (
            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-slate-500 uppercase">2. Pilih Kelas</label>
              <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedAllocId(""); }} disabled={!actualInstId}>
                <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Kelas..." /></SelectTrigger>
                <SelectContent>{classes.map((c: any) => (<SelectItem key={c.id || c.ID} value={c.id || c.ID}>{c.name || c.Name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-500 uppercase">3. Mata Pelajaran</label>
            <Select value={selectedAllocId} onValueChange={setSelectedAllocId} disabled={!isTeacher && !selectedClassId}>
              <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Mapel..." /></SelectTrigger>
              <SelectContent>
                {allocations.map((a: any) => (
                  <SelectItem key={a.id || a.ID} value={a.id || a.ID}>
                    {isTeacher ? `${a.class?.name || 'Kelas'} - ${a.subject?.name}` : `${a.subject?.name} (${a.teacher?.full_name || 'Guru'})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-40">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> 4. Bulan</label>
            <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border-slate-200" />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10" onClick={() => handleExport('excel')} disabled={!selectedAllocId}><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white h-10 shadow-sm" onClick={() => handleExport('pdf')} disabled={!selectedAllocId}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {!selectedAllocId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-20"><Search className="w-12 h-12 mb-4 opacity-20" /><p>Silakan tentukan filter untuk memproyeksikan rekap kehadiran.</p></div>
        ) : isLoading ? (
          <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-[10px] border-collapse">
              <thead className="sticky top-0 z-30 bg-slate-100 shadow-sm">
                <tr>
                  <th rowSpan={2} className="sticky left-0 z-40 bg-slate-100 p-2 border-b border-r border-slate-300 w-8 text-center font-bold">No</th>
                  <th rowSpan={2} className="sticky left-[32px] z-40 bg-slate-100 p-2 border-b border-r border-slate-300 min-w-[180px] text-left font-bold shadow-sm">Nama Siswa</th>
                  <th colSpan={maxCols} className="p-1 border-b border-r border-slate-300 text-center font-bold uppercase bg-slate-50 text-slate-500">Pertemuan & Kalender</th>
                  <th colSpan={4} className="p-1 border-b text-center font-bold uppercase bg-slate-50 text-slate-500">Rekap</th>
                </tr>
                <tr>
                  {Array.from({ length: maxCols }).map((_, i) => (
                    <th key={i} className="p-1 border-b border-r border-slate-300 text-center min-w-[28px] font-bold bg-white">
                      {i + 1}
                      {projectedMeetings[i] && (
                        <div className="text-[7px] text-indigo-500 font-normal">{dayjs(projectedMeetings[i].date).format("DD/MM")}</div>
                      )}
                    </th>
                  ))}
                  <th className="p-1 border-b border-r text-center w-8 bg-emerald-50 text-emerald-700 font-bold">H</th>
                  <th className="p-1 border-b border-r text-center w-8 bg-amber-50 text-amber-700 font-bold">S</th>
                  <th className="p-1 border-b border-r text-center w-8 bg-blue-50 text-blue-700 font-bold">I</th>
                  <th className="p-1 border-b text-center w-8 bg-rose-50 text-rose-700 font-bold">A</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any, index: number) => {
                  const stdId = student.id || student.ID;
                  const stdName = student.profile?.full_name || student.Profile?.FullName || student.username || "-";
                  let totalH = 0, totalS = 0, totalI = 0, totalA = 0;

                  return (
                    <tr key={stdId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="sticky left-0 z-20 bg-white p-2 border-b border-r text-center text-slate-500">{index + 1}</td>
                      <td className="sticky left-[32px] z-20 bg-white p-2 border-b border-r font-semibold truncate max-w-[180px]">{stdName}</td>
                      
                      {Array.from({ length: maxCols }).map((_, i) => {
                        const meeting = projectedMeetings[i];
                        if (!meeting) return <td key={i} className="p-1 border-b border-r text-center text-slate-200">-</td>;

                        let cellClass = "bg-transparent", label = "-";

                        if (meeting.isHoliday) {
                          cellClass = "bg-[#4E342E]"; 
                          label = ""; 
                        } else if (meeting.journal) {
                          const atts = meeting.journal.attendances || meeting.journal.Attendances || [];
                          const record = atts.find((a: any) => a.student_id === stdId || a.StudentID === stdId);
                          const status = record?.status || record?.Status || "-";

                          if (status === "HADIR") { totalH++; label = "H"; cellClass = "bg-emerald-50 text-emerald-700 font-bold"; }
                          else if (status === "SAKIT") { totalS++; label = "S"; cellClass = "bg-amber-50 text-amber-700 font-bold"; }
                          else if (status === "IZIN") { totalI++; label = "I"; cellClass = "bg-blue-50 text-blue-700 font-bold"; }
                          else if (status === "ALPA") { totalA++; label = "A"; cellClass = "bg-rose-50 text-rose-700 font-bold"; }
                        } else {
                          label = ""; // Belum ada absensi (putih)
                        }

                        return <td key={i} className={`p-1 border-b border-r text-center ${cellClass}`}>{label}</td>;
                      })}

                      <td className="p-1 border-b border-r text-center font-bold text-emerald-700 bg-emerald-50/30">{totalH}</td>
                      <td className="p-1 border-b border-r text-center font-bold text-amber-700 bg-amber-50/30">{totalS}</td>
                      <td className="p-1 border-b border-r text-center font-bold text-blue-700 bg-blue-50/30">{totalI}</td>
                      <td className="p-1 border-b text-center font-bold text-rose-700 bg-rose-50/30">{totalA}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER INFO */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5"><Info className="w-3 h-3" /> <strong>INFO REKAP MAPEL:</strong></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> H = Hadir</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> I = Izin</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> S = Sakit</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> A = Alpa</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#4E342E] rounded-full"></div> Cell Coklat = Pertemuan di Hari Libur</div>
      </div>
    </div>
  );
}