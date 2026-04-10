// LOKASI: src/components/pages/journals/tabs/recap-class-tab.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, FileSpreadsheet, FileText, Building2, Info } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { studentService } from "@/services/student.service";
import { journalService } from "@/services/journal.service";
import { classService } from "@/services/class.service";
import { curriculumService } from "@/services/curriculum.service"; //  Tambahkan ini
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";
import { apiClient } from "@/lib/axios";

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export function RecapClassTab({ institutionId }: { institutionId: string }) {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [selectedInstId, setSelectedInstId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  const actualInstId = isSuperAdmin ? selectedInstId : institutionId;

  // 1. Tarik Lembaga (Untuk info weekly_day_off)
  const { data: instRes, isLoading: loadInst } = useQuery({
    queryKey: ["institutions_recap_class"],
    queryFn: async () => {
      const res = await apiClient.get("/institutions", { params: { limit: 1000 } });
      return res.data;
    },
    enabled: true,
  });
  const institutions = extractArray(instRes);

  // 2. Tarik Daftar Kelas
  const { data: classesRes, isLoading: loadClasses } = useQuery({
    queryKey: ["classes_for_recap", actualInstId],
    queryFn: () => classService.getAll({ institution_id: actualInstId, limit: 500 }),
    enabled: !!actualInstId,
  });
  const classes = extractArray(classesRes);

  // 3. Tarik Daftar Siswa
  const { data: studentsRes, isLoading: loadStudents } = useQuery({
    queryKey: ["students_recap_class", selectedClassId],
    queryFn: () => studentService.getAll({ class_id: selectedClassId, limit: 1000 }),
    enabled: !!selectedClassId,
  });
  const students = extractArray(studentsRes);

  // 4. Tarik Jurnal
  const { data: journalsRes, isLoading: loadJournals } = useQuery({
    queryKey: ["journals_recap_class", selectedClassId, selectedMonth],
    queryFn: () => journalService.getJournals({ class_id: selectedClassId, limit: 5000 }),
    enabled: !!selectedClassId,
  });
  const journals = extractArray(journalsRes);

  // 5. Tarik Hari Libur 
  const { data: holidayRes } = useQuery({
    queryKey: ["holidays_recap_class", actualInstId, selectedMonth],
    queryFn: () => curriculumService.getHolidays({ institution_id: actualInstId, month: selectedMonth }),
    enabled: !!actualInstId,
  });
  const holidays = extractArray(holidayRes);

  //  MEMBANGUN MATRIKS SESI DI MEMORI
  const rekapData = useMemo(() => {
    const map: Record<string, Record<number, string[]>> = {};
    const filtered = journals.filter((j: any) => dayjs(j.date || j.Date).format("YYYY-MM") === selectedMonth);
    
    const sorted = [...filtered].sort((a, b) => new Date(a.created_at || a.CreatedAt).getTime() - new Date(b.created_at || b.CreatedAt).getTime());

    sorted.forEach((j: any) => {
      const tgl = dayjs(j.date || j.Date).date();
      const atts = j.attendances || j.Attendances || [];
      
      atts.forEach((a: any) => {
        const sId = a.student_id || a.StudentID;
        const status = a.status || a.Status;
        
        if (!map[sId]) map[sId] = {};
        if (!map[sId][tgl]) map[sId][tgl] = [];
        map[sId][tgl].push(status);
      });
    });
    return map;
  }, [journals, selectedMonth]);

  const isLoading = loadClasses || loadStudents || loadJournals;
  const daysInMonth = dayjs(`${selectedMonth}-01`).daysInMonth();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleExport = async (format: 'excel' | 'pdf') => {
    toast.info(`Membangun dokumen ${format.toUpperCase()}...`);
    try {
      await journalService.exportRecap('kelas', selectedMonth, format, selectedClassId);
      toast.success("Dokumen berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal mengunduh dokumen.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          {isSuperAdmin && (
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3" /> 1. Pilih Lembaga
              </label>
              <Select value={selectedInstId} onValueChange={(val) => { setSelectedInstId(val); setSelectedClassId(""); }}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
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

          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-500 uppercase">{isSuperAdmin ? "2." : "1."} Pilih Rombongan Belajar</label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={!actualInstId}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder={loadClasses ? "Memuat Kelas..." : "Pilih Kelas..."} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => (
                  <SelectItem key={c.id || c.ID} value={c.id || c.ID}>{c.name || c.Name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 w-40">
            <label className="text-xs font-bold text-slate-500 uppercase">{isSuperAdmin ? "3." : "2."} Pilih Bulan</label>
            <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border-slate-200" />
          </div>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10" onClick={() => handleExport('excel')} disabled={!selectedClassId}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white h-10 shadow-sm" onClick={() => handleExport('pdf')} disabled={!selectedClassId}>
              <FileText className="w-4 h-4 mr-2" /> Cetak PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {!selectedClassId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p>Pilih rombel dan bulan untuk melihat preview rekap kelas.</p>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="overflow-auto flex-1 max-h-[60vh]">
            <table className="w-full text-[11px] border-collapse">
              <thead className="sticky top-0 z-30 bg-slate-100 shadow-sm">
                <tr>
                  <th className="sticky left-0 z-40 bg-slate-100 p-2 border-b border-r border-slate-300 w-8 text-center font-bold">No</th>
                  <th className="sticky left-[32px] z-40 bg-slate-100 p-2 border-b border-r border-slate-300 min-w-[180px] text-left font-bold shadow-sm">Nama Siswa</th>
                  <th className="p-2 border-b border-r border-slate-300 text-center font-bold bg-slate-200 w-10">Sesi</th>
                  {monthDates.map(d => (
                    <th key={d} className="p-1 border-b border-r border-slate-300 text-center min-w-[24px] font-bold text-slate-700">{d}</th>
                  ))}
                  <th className="p-2 border-b border-r border-slate-300 text-center bg-emerald-100 text-emerald-800 font-bold min-w-[30px]">H</th>
                  <th className="p-2 border-b border-r border-slate-300 text-center bg-blue-100 text-blue-800 font-bold min-w-[30px]">I</th>
                  <th className="p-2 border-b border-r border-slate-300 text-center bg-amber-100 text-amber-800 font-bold min-w-[30px]">S</th>
                  <th className="p-2 border-b border-r border-slate-300 text-center bg-rose-100 text-rose-800 font-bold min-w-[30px]">A</th>
                  <th className="p-2 border-b border-slate-300 text-center bg-indigo-100 text-indigo-800 font-bold min-w-[40px]">%</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any, index: number) => {
                  const stdId = student.id || student.ID;
                  const stdName = student.profile?.full_name || student.Profile?.FullName || student.username || "-";

                  let totalH = 0, totalI = 0, totalS = 0, totalA = 0;
                  Object.values(rekapData[stdId] || {}).forEach(sessions => {
                    sessions.forEach(status => {
                      if (status === "HADIR") totalH++;
                      if (status === "IZIN") totalI++;
                      if (status === "SAKIT") totalS++;
                      if (status === "ALPA") totalA++;
                    });
                  });

                  const totalAll = totalH + totalI + totalS + totalA;
                  const persentase = totalAll > 0 ? Math.round((totalH / totalAll) * 100) : 0;

                  return Array.from({ length: 4 }).map((_, sesiIndex) => (
                    <tr key={`${stdId}-sesi-${sesiIndex}`} className="hover:bg-slate-50/50">
                      {sesiIndex === 0 && (
                        <>
                          <td rowSpan={4} className="sticky left-0 z-20 bg-white p-2 border-b border-r text-center align-top">{index + 1}</td>
                          <td rowSpan={4} className="sticky left-[32px] z-20 bg-white p-2 border-b border-r font-semibold align-top shadow-sm truncate max-w-[180px]">{stdName}</td>
                        </>
                      )}
                      
                      <td className="p-1 border-b border-r text-center font-bold text-slate-400 bg-slate-50/50">{sesiIndex + 1}</td>
                      
                      {monthDates.map(dateNum => {
                        const dateStr = `${selectedMonth}-${dateNum.toString().padStart(2, '0')}`;
                        const currentDate = dayjs(dateStr);
                        const dayName = currentDate.locale("id").format("SABTU").toUpperCase();

                        // 1. Cek Libur Lembaga 
                        const activeInstitution = institutions.find((i: any) => (i.id || i.ID) === actualInstId);
                        const weeklyDayOff = activeInstitution?.weekly_day_off || "JUMAT";
                        const isWeeklyOff = dayName === weeklyDayOff;
                        const isIncidental = holidays.some((h: any) => dayjs(h.date).isSame(currentDate, "day"));
                        const isHoliday = isWeeklyOff || isIncidental;

                        const status = rekapData[stdId]?.[dateNum]?.[sesiIndex];
                        let label = "-";
                        let bgClass = "text-slate-300";

                        //  LOGIKA VISUAL BARU
                        if (isHoliday) {
                          label = ""; 
                          bgClass = "bg-[#4E342E]"; // Coklat Tua
                        } else {
                          if (status === "HADIR") { label = "H"; bgClass = "bg-emerald-50 text-emerald-700 font-bold"; }
                          else if (status === "IZIN") { label = "I"; bgClass = "bg-blue-50 text-blue-700 font-bold"; }
                          else if (status === "SAKIT") { label = "S"; bgClass = "bg-amber-50 text-amber-700 font-bold"; }
                          else if (status === "ALPA") { label = "A"; bgClass = "bg-rose-50 text-rose-700 font-bold"; }
                        }

                        return <td key={dateNum} className={`p-1 border-b border-r text-center ${bgClass}`}>{label}</td>;
                      })}

                      {sesiIndex === 0 && (
                        <>
                          <td rowSpan={4} className="p-2 border-b border-r text-center font-bold text-emerald-700 bg-emerald-50/50 align-middle">{totalH}</td>
                          <td rowSpan={4} className="p-2 border-b border-r text-center font-bold text-blue-700 bg-blue-50/50 align-middle">{totalI}</td>
                          <td rowSpan={4} className="p-2 border-b border-r text-center font-bold text-amber-700 bg-amber-50/50 align-middle">{totalS}</td>
                          <td rowSpan={4} className="p-2 border-b border-r text-center font-bold text-rose-700 bg-rose-50/50 align-middle">{totalA}</td>
                          <td rowSpan={4} className="p-2 border-b text-center font-bold text-indigo-700 bg-indigo-50/50 align-middle">{persentase}%</td>
                        </>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER INFO */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5"><Info className="w-3 h-3" /> <strong>INFO REKAP KELAS:</strong></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> H = Hadir</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#4E342E] rounded-full"></div> Cell Coklat = Hari Libur Akademik</div>
        <div className="ml-auto italic text-[9px] text-slate-400">* Data menampilkan 4 sesi utama kegiatan harian kelas.</div>
      </div>
    </div>
  );
}