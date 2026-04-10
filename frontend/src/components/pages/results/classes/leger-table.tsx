import React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ClipboardCheck, User } from "lucide-react";

export function LegerTable({ controller }: { controller: any }) {
  const { data, state, handlers } = controller;
  
  //  PERBAIKAN: totalItems dan totalPages diambil dari 'data', bukan 'state'
  // Hal ini karena di useClassLegerController, variabel tersebut dikembalikan di dalam objek data
  const { students, subjectList, isLoading, totalItems, totalPages } = data;
  const { page, limit, localReports } = state;

  // Fungsi untuk menangani simpan saat tekan Enter
  const handleKeyDown = (e: React.KeyboardEvent, studentId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlers.handleSaveRow(studentId);
      (e.target as HTMLElement).blur(); // Hilangkan fokus agar UX terasa seperti Excel
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Gunakan fallback 0 jika totalItems bernilai undefined agar tidak muncul error NaN
  if ((totalItems || 0) === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-20 flex flex-col items-center justify-center text-slate-500 no-print">
        <ClipboardCheck className="h-12 w-12 text-slate-300 mb-3" />
        <p className="font-medium text-lg">Belum ada data siswa di kelas ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col no-print">
      <div className="overflow-x-auto">
        <Table className="relative w-full border-collapse">
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              {/* Kolom No (Sticky) */}
              <TableHead className="w-[50px] text-center font-bold text-slate-600 sticky left-0 z-30 bg-slate-50 border-r border-slate-200">
                No
              </TableHead>
              {/* Kolom Nama Siswa (Sticky) */}
              <TableHead className="min-w-[250px] font-bold text-slate-600 sticky left-[50px] z-30 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Nama Siswa
              </TableHead>

              {/* Kolom Nilai Mapel (Scrollable) */}
              {subjectList?.map((mapel: string) => (
                <TableHead key={mapel} className="min-w-[120px] text-center font-bold text-slate-600 border-x border-slate-100">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Mapel</span>
                    <span className="truncate w-full px-2" title={mapel}>{mapel}</span>
                  </div>
                </TableHead>
              ))}

              {/* Kolom Absensi & Catatan (Scrollable) */}
              <TableHead className="w-[70px] text-center font-bold text-slate-600 bg-amber-50/50">S</TableHead>
              <TableHead className="w-[70px] text-center font-bold text-slate-600 bg-blue-50/50">I</TableHead>
              <TableHead className="w-[70px] text-center font-bold text-slate-600 bg-rose-50/50">A</TableHead>
              <TableHead className="min-w-[250px] font-bold text-slate-600 bg-slate-50 border-l border-slate-200">Catatan Wali Kelas</TableHead>
              <TableHead className="w-[120px] text-center font-bold text-slate-600 bg-slate-50 border-l border-slate-200">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {students.map((student: any, idx: number) => {
              const report = localReports[student.student_id] || {};
              const globalIndex = (page - 1) * limit + idx + 1;

              return (
                <TableRow key={student.student_id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 group">
                  {/* No (Sticky) */}
                  <TableCell className="text-center font-medium text-slate-400 text-xs sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                    {globalIndex}
                  </TableCell>
                  
                  {/* Nama Siswa (Sticky) */}
                  <TableCell className="sticky left-[50px] z-20 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-sm truncate">{student.student_name}</span>
                        <span className="text-[10px] font-mono text-slate-400 truncate">{student.username}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Nilai Mapel (Read Only) */}
                  {subjectList?.map((mapel: string) => (
                    <TableCell key={mapel} className="text-center font-bold text-slate-700 border-x border-slate-50 bg-slate-50/30">
                      {student.grades[mapel] !== undefined && student.grades[mapel] !== null 
                        ? student.grades[mapel] 
                        : <span className="text-slate-300 font-normal">-</span>}
                    </TableCell>
                  ))}

                  {/* Form Absensi */}
                  <TableCell className="p-1.5 align-top">
                    <Input
                      type="number" min={0}
                      value={report.sick ?? 0}
                      onChange={(e) => handlers.handleLocalChange(student.student_id, "sick", e.target.value)}
                      onBlur={() => handlers.handleSaveRow(student.student_id)}
                      onKeyDown={(e) => handleKeyDown(e, student.student_id)}
                      className="h-12 text-center font-bold border-amber-200 focus-visible:ring-amber-500 bg-amber-50/30"
                    />
                  </TableCell>
                  <TableCell className="p-1.5 align-top">
                    <Input
                      type="number" min={0}
                      value={report.permission ?? 0}
                      onChange={(e) => handlers.handleLocalChange(student.student_id, "permission", e.target.value)}
                      onBlur={() => handlers.handleSaveRow(student.student_id)}
                      onKeyDown={(e) => handleKeyDown(e, student.student_id)}
                      className="h-12 text-center font-bold border-blue-200 focus-visible:ring-blue-500 bg-blue-50/30"
                    />
                  </TableCell>
                  <TableCell className="p-1.5 align-top">
                    <Input
                      type="number" min={0}
                      value={report.absent ?? 0}
                      onChange={(e) => handlers.handleLocalChange(student.student_id, "absent", e.target.value)}
                      onBlur={() => handlers.handleSaveRow(student.student_id)}
                      onKeyDown={(e) => handleKeyDown(e, student.student_id)}
                      className="h-12 text-center font-bold border-rose-200 focus-visible:ring-rose-500 bg-rose-50/30"
                    />
                  </TableCell>

                  {/* Form Catatan */}
                  <TableCell className="p-1.5 align-top border-l border-slate-100">
                    <Textarea
                      placeholder="Tambahkan catatan wali kelas..."
                      value={report.note || ""}
                      onChange={(e) => handlers.handleLocalChange(student.student_id, "note", e.target.value)}
                      onBlur={() => handlers.handleSaveRow(student.student_id)}
                      className="resize-none h-12 text-xs border-slate-200 focus-visible:ring-emerald-500"
                    />
                  </TableCell>

                  {/* Switch Naik Kelas */}
                  <TableCell className="text-center py-4 align-middle border-l border-slate-100">
                    <div className="flex flex-col items-center gap-1.5">
                      <Switch
                        checked={report.is_promoted}
                        onCheckedChange={(v: boolean) => {
                          handlers.handleLocalChange(student.student_id, "is_promoted", v);
                          // Auto save langsung saat switch ditekan
                          setTimeout(() => handlers.handleSaveRow(student.student_id), 100);
                        }}
                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-rose-500"
                      />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${report.is_promoted ? "text-emerald-600" : "text-rose-600"}`}>
                        {report.is_promoted ? "Naik" : "Tinggal"}
                      </span>
                    </div>
                  </TableCell>

                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* --- PAGINASI BAWAH --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> - <span className="font-bold text-slate-800">{Math.min(page * limit, totalItems || 0)}</span> dari <span className="font-bold text-slate-800">{totalItems || 0}</span> siswa
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="text-[11px] text-slate-500 font-medium">Siswa per halaman:</span>
            <Select value={limit.toString()} onValueChange={(v) => { state.setLimit(Number(v)); state.setPage(1); }}>
              <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => state.setPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
          </Button>
          <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
            Hal {page} / {totalPages || 1}
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => state.setPage(page + 1)} disabled={page >= (totalPages || 1)}>
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}