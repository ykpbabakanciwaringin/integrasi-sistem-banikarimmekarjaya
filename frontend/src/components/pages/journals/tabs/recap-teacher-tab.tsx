// LOKASI: src/components/pages/journals/tabs/recap-teacher-tab.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, GraduationCap, FileSpreadsheet, FileText, Building2, Info } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { journalService } from "@/services/journal.service";
import { teacherService } from "@/services/teacher.service";
import { curriculumService } from "@/services/curriculum.service";
import { scheduleService } from "@/services/schedule.service";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";
import { apiClient } from "@/lib/axios";

// Helper untuk memastikan data yang datang adalah Array
const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export function RecapTeacherTab({ institutionId }: { institutionId: string }) {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [selectedInstId, setSelectedInstId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  //  LOGIKA INSTITUSI AKTIF
  const actualInstId = isSuperAdmin ? selectedInstId : institutionId;

  // --- QUERY DATA ---

  // 1. Tarik Lembaga (Diperlukan untuk mendapatkan info weekly_day_off)
  const { data: instRes, isLoading: loadInst } = useQuery({
    queryKey: ["institutions_recap_teacher"],
    queryFn: async () => {
      const res = await apiClient.get("/institutions", { params: { limit: 1000 } });
      return res.data;
    },
    enabled: true, 
  });
  const institutions = extractArray(instRes);

  // 2. Tarik Daftar Guru
  const { data: teachersRes, isLoading: loadTeachers } = useQuery({
    queryKey: ["teachers_recap", actualInstId],
    queryFn: () => teacherService.getAll({ institution_id: actualInstId, limit: 1000 }),
    enabled: !!actualInstId,
  });
  const teachers = extractArray(teachersRes);

  // 3. Tarik Jurnal (Data Kehadiran Nyata)
  const { data: journalsRes, isLoading: loadJournals } = useQuery({
    queryKey: ["journals_recap_teacher", actualInstId, selectedMonth],
    queryFn: () => journalService.getJournals({ institution_id: actualInstId, limit: 5000 }),
    enabled: !!actualInstId,
  });
  const journals = extractArray(journalsRes);

  // 4. Tarik Absensi Guru Piket (Sakit/Izin)
  const { data: attendancePiketRes } = useQuery({
    queryKey: ["piket_attendances", actualInstId, selectedMonth],
    queryFn: () => teacherService.getAttendances({ institution_id: actualInstId, month: selectedMonth }),
    enabled: !!actualInstId,
  });
  const picketAttendances = extractArray(attendancePiketRes);

  // 5. Tarik Hari Libur Insidental
  const { data: holidayRes } = useQuery({
    queryKey: ["holidays_recap", actualInstId, selectedMonth],
    queryFn: () => curriculumService.getHolidays({ institution_id: actualInstId, month: selectedMonth }),
    enabled: !!actualInstId,
  });
  const holidays = extractArray(holidayRes);

  // 6. Tarik Jadwal (Untuk Hitung Target Beban Sesi)
  const { data: scheduleRes } = useQuery({
    queryKey: ["schedules_target", actualInstId],
    queryFn: () => scheduleService.getAllocations({ institution_id: actualInstId }),
    enabled: !!actualInstId,
  });
  const allocations = extractArray(scheduleRes);

  // --- LOGIKA PERHITUNGAN ---

  const filteredJournals = useMemo(() => {
    return journals.filter((j: any) => dayjs(j.date || j.Date).format("YYYY-MM") === selectedMonth);
  }, [journals, selectedMonth]);

  const daysInMonth = dayjs(`${selectedMonth}-01`).daysInMonth();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  //  ENGINE HITUNG BEBAN SESI (TARGET) - DINAMIS
  const calculateTargetSessions = (teacherId: string) => {
    let totalTarget = 0;
    const teacherAllocations = allocations.filter((a: any) => (a.teacher_id || a.TeacherID) === teacherId);

    const activeInstitution = institutions.find((i: any) => (i.id || i.ID) === actualInstId);
    const weeklyDayOff = activeInstitution?.weekly_day_off || activeInstitution?.WeeklyDayOff || "JUMAT";

    monthDates.forEach((dateNum) => {
      const currentDate = dayjs(`${selectedMonth}-${dateNum.toString().padStart(2, "0")}`);
      const dayName = currentDate.locale("id").format("SABTU").toUpperCase(); 

      if (dayName === weeklyDayOff) return;

      const isHoliday = holidays.some((h: any) => dayjs(h.date).isSame(currentDate, "day"));
      if (isHoliday) return;

      teacherAllocations.forEach((alloc: any) => {
        const scheds = alloc.schedules || alloc.Schedules || [];
        const sessionsToday = scheds.filter((s: any) => (s.day_of_week || s.DayOfWeek || "").toUpperCase() === dayName).length;
        totalTarget += sessionsToday;
      });
    });

    return totalTarget;
  };

  const handleExport = async (format: "excel" | "pdf") => {
    toast.info(`Sedang menyiapkan dokumen ${format.toUpperCase()}...`);
    try {
      const response = await apiClient.get(`/journals/export`, {
        params: { type: "guru", month: selectedMonth, format: format, institution_id: actualInstId },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Rekap_Kehadiran_Guru_${selectedMonth}.${format === "excel" ? "xlsx" : "pdf"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Dokumen berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal mengunduh dokumen.");
    }
  };

  const isLoading = loadTeachers || loadJournals;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          {isSuperAdmin && (
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Pilih Lembaga
              </label>
              <Select value={selectedInstId} onValueChange={setSelectedInstId}>
                <SelectTrigger className="bg-slate-50">
                  <SelectValue placeholder={loadInst ? "Memuat..." : "Pilih Lembaga..."} />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((i: any) => (
                    <SelectItem key={i.id || i.ID} value={i.id || i.ID}>{i.name || i.Name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5 w-40">
            <label className="text-xs font-bold text-slate-500 uppercase">Pilih Bulan</label>
            <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50" />
          </div>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 h-10" onClick={() => handleExport("excel")} disabled={!actualInstId}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white h-10 shadow-sm" onClick={() => handleExport("pdf")} disabled={!actualInstId}>
              <FileText className="w-4 h-4 mr-2" /> Cetak PDF
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE RECAP */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {!actualInstId ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <GraduationCap className="w-12 h-12 mb-4 opacity-20" />
            <p>Silakan pilih lembaga untuk melihat rekapitulasi.</p>
          </div>
        ) : isLoading ? (
          <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-[10px] border-collapse">
              <thead className="sticky top-0 z-30 bg-slate-100 shadow-sm text-slate-600">
                <tr>
                  <th className="sticky left-0 z-40 bg-slate-100 p-2 border-b border-r w-8 text-center font-bold">No</th>
                  <th className="sticky left-[32px] z-40 bg-slate-100 p-2 border-b border-r min-w-[180px] text-left font-bold">Nama Guru</th>
                  {monthDates.map(d => <th key={d} className="p-1 border-b border-r text-center min-w-[24px]">{d}</th>)}
                  <th className="p-2 border-b border-r bg-indigo-50 text-indigo-700 font-bold min-w-[45px] text-center">Beban</th>
                  <th className="p-2 border-b border-r bg-emerald-50 text-emerald-700 font-bold min-w-[45px] text-center">Aktual</th>
                  <th className="p-2 border-b bg-amber-50 text-amber-700 font-bold min-w-[50px] text-center">Capai</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher: any, index: number) => {
                  const tId = teacher.id || teacher.ID;
                  const tName = teacher.profile?.full_name || teacher.Profile?.FullName || teacher.username || "-";
                  
                  let actualSesi = 0;
                  const targetSesi = calculateTargetSessions(tId);

                  return (
                    <tr key={tId} className="hover:bg-slate-50 transition-colors">
                      <td className="sticky left-0 z-20 bg-white p-2 border-b border-r text-center">{index + 1}</td>
                      <td className="sticky left-[32px] z-20 bg-white p-2 border-b border-r font-semibold truncate max-w-[180px]">{tName}</td>
                      
                      {monthDates.map(dateNum => {
                        const dateStr = `${selectedMonth}-${dateNum.toString().padStart(2, '0')}`;
                        const currentDate = dayjs(dateStr);
                        const dayName = currentDate.locale("id").format("SABTU").toUpperCase();

                        // 1. Ambil preferensi libur lembaga (Bawaan: JUMAT)
                        const activeInstitution = institutions.find((i: any) => (i.id || i.ID) === actualInstId);
                        const weeklyDayOff = activeInstitution?.weekly_day_off || activeInstitution?.WeeklyDayOff || "JUMAT";

                        // 2. Cek apakah hari ini LIBUR (Mingguan atau Tanggal Merah)
                        const isWeeklyOff = dayName === weeklyDayOff;
                        const isIncidentalHoliday = holidays.some((h: any) => dayjs(h.date).isSame(currentDate, "day"));
                        const isTotalHoliday = isWeeklyOff || isIncidentalHoliday;

                        // 3. Ambil data Sesi Nyata (Jurnal)
                        const sessions = filteredJournals.filter((j: any) => {
                          const jTid = j.allocation?.teacher_id || j.teacher_id || j.Allocation?.TeacherID;
                          return jTid === tId && dayjs(j.date || j.Date).format("YYYY-MM-DD") === dateStr;
                        }).length;
                        actualSesi += sessions;

                        //  LOGIKA VISUAL BARU: Jika Libur, Cell Kosong & Coklat Tua
                        let label: any = sessions > 0 ? sessions : "-";
                        let cellClass = sessions > 0 ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-300";

                        if (isTotalHoliday) {
                          label = ""; // Dikosongkan sesuai aturan baru
                          cellClass = "bg-[#4E342E]"; // Warna Coklat Tua
                        } else if (sessions === 0) {
                          // Jika tidak libur tapi sesi nol, cek apakah ada data Piket (S/I/T)
                          const picket = picketAttendances.find((pa: any) => (pa.teacher_id || pa.TeacherID) === tId && dayjs(pa.date || pa.Date).format("YYYY-MM-DD") === dateStr);
                          if (picket) {
                            const status = picket.status || picket.Status;
                            if (status === "SAKIT") { label = "S"; cellClass = "bg-amber-100 text-amber-700 font-bold"; }
                            else if (status === "IZIN") { label = "I"; cellClass = "bg-blue-100 text-blue-700 font-bold"; }
                            else if (status === "HADIR_MANUAL") { label = "T"; cellClass = "bg-slate-100 text-slate-700 font-bold"; }
                          }
                        }

                        return <td key={dateNum} className={`p-1 border-b border-r text-center ${cellClass}`}>{label}</td>;
                      })}

                      <td className="p-2 border-b border-r text-center font-bold bg-indigo-50/30 text-indigo-700">{targetSesi}</td>
                      <td className="p-2 border-b border-r text-center font-bold bg-emerald-50/30 text-emerald-700">{actualSesi}</td>
                      <td className="p-2 border-b text-center font-bold bg-amber-50/30 text-amber-700">
                        {targetSesi > 0 ? Math.round((actualSesi / targetSesi) * 100) : 0}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KETERANGAN KODE */}
      <div className="flex gap-6 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5"><Info className="w-3 h-3" /> <strong>INFO:</strong></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Angka = Jumlah Sesi Mengajar</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> I = Izin</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> S = Sakit</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-400 rounded-full"></div> T = Tugas Lain / Hadir Manual</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#4E342E] rounded-full"></div> Cell Coklat = Hari Libur</div>
      </div>
    </div>
  );
}