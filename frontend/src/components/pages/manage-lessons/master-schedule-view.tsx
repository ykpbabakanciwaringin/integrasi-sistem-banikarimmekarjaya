// LOKASI: src/components/pages/manage-lessons/master-schedule-view.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, LayoutGrid, Users, Printer, Download, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { classService } from "@/services/class.service";
import { scheduleService } from "@/services/schedule.service";
import { downloadBlob } from "@/lib/axios";

import { TeacherWorkloadTable } from "./teacher-workload-table";

interface MasterScheduleViewProps {
  institutionId: string;
  academicYearId: string;
}

//  HELPER FUNCTIONS (Persis seperti di Backend)
const dayWeight = (day: string) => {
  switch (day.toUpperCase()) {
    case "SENIN": return 1;
    case "SELASA": return 2;
    case "RABU": return 3;
    case "KAMIS": return 4;
    case "JUMAT": return 5;
    case "SABTU": return 6;
    case "AHAD": return 7;
    default: return 99;
  }
};

const levelWeight = (level: string) => {
  const lvl = level.trim().toUpperCase();
  switch (lvl) {
    case "I": case "1": return 1;
    case "II": case "2": return 2;
    case "III": case "3": return 3;
    case "IV": case "4": return 4;
    case "V": case "5": return 5;
    case "VI": case "6": return 6;
    case "VII": case "7": return 7;
    case "VIII": case "8": return 8;
    case "IX": case "9": return 9;
    case "X": case "10": return 10;
    case "XI": case "11": return 11;
    case "XII": case "12": return 12;
    default: return 99;
  }
};

const getPureClassName = (level: string, name: string) => {
  let nm = name.toUpperCase().trim();
  const lvl = level.toUpperCase().trim();
  nm = nm.replace(lvl, "").trim();
  if (nm.startsWith("-")) nm = nm.substring(1).trim();
  return nm || name;
};

const extractArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
};

export function MasterScheduleView({ institutionId, academicYearId }: MasterScheduleViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: classesRes, isLoading: loadingClasses } = useQuery({
    queryKey: ["classes_list_all", institutionId],
    queryFn: () => classService.getAll({ institution_id: institutionId, limit: 1000 }),
    enabled: !!institutionId,
  });

  const { data: allocationsRes, isLoading: loadingAllocs } = useQuery({
    queryKey: ["allocations_master", institutionId, academicYearId],
    queryFn: () => scheduleService.getAllocations({
      institution_id: institutionId,
      academic_year_id: academicYearId,
    }),
    enabled: !!institutionId && !!academicYearId,
  });

  //  ENGINE PEMROSESAN DATA PRESISI TINGGI
  const { sortedClasses, sessions, daySessionCount, legends, workloadArray } = useMemo(() => {
    const rawClasses = extractArray(classesRes);
    const rawAllocations = extractArray(allocationsRes);

    // 1. Sort Classes
    const sClasses = [...rawClasses].sort((a, b) => {
      const wA = levelWeight(a.level);
      const wB = levelWeight(b.level);
      if (wA === wB) return a.name.localeCompare(b.name);
      return wA - wB;
    });

    // 2. Generate Legend & Codes
    let codeCounter = 1;
    const legendMap: Record<string, any> = {};
    const teacherWorkload: Record<string, any> = {};

    rawAllocations.forEach((alloc: any) => {
      // Workload Logic
      const tId = alloc.teacher_id;
      if (!teacherWorkload[tId]) {
        teacherWorkload[tId] = { teacher: alloc.teacher, subjects: new Set(), classes: new Set(), totalJTM: 0 };
      }
      teacherWorkload[tId].subjects.add(alloc.subject?.name);
      teacherWorkload[tId].classes.add(alloc.class?.name);
      teacherWorkload[tId].totalJTM += (alloc.schedules?.length || 0);

      // Legend Logic
      const key = `${alloc.teacher_id}_${alloc.subject_id}`;
      if (!legendMap[key]) {
        legendMap[key] = {
          code: codeCounter++,
          subject: alloc.subject?.name || "Mapel",
          teacher: alloc.teacher?.profile?.full_name || alloc.teacher?.full_name || "Guru",
          jtm: 0,
        };
      }
      legendMap[key].jtm += (alloc.schedules?.length || 0);
    });

    const wArray = Object.values(teacherWorkload).sort((a, b) => b.totalJTM - a.totalJTM);
    const legArray = Object.values(legendMap).sort((a: any, b: any) => a.code - b.code);

    // 3. Filter & Sort Sessions (Max 6 per day)
    const sessionMap: Record<string, boolean> = {};
    const allSessions: any[] = [];

    rawAllocations.forEach((alloc: any) => {
      alloc.schedules?.forEach((sched: any) => {
        if (!sched.start_time || !sched.end_time) return; // Skip jadwal kosong
        const key = `${sched.day_of_week}_${sched.start_time}_${sched.end_time}`;
        if (!sessionMap[key]) {
          sessionMap[key] = true;
          allSessions.push(sched);
        }
      });
    });

    allSessions.sort((a, b) => {
      const dW = dayWeight(a.day_of_week) - dayWeight(b.day_of_week);
      if (dW === 0) return a.start_time.localeCompare(b.start_time);
      return dW;
    });

    const finalSessions: any[] = [];
    const dayCount: Record<string, number> = {};
    allSessions.forEach((s) => {
      const day = s.day_of_week.toUpperCase();
      if (!dayCount[day]) dayCount[day] = 0;
      if (dayCount[day] < 6) {
        finalSessions.push(s);
        dayCount[day]++;
      }
    });

    return { sortedClasses: sClasses, sessions: finalSessions, daySessionCount: dayCount, legends: legArray, workloadArray: wArray };
  }, [classesRes, allocationsRes]);

  const getCodeForCell = (classId: string, day: string, startTime: string) => {
    const rawAllocations = extractArray(allocationsRes);
    for (const alloc of rawAllocations) {
      if (alloc.class_id === classId) {
        for (const sched of (alloc.schedules || [])) {
          if (sched.day_of_week === day && sched.start_time === startTime) {
            const leg = legends.find(l => l.subject === alloc.subject?.name && l.teacher === (alloc.teacher?.profile?.full_name || alloc.teacher?.full_name));
            return leg ? leg : null;
          }
        }
      }
    }
    return null;
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await downloadBlob(`/schedules/export-pdf?institution_id=${institutionId}&academic_year_id=${academicYearId}`, "Master_Jadwal_Pelajaran.pdf");
      toast.success("File PDF berhasil diunduh!");
    } catch (error: any) { toast.error("Gagal mengunduh file PDF"); } finally { setIsPrinting(false); }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await downloadBlob(`/schedules/export-excel?institution_id=${institutionId}&academic_year_id=${academicYearId}`, "Master_Jadwal_Pelajaran.xlsx");
      toast.success("File Excel berhasil diunduh!");
    } catch (error: any) { toast.error("Gagal mengunduh file Excel"); } finally { setIsExporting(false); }
  };

  if (loadingClasses || loadingAllocs) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-[#047857] mb-4" />
        <p className="font-medium animate-pulse">Menyusun Matriks Cerdas...</p>
      </div>
    );
  }

  if (!academicYearId) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
        <p>Tahun Ajaran Aktif tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <Card className="p-4 bg-slate-50/50 shadow-sm border-slate-200">
      <Tabs defaultValue="matrix" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <TabsList className="bg-white border border-slate-200 p-1 shadow-sm">
            <TabsTrigger value="matrix" className="data-[state=active]:bg-[#047857] data-[state=active]:text-white flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> Master Matriks
            </TabsTrigger>
            <TabsTrigger value="workload" className="data-[state=active]:bg-[#047857] data-[state=active]:text-white flex items-center gap-2">
              <Users className="h-4 w-4" /> Beban Kerja
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto border-slate-300" onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2 text-slate-600" />}
              PDF Potrait
            </Button>
            <Button size="sm" className="w-full sm:w-auto bg-[#047857] hover:bg-[#065f46] text-white" onClick={handleExportExcel} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Excel Matriks
            </Button>
          </div>
        </div>

        <TabsContent value="matrix" className="m-0 focus:outline-none">
          <div className="flex flex-col xl:flex-row gap-4 items-start">
            
            {/*  TABEL KIRI: MATRIKS JADWAL */}
            <div className="w-full xl:w-[70%] overflow-x-auto bg-white rounded-lg border border-slate-300 shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="border border-slate-300 bg-[#047857] text-white py-4 px-2 text-center align-middle w-8">
                       <span className="[writing-mode:vertical-rl] rotate-180 font-bold tracking-widest text-xs">HARI</span>
                    </th>
                    <th className="border border-slate-300 bg-[#047857] text-white px-3 font-bold w-28 whitespace-nowrap">
                      JAM
                    </th>
                    {sortedClasses.map((c) => (
                      <th key={c.id} className="border border-slate-300 bg-[#047857] text-white py-6 px-1 text-center align-middle min-w-[28px] max-w-[36px]">
                        <span className="[writing-mode:vertical-rl] rotate-180 font-bold text-[11px] whitespace-nowrap">
                          {c.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white text-slate-700">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={sortedClasses.length + 2} className="h-32 text-center text-slate-400 italic">
                        Belum ada jadwal yang diatur
                      </td>
                    </tr>
                  ) : null}
                  
                  {sessions.map((session, sIdx) => {
                    const dayName = session.day_of_week.toUpperCase();
                    const isFirstOfDay = sIdx === 0 || sessions[sIdx - 1].day_of_week.toUpperCase() !== dayName;
                    const rowSpanCount = daySessionCount[dayName];

                    return (
                      <tr key={`${dayName}-${session.start_time}`} className="hover:bg-slate-50 transition-colors group">
                        {isFirstOfDay && (
                          <td rowSpan={rowSpanCount} className="border border-slate-300 bg-emerald-50 text-center align-middle p-1">
                            <span className="[writing-mode:vertical-rl] rotate-180 font-bold text-emerald-800 text-xs tracking-widest">
                              {dayName}
                            </span>
                          </td>
                        )}
                        <td className="border border-slate-300 px-2 py-1.5 text-center text-xs font-medium text-slate-600 whitespace-nowrap">
                          {session.start_time}-{session.end_time}
                        </td>
                        {sortedClasses.map((c) => {
                          const legInfo = getCodeForCell(c.id, session.day_of_week, session.start_time);
                          return (
                            <td key={c.id} className="border border-slate-300 p-0 text-center relative">
                              <div className="w-full h-full min-h-[28px] flex items-center justify-center text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                                   title={legInfo ? `${legInfo.subject} \nOleh: ${legInfo.teacher}` : "Kosong"}>
                                {legInfo ? legInfo.code : <span className="text-slate-300 font-normal">-</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/*  TABEL KANAN: LEGENDA KODE */}
            <div className="w-full xl:w-[30%] bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-300 p-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-700">KETERANGAN KODE</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#047857] text-white sticky top-0 z-10">
                    <tr>
                      <th className="p-2 border border-slate-300 text-center w-12">KODE</th>
                      <th className="p-2 border border-slate-300">MATA PELAJARAN</th>
                      <th className="p-2 border border-slate-300">GURU PENGAMPU</th>
                      <th className="p-2 border border-slate-300 text-center w-10">JTM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {legends.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-slate-400">Tidak ada data</td></tr>
                    ) : null}
                    {legends.map((leg: any) => (
                      <tr key={leg.code} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-emerald-700">{leg.code}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-700 font-medium truncate max-w-[100px]" title={leg.subject}>{leg.subject}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-600 truncate max-w-[120px]" title={leg.teacher}>{leg.teacher}</td>
                        <td className="p-2 text-center text-slate-500 font-mono">{leg.jtm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="workload" className="m-0">
          <TeacherWorkloadTable workloadArray={workloadArray} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}