// LOKASI: src/components/pages/manage-lessons/teacher-workload-table.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface TeacherWorkloadTableProps {
  workloadArray: any[];
}

export function TeacherWorkloadTable({ workloadArray }: TeacherWorkloadTableProps) {
  // Fungsi Cerdas untuk menentukan status beban kerja
  const getWorkloadStatus = (jtm: number) => {
    if (jtm > 40) return { 
      label: "Overload", 
      color: "bg-rose-100 text-rose-700 border-rose-200", 
      icon: <AlertCircle className="h-3 w-3 mr-1" /> 
    };
    if (jtm >= 24 && jtm <= 40) return { 
      label: "Memenuhi", 
      color: "bg-emerald-100 text-emerald-700 border-emerald-200", 
      icon: <CheckCircle2 className="h-3 w-3 mr-1" /> 
    };
    return { 
      label: "Kurang", 
      color: "bg-amber-100 text-amber-700 border-amber-200", 
      icon: <AlertTriangle className="h-3 w-3 mr-1" /> 
    };
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 font-bold">Nama Guru</th>
            <th className="px-4 py-3 font-bold">Mata Pelajaran</th>
            <th className="px-4 py-3 font-bold text-center">Jml Kelas</th>
            <th className="px-4 py-3 font-bold text-center">Status JTM</th>
            <th className="px-4 py-3 font-bold text-center">Total JTM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {workloadArray.map((w, idx) => {
            const status = getWorkloadStatus(w.totalJTM);
            return (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">
                    {w.teacher?.profile?.full_name || w.teacher?.full_name || w.teacher?.name || "Tanpa Nama"}
                    </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(w.subjects).map((sub: any, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] bg-white text-slate-500 border-slate-200">
                        {sub}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-slate-600 font-mono font-medium">
                  {w.classes.size}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 shadow-sm ${status.color}`}>
                    {status.icon} {status.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-mono font-bold text-sm ${w.totalJTM > 40 ? 'text-rose-600' : w.totalJTM < 24 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {w.totalJTM} Jam
                  </span>
                </td>
              </tr>
            );
          })}
          {workloadArray.length === 0 && (
            <tr>
              <td colSpan={5} className="h-32 text-center text-slate-400">
                Belum ada penugasan guru di tahun ajaran ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}