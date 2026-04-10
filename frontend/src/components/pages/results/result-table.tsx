// LOKASI: src/components/pages/results/result-table.tsx
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, GraduationCap, MonitorPlay, ChevronRight, ChevronLeft, FolderOpen, ClipboardCheck } from "lucide-react";

interface ResultTableProps {
  activeTab: "mapel" | "wali" | "rapor" | "ujian";
  isLoading: boolean;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  dataMapel: any[];
  dataClasses: any[];
  dataSessions: any[];
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export function ResultTable({
  activeTab, isLoading, page, limit, totalItems, totalPages,
  dataMapel, dataClasses, dataSessions, onPageChange, onLimitChange,
}: ResultTableProps) {

  // SKELETON LOADER STANDAR
  const TableSkeleton = () => (
    <>
      {[...Array(limit > 5 ? 5 : limit)].map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white border-b border-slate-100">
          <TableCell className="pl-6 text-center"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse shrink-0"></div>
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </TableCell>
          <TableCell className="text-center"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          
          {/* Kolom tambahan untuk skeleton guru pengampu di tab mapel */}
          {activeTab === "mapel" && (
            <TableCell className="hidden md:table-cell"><div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div></TableCell>
          )}
          
          <TableCell className="text-right pr-6"><div className="h-8 w-24 bg-slate-200 rounded-md animate-pulse ml-auto"></div></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-[60px] pl-6 text-center text-[11px] uppercase font-bold text-slate-500">No</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">
                {activeTab === "mapel" ? "Mata Pelajaran" : activeTab === "ujian" ? "Judul Sesi Ujian" : "Kelas Rombel"}
              </TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500 text-center">
                {activeTab === "mapel" ? "Kelas" : activeTab === "ujian" ? "Tanggal Pelaksanaan" : "Total Siswa"}
              </TableHead>
              
              {/* Kolom Header tambahan khusus untuk Tab Mapel */}
              {activeTab === "mapel" && (
                <TableHead className="text-[11px] uppercase font-bold text-slate-500 hidden md:table-cell">
                  Guru Pengampu
                </TableHead>
              )}

              <TableHead className="text-right pr-6 w-[200px] text-[11px] uppercase font-bold text-slate-500">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {isLoading ? (
              <TableSkeleton />
            ) : totalItems === 0 ? (
              <TableRow>
                <TableCell colSpan={activeTab === "mapel" ? 5 : 4} className="px-6 py-20 text-center text-slate-500 hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                      <ClipboardCheck className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data ditemukan untuk kategori ini.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/*  RENDER TAB: MAPEL (SUDAH DIPERBARUI) */}
                {activeTab === "mapel" && dataMapel.map((item: any, idx: number) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100">
                    <TableCell className="pl-6 text-center text-slate-400 text-xs font-medium">{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center shrink-0">
                          <BookOpen className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{item.subject?.name || "-"}</span>
                          {/* Nama guru muncul di bawah mapel khusus tampilan HP */}
                          <span className="text-[10px] text-slate-500 font-medium md:hidden mt-0.5">
                            {item.teacher?.full_name || "-"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-bold">
                        {item.class?.name || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs font-medium hidden md:table-cell">
                      {item.teacher?.full_name || "-"}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/dashboard/results/subjects/${item.id}`}>
                        <Button variant="outline" size="sm" className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] uppercase shadow-sm opacity-90 group-hover:opacity-100 transition-all">
                          Cek Nilai <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}

                {/* RENDER TAB: WALI KELAS & RAPOR */}
                {(activeTab === "wali" || activeTab === "rapor") && dataClasses.map((cls: any, idx: number) => (
                  <TableRow key={cls.id} className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100">
                    <TableCell className="pl-6 text-center text-slate-400 text-xs font-medium">{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${activeTab === 'wali' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                          <GraduationCap className={`h-5 w-5 ${activeTab === 'wali' ? 'text-blue-600' : 'text-amber-600'}`} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">Kelas {cls.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-600 text-xs">{cls.capacity || 0} Siswa</TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={activeTab === "wali" ? `/dashboard/results/classes/${cls.id}` : `/dashboard/results/classes/${cls.id}/rapor`}>
                        <Button variant="outline" size="sm" className={`h-8 font-bold text-[10px] uppercase shadow-sm opacity-90 group-hover:opacity-100 transition-all ${activeTab === 'wali' ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                          {activeTab === "wali" ? "Buka Leger" : "Cetak Rapor"}
                          {activeTab === "wali" ? <ChevronRight className="w-3.5 h-3.5 ml-1" /> : <FolderOpen className="w-3.5 h-3.5 ml-1.5" />}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}

                {/* RENDER TAB: UJIAN */}
                {activeTab === "ujian" && dataSessions.map((session: any, idx: number) => (
                  <TableRow key={session.id} className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100">
                    <TableCell className="pl-6 text-center text-slate-400 text-xs font-medium">{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-center shrink-0">
                          <MonitorPlay className="h-5 w-5 text-rose-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm truncate max-w-[300px]">{session.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5">TOKEN: {session.token}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {session.start_time ? format(new Date(session.start_time), "dd MMM yyyy", { locale: idLocale }) : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/dashboard/results/exams/${session.id}`}>
                        <Button variant="outline" size="sm" className="h-8 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] uppercase shadow-sm opacity-90 group-hover:opacity-100 transition-all">
                          Analisis Hasil <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINASI BAWAH */}
      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> - <span className="font-bold text-slate-800">{Math.min(page * limit, totalItems)}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> data
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={limit.toString()} onValueChange={(v) => { onLimitChange(Number(v)); onPageChange(1); }}>
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
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {page} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}