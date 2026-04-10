// LOKASI: src/components/pages/classes/class-table.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Eye, UserCheck, Layers, Building2, ChevronLeft, ChevronRight, School, UserX, Users } from "lucide-react";

interface ClassTableProps {
  data: any[];
  isLoading: boolean;
  meta: { page: number; limit: number; total: number; total_pages: number };
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onOpenDetail: (item: any) => void;
  onOpenEdit: (item: any) => void;
  onOpenHomeroom: (item: any) => void;
  onDelete: (id: string) => void;
  getInstName: (item: any) => string;
}

export function ClassTable({
  data, isLoading, meta, onPageChange, onLimitChange,
  onOpenDetail, onOpenEdit, onOpenHomeroom, onDelete, getInstName
}: ClassTableProps) {
  
  const getLevelBadge = (level: string) => {
    if (!level) return <Badge variant="outline" className="text-[10px]">-</Badge>;
    const lv = level.toUpperCase();
    if (["1","2","3","4","5","6"].includes(lv)) return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Tingkat {level}</Badge>;
    if (["VII","VIII","IX"].includes(lv)) return <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px]">Tingkat {level}</Badge>;
    if (["X","XI","XII"].includes(lv)) return <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Tingkat {level}</Badge>;
    if (lv.includes("SMT")) return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{level}</Badge>;
    if (["ULA","WUSTHA","ULYA"].includes(lv)) return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">{level}</Badge>;
    return <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[10px]">Tingkat {level}</Badge>;
  };

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto min-h-[430px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px] font-bold text-slate-500 text-[11px] uppercase text-center tracking-wider">No</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Identitas Kelas</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Tingkat & Jurusan</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Lembaga & Wali</TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase text-right pr-6 tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="p-4"><Skeleton className="h-12 w-full rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((item: any, idx: number) => {
                const teacherName = item.teacher?.profile?.full_name || item.teacher?.full_name || item.teacher?.name;
                return (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="text-center font-medium text-slate-400 text-xs">
                      {(meta.page - 1) * meta.limit + idx + 1}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors" onClick={() => onOpenDetail(item)}>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                              ID: {item.id.substring(0, 8).toUpperCase()}
                            </span>
                            {/*  FITUR JUMLAH SISWA YANG SEMPAT TERLEWAT */}
                            <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100/50">
                              <Users className="h-3 w-3" /> {item.student_count || 0} Siswa
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col items-start gap-1.5">
                        {getLevelBadge(item.level)}
                        {item.major && item.major !== "TIDAK ADA JURUSAN" && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase">
                            {item.major}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold w-max">
                          <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[300px]" title={getInstName(item)}>
                            {getInstName(item)}
                          </span>
                        </div>
                        {teacherName ? (
                          <span className="text-[10px] text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded w-max">
                            <UserCheck className="h-3 w-3" /> Wali: {teacherName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-medium flex items-center gap-1 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded w-max">
                            <UserX className="h-3 w-3" /> Wali belum diatur
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50" title="Set Wali Kelas" onClick={() => onOpenHomeroom(item)}>
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-50" title="Detail Kelas" onClick={() => onOpenDetail(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" title="Edit Kelas" onClick={() => onOpenEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Hapus Kelas" onClick={() => onDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
               <TableRow>
                 <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
                     <School className="h-10 w-10 text-slate-300" />
                     <p className="text-sm font-medium">Data kelas tidak ditemukan.</p>
                   </div>
                 </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINASI & FILTER LIMIT */}
      {!isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{data.length}</span> dari <span className="font-bold text-slate-800">{meta.total}</span> data
            </span>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Baris:</span>
              <Select value={String(meta.limit)} onValueChange={(v) => onLimitChange(Number(v))}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(Math.max(1, meta.page - 1))} disabled={meta.page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {meta.page} / {meta.total_pages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(Math.min(meta.total_pages, meta.page + 1))} disabled={meta.page >= meta.total_pages}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}