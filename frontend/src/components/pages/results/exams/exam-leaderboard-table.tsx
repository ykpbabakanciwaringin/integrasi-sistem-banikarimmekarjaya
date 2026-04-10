// LOKASI: src/components/pages/results/exams/exam-leaderboard-table.tsx
import { ChevronLeft, ChevronRight, ScanSearch, ClipboardCheck, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ExamLeaderboardTable({ state, data, modals }: any) {
  
  const TableSkeleton = () => (
    <>
      {[...Array(state.limit > 5 ? 5 : state.limit)].map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white border-b border-slate-100">
          <TableCell className="pl-6 text-center"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell>
            <div className="flex flex-col gap-2 w-full">
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-3 w-28 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </TableCell>
          <TableCell className="text-center"><div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse mx-auto"></div></TableCell>
          <TableCell className="text-center"><div className="h-6 w-14 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell className="text-center"><div className="h-8 w-12 bg-slate-200 rounded-lg animate-pulse mx-auto"></div></TableCell>
          <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse ml-auto"></div></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="overflow-x-auto min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-[60px] pl-6 text-center text-[11px] uppercase font-bold text-slate-500">No</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Identitas Peserta</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-500">Status Sesi</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-500">Benar / Salah</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-800">Skor Akhir</TableHead>
              <TableHead className="text-right pr-6 text-[11px] uppercase font-bold text-slate-500">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {data.isLoading ? (
              <TableSkeleton />
            ) : data.paginatedResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-24 text-center hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                      <ClipboardCheck className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Data hasil ujian tidak ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.paginatedResults.map((r: any, idx: number) => {
                const isDone = r.exam_status !== "BELUM UJIAN" && r.exam_status !== "WORKING";
                const badgeColor = r.exam_status === "WORKING" ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" :
                                   r.exam_status === "BLOCKED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                   !isDone ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";

                const subjectName = r.subject_name || r.subject?.name || "Mata Pelajaran Umum";

                return (
                  <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 group">
                    <TableCell className="pl-6 text-center text-slate-400 text-xs font-medium">
                      {(state.page - 1) * state.limit + idx + 1}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-slate-800 text-sm leading-none">{r.student_name}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">@{r.student_username}</span>
                          {r.student?.profile?.class?.name && (
                            <span className="bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-semibold text-indigo-600 text-[9px] uppercase">
                              {r.student.profile.class.name}
                            </span>
                          )}
                          {/*  IDENTIFIKASI MATA PELAJARAN SPESIFIK */}
                          <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-600 text-[9px] uppercase max-w-[150px] truncate">
                            <BookOpen className="h-3 w-3 shrink-0" /> {subjectName}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className={`${badgeColor} shadow-none font-bold uppercase text-[9px] px-2 py-0.5 tracking-wider border`}>
                        {r.exam_status === "DONE" ? "SELESAI" : r.exam_status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {isDone ? (
                        <span className="text-[11px] font-bold px-2 py-1 bg-slate-50 rounded text-slate-700 border border-slate-200 font-mono">
                          <span className="text-emerald-600">{r.correct_count}</span> / <span className="text-rose-500">{r.wrong_count}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg border shadow-sm font-black text-lg tracking-tight font-mono ${
                        !isDone ? "bg-slate-50 border-slate-200 text-slate-300" : 
                        r.final_score >= 75 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : 
                        "bg-amber-50 border-amber-200 text-amber-700"
                      }`}>
                        {isDone ? Number(r.final_score).toFixed(1).replace('.0', '') : "-"}
                      </div>
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => modals.setSelectedParticipant(r)} 
                        disabled={!isDone} 
                        className="h-8 w-8 p-0 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white shadow-sm transition-colors opacity-60 group-hover:opacity-100" 
                        title="Lihat LJK Digital (Detail Analisis)"
                      >
                        <ScanSearch className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!data.isLoading && data.paginatedResults.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{(state.page - 1) * state.limit + 1}</span> - <span className="font-bold text-slate-800">{Math.min(state.page * state.limit, data.totalItems)}</span> dari <span className="font-bold text-slate-800">{data.totalItems}</span> hasil
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={state.limit.toString()} onValueChange={(v) => { state.setLimit(Number(v)); state.setPage(1); }}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => state.setPage(state.page - 1)} disabled={state.page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {state.page} / {data.totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => state.setPage(state.page + 1)} disabled={state.page >= data.totalPages}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}