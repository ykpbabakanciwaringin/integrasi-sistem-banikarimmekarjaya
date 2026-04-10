// LOKASI: src/components/pages/master-academic/holiday-table.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, Pencil, Trash2, CalendarOff, Globe, School } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { curriculumService } from "@/services/curriculum.service";
import { TablePagination } from "./table-pagination";
import { Holiday, Institution } from "@/types/master-academic";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface HolidayTableProps {
  isSuperAdmin: boolean;
  userInstId: string;
  localFilterInstId: string;
  selectedMonth: string;
  institutions: Institution[];
  onEdit: (item: Holiday) => void;
}

export function HolidayTable({ isSuperAdmin, userInstId, localFilterInstId, selectedMonth, institutions, onEdit }: HolidayTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  //  QUERY TABLE: Ditambah refetchInterval untuk update real-time
  const { data: responseData, isLoading, isFetching } = useQuery({
    queryKey: ["holidays", localFilterInstId, selectedMonth, page, limit, debouncedSearch, userInstId],
    queryFn: () => curriculumService.getHolidays({ 
      institution_id: localFilterInstId !== "ALL" ? localFilterInstId : undefined, 
      month: selectedMonth, page, limit, search: debouncedSearch
    }),
    refetchOnWindowFocus: true,
    refetchInterval: 5000, //  Mengembalikan polling otomatis tiap 5 detik
  });

  const paginatedHolidays: Holiday[] = responseData?.data || [];
  const totalItems: number = responseData?.total || 0;
  const totalPages: number = responseData?.total_pages || responseData?.totalPages || 1;

  useEffect(() => { setPage(1); }, [debouncedSearch, selectedMonth, limit, localFilterInstId]);

  const deleteMutation = useMutation({
    mutationFn: curriculumService.deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setDeleteId(null);
      toast.success("Jadwal libur dihapus");
    },
  });

  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="pl-6 py-4"><Skeleton className="h-5 w-32 rounded-md" /></TableCell>
          <TableCell className="py-4"><Skeleton className="h-5 w-48 rounded-md" /></TableCell>
          <TableCell className="py-4"><Skeleton className="h-6 w-36 rounded-full" /></TableCell>
          <TableCell className="text-right py-4 pr-6">
            <div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <>
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-2xl relative">
        {isFetching && !isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden"><div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div></div>
        )}

        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari keterangan libur insidental..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 bg-white transition-colors border-slate-200 shadow-sm focus-visible:ring-emerald-500 rounded-xl" />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow>
                <TableHead className="font-bold text-slate-500 text-xs uppercase pl-6 py-4">Tanggal Libur</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase py-4">Keterangan / Acara</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase py-4">Cakupan Libur</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase text-right py-4 pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : paginatedHolidays.length > 0 ? (
                paginatedHolidays.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-bold text-rose-600 pl-6 py-3 whitespace-nowrap">
                      {dayjs(item.date).locale("id").format("DD MMMM YYYY")}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 py-3">{item.name}</TableCell>
                    <TableCell className="py-3">
                      {item.is_global ? (
                        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold px-2.5 py-1 rounded-md shadow-sm"><Globe className="h-3 w-3 mr-1.5" /> Global (Semua Lembaga)</Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2.5 py-1 max-w-[250px] truncate rounded-md shadow-sm block w-fit">
                          <School className="h-3 w-3 mr-1.5 inline-block" /> {institutions.find((i)=>i.id === item.institution_id)?.name || "Lembaga Spesifik"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3 pr-6">
                      {(!item.is_global || isSuperAdmin) ? (
                        <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ) : <span className="text-[10px] text-slate-400 italic font-medium bg-slate-100 px-2 py-1 rounded-md border border-slate-200">Akses Terbatas</span>}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-48 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center"><CalendarOff className="h-12 w-12 opacity-20 mb-3" />Tidak ada data libur.</div>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && paginatedHolidays.length > 0 && (
          <TablePagination page={page} limit={limit} totalItems={totalItems} totalPages={totalPages} onPageChange={setPage} onLimitChange={setLimit} />
        )}
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold flex items-center gap-2 text-rose-600"><Trash2 className="h-5 w-5" /> Hapus Jadwal Libur?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini bersifat permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-50 border-slate-200 font-semibold text-slate-600 rounded-xl hover:bg-slate-100">Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white shadow-md font-bold rounded-xl" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}