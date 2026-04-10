// LOKASI: src/app/dashboard/manage-exams/manage-exams-table.tsx
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FolderOpen, Pencil, Trash2, ChevronLeft, ChevronRight, 
  Loader2, CalendarRange, ShieldAlert, DownloadCloud, Eye,
  Building2, BookOpen 
} from "lucide-react";

interface ManageExamsTableProps {
  controller: any; 
}

export function ManageExamsTable({ controller }: ManageExamsTableProps) {
  const { auth, state, modals, data, handlers } = controller;
  const { events, institutions, totalItems, totalPages, isLoading } = data;

  const getInstitutionName = (id: string) => {
    return institutions?.find((inst: any) => inst.id === id)?.name || "Semua Lembaga";
  };

  const TableSkeleton = () => (
    <>
      {[...Array(state.limit > 5 ? 5 : state.limit)].map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white border-b border-slate-100">
          <TableCell className="pl-6 text-center"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse shrink-0"></div>
              <div className="flex flex-col gap-2 w-full"><div className="h-3 w-32 bg-slate-200 rounded animate-pulse"></div><div className="h-2 w-20 bg-slate-100 rounded animate-pulse"></div></div>
            </div>
          </TableCell>
          {auth.isSuperAdmin && <TableCell><div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div></TableCell>}
          <TableCell><div className="flex flex-col gap-2"><div className="h-3 w-24 bg-slate-200 rounded animate-pulse"></div><div className="h-2 w-28 bg-slate-100 rounded animate-pulse"></div></div></TableCell>
          <TableCell><div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse mx-auto"></div></TableCell>
          <TableCell><div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse mx-auto"></div></TableCell>
          <TableCell className="text-right pr-6"><div className="flex justify-end gap-2"><div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div><div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div></div></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto min-h-[430px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
              <TableHead className="w-[60px] pl-6 text-center text-[11px] uppercase font-bold text-slate-500 tracking-wider">No</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Nama Kegiatan</TableHead>
              {auth.isSuperAdmin && <TableHead className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Lembaga</TableHead>}
              <TableHead className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Jadwal Pelaksanaan</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500 text-center tracking-wider">Keamanan</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500 text-center tracking-wider">Status</TableHead>
              <TableHead className="text-right pr-6 w-[160px] text-[11px] uppercase font-bold text-slate-500 tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {isLoading ? (
              <TableSkeleton />
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={auth.isSuperAdmin ? 7 : 6} className="h-48 text-center text-slate-500 hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shadow-inner">
                      <FolderOpen className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Belum ada kegiatan ujian</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event: any, index: number) => (
                <TableRow key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                  <TableCell className="pl-6 text-center text-slate-400 text-xs font-medium">
                    {(state.page - 1) * state.limit + index + 1}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarRange className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm line-clamp-1">{event.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{event.description || "Tidak ada deskripsi"}</p>
                        
                        {/* [PERBAIKAN] Menampilkan Badge Room dan Subject secara berdampingan */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium text-[10px] h-5 shadow-none">
                            <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                            {event.room_count || 1} Ruangan
                          </Badge>
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium text-[10px] h-5 shadow-none">
                            <BookOpen className="w-3 h-3 mr-1 text-slate-400" />
                            {event.subject_count || 1} Maks Mapel
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {auth.isSuperAdmin && (
                    <TableCell>
                      <p className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block truncate">
                        {getInstitutionName(event.institution_id)}
                      </p>
                    </TableCell>
                  )}

                  <TableCell>
                    <div className="text-[11px] font-medium text-slate-600 space-y-0.5">
                      <p>Mulai: <span className="text-slate-900 font-semibold">{format(new Date(event.start_date), "dd MMM yyyy, HH:mm", { locale: idLocale })}</span></p>
                      <p>Selesai: <span className="text-slate-900 font-semibold">{format(new Date(event.end_date), "dd MMM yyyy, HH:mm", { locale: idLocale })}</span></p>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    {event.is_seb_required ? (
                      <Badge variant="default" className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0 flex items-center justify-center px-2 py-0.5 shadow-none mx-auto w-fit font-bold gap-1 text-[10px]">
                        <ShieldAlert className="w-3 h-3" /> Wajib SEB
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 flex items-center justify-center px-2 py-0.5 shadow-none mx-auto w-fit font-bold text-[10px]">
                        Tidak Wajib
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge className={event.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 flex items-center justify-center px-2 py-0.5 shadow-none mx-auto w-fit font-bold gap-1 text-[10px]" : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 flex items-center justify-center px-2 py-0.5 shadow-none mx-auto w-fit font-bold text-[10px]"}>
                      {event.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />} 
                      {event.is_active ? "Aktif" : "Draft"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/manage-exams/${event.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Lihat Sesi Ujian">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {auth.userRole !== "TEACHER" && (
                        <>
                          {event.is_seb_required && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Unduh File SEB (.seb)" onClick={() => handlers.handleDownloadSEB(event.id)} disabled={modals.downloadingSEBId === event.id}>
                              {modals.downloadingSEBId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handlers.handleEditClick(event)} title="Edit Kegiatan">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handlers.handleDeleteClick(event.id)} title="Hapus Kegiatan">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && events.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{events.length}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> data
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={state.limit.toString()} onValueChange={(val) => { state.setLimit(Number(val)); state.setPage(1); }}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => state.setPage((p: number) => p - 1)} disabled={state.page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {state.page} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => state.setPage((p: number) => p + 1)} disabled={state.page >= totalPages}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}