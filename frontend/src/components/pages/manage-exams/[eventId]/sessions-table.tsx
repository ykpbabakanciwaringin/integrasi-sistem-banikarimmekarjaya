// LOKASI: src/components/pages/manage-exams/[eventId]/sessions-table.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Users,
  MonitorPlay,
  ChevronLeft,
  ChevronRight,
  Clock,
  KeyRound,
  PowerOff,
  PlayCircle,
  BarChart4,
  BookOpen // Tambahan ikon untuk indikator mapel
} from "lucide-react";

interface SessionsTableProps {
  eventId: string;
  sessions: any[];
  isLoading: boolean;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onEdit: (session: any) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (session: any) => void;
  role: string; 
}

export function SessionsTable({
  eventId, sessions, isLoading, page, limit, totalItems, totalPages,
  onPageChange, onLimitChange, onEdit, onDelete, onToggleStatus, role, 
}: SessionsTableProps) {
  
  // Waktu server real-time untuk penentuan status
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);

  const getSessionStatus = (session: any) => {
    if (!session.is_active) {
      return { label: "Draf / Non-Aktif", color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (now < startTime) {
      return { label: "Akan Datang", color: "bg-amber-100 text-amber-700 border-amber-200" };
    } else if (now >= startTime && now <= endTime) {
      return { label: "Sedang Berjalan", color: "bg-blue-100 text-blue-700 border-blue-200", isPulse: true };
    } else {
      return { label: "Selesai", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    }
  };

  // EFEK VISUAL: Skeleton Loader yang Identik dengan Data Siswa
  const TableSkeleton = () => (
    <>
      {[...Array(limit > 5 ? 5 : limit)].map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white">
          <TableCell className="pl-6 text-center"><div className="h-4 w-6 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell>
            <div className="flex flex-col gap-2 w-full">
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col gap-2">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-3 w-32 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="h-5 w-24 rounded-full mx-auto bg-slate-200 animate-pulse"></div>
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="flex justify-end gap-2">
              <div className="h-8 w-16 bg-slate-200 rounded-md animate-pulse"></div>
              <div className="h-8 w-16 bg-slate-200 rounded-md animate-pulse"></div>
              {role !== "TEACHER" && (
                 <>
                   <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
                   <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
                 </>
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto min-h-[430px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-[50px] pl-6 text-center text-[11px] uppercase font-bold text-slate-500">No</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Detail Sesi Ujian</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Waktu Pelaksanaan</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-500">Status</TableHead>
              <TableHead className="text-right pr-6 text-[11px] uppercase font-bold text-slate-500 min-w-[340px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {isLoading ? (
              <TableSkeleton />
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-20 text-center text-slate-500 hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                      <MonitorPlay className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium">Belum ada sesi di kegiatan ini.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session: any, idx: number) => {
                const status = getSessionStatus(session);

                return (
                  <TableRow key={session.id} className="hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="pl-6 text-center text-slate-400 text-xs font-medium">
                      {(page - 1) * limit + idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 max-w-[280px]">
                        <Link 
                          href={`/dashboard/manage-exams/${eventId}/sessions/${session.id}`}
                          className="font-bold text-sm text-slate-800 hover:text-emerald-700 transition-colors truncate"
                          title={session.title}
                        >
                          {session.title}
                        </Link>
                        
                        {/* [PENYEMPURNAAN]: Menampilkan daftar Mata Pelajaran (Multi-Mapel) */}
                        {session.subject_list && (
                          <div className="flex items-start gap-1 text-[11px] text-slate-500" title={session.subject_list}>
                            <BookOpen className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                            <span className="truncate">{session.subject_list}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 tracking-wider font-bold shadow-sm">
                            <KeyRound className="h-3 w-3" /> {session.token}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold shadow-sm">
                            <Users className="h-3 w-3" /> {session.participant_count || 0} Siswa
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-slate-600">
                        <span className="font-bold text-slate-700">
                          {format(new Date(session.start_time), "dd MMM yyyy", { locale: idLocale })}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(session.start_time), "HH:mm")} - {format(new Date(session.end_time), "HH:mm")} WIB ({session.duration_min} Menit)
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className={`${status.color} shadow-none font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 w-fit mx-auto px-2 py-0.5`}>
                        {status.isPulse && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                        {status.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                        
                        <Link href={`/dashboard/manage-exams/${eventId}/sessions/${session.id}`}>
                          <Button variant="outline" size="sm" className="h-8 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-bold px-2.5 text-[10px] uppercase shadow-sm">
                            <Users className="h-3.5 w-3.5 mr-1" /> Peserta
                          </Button>
                        </Link>
                        
                        <Link href={`/dashboard/manage-exams/${eventId}/monitor/${session.id}`}>
                          <Button variant="outline" size="sm" className="h-8 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 font-bold px-2.5 text-[10px] uppercase shadow-sm">
                            <MonitorPlay className="h-3.5 w-3.5 mr-1" /> Monitor
                          </Button>
                        </Link>

                        <Link href={`/dashboard/results/exams/${session.id}`}>
                          <Button variant="outline" size="sm" className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold px-2.5 text-[10px] uppercase shadow-sm">
                            <BarChart4 className="h-3.5 w-3.5 mr-1" /> Nilai
                          </Button>
                        </Link>

                        {role !== "TEACHER" && (
                          <>
                            <div className="h-5 w-px bg-slate-200 mx-1"></div>

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onToggleStatus(session)}
                              className={`h-8 w-8 border shadow-sm transition-all ${
                                session.is_active 
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800' 
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                              }`}
                              title={session.is_active ? "Tahan/Nonaktifkan Sesi Ini" : "Aktifkan Sesi Ini"}
                            >
                              {session.is_active ? <PowerOff className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                            </Button>

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(session)} title="Perbarui Sesi">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => onDelete(session.id)} title="Hapus Sesi">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* FOOTER PAGINASI */}
      {!isLoading && sessions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{sessions.length}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> sesi
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v))}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
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
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Sebelumnya
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {page} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              Selanjutnya <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}