// LOKASI: src/components/pages/master-academic/curriculum-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, BookOpen, BookX, Layers, Search } from "lucide-react";
import { toast } from "sonner";

import { curriculumService } from "@/services/curriculum.service";
import { institutionService } from "@/services/institution.service";
import { CurriculumFormDialog } from "./curriculum-form-dialog";
import { SubjectGroupDialog } from "./subject-group-dialog";
import { Curriculum, Institution } from "@/types/master-academic";
import { useAuthStore } from "@/stores/use-auth-store";
import { TablePagination } from "./table-pagination";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function CurriculumTab() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  // Ekstraksi ID lembaga yang aman
  const userInstId = user?.enrollments?.[0]?.institution_id || (user as unknown as { institution?: { id: string } })?.institution?.id || "";

  const [localFilterInstId, setLocalFilterInstId] = useState<string>(isSuperAdmin ? "ALL" : userInstId);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedData, setSelectedData] = useState<Partial<Curriculum>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedCurriculumForGroup, setSelectedCurriculumForGroup] = useState<Curriculum | null>(null);

  useEffect(() => { setPage(1); }, [debouncedSearch, limit, localFilterInstId]);

  const { data: instRes } = useQuery({
    queryKey: ["institutions_list_all"],
    queryFn: () => institutionService.getAllPaginated({ limit: 500 }),
    enabled: isSuperAdmin, 
    refetchOnWindowFocus: true,
  });
  const institutions: Institution[] = Array.isArray(instRes) ? instRes : (instRes?.data || []);

  //  QUERY: SERVER-SIDE PAGINATION
  const { data: responseData, isLoading, isFetching } = useQuery({
    queryKey: ["curriculums", localFilterInstId, page, limit, debouncedSearch],
    queryFn: () => curriculumService.getCurriculums({ 
      institution_id: localFilterInstId !== "ALL" ? localFilterInstId : undefined,
      page,
      limit,
      search: debouncedSearch
    }),
    refetchOnWindowFocus: true,
  });

  const paginatedData: Curriculum[] = responseData?.data || [];
  const totalItems: number = responseData?.total || 0;
  const totalPages: number = responseData?.total_pages || responseData?.totalPages || 1;

  const mutation = useMutation({
    mutationFn: async (data: Partial<Curriculum>) => {
      if (isEditMode && selectedData.id) {
        return curriculumService.updateCurriculum(selectedData.id, data);
      }
      return curriculumService.createCurriculum(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculums"] });
      setIsFormOpen(false);
      toast.success(isEditMode ? "Kurikulum diperbarui" : "Kurikulum ditambahkan");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Terjadi kesalahan"),
  });

  const deleteMutation = useMutation({
    mutationFn: curriculumService.deleteCurriculum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculums"] });
      setDeleteId(null);
      toast.success("Kurikulum berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menghapus data"),
  });

  const handleEdit = (item: Curriculum) => {
    setSelectedData(item);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedData({ 
      institution_id: localFilterInstId !== "ALL" ? localFilterInstId : "", 
      is_active: true 
    });
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleManageGroups = (item: Curriculum) => {
    setSelectedCurriculumForGroup(item);
    setGroupDialogOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" /> Daftar Kurikulum
            </h3>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 ml-0 lg:ml-4 border-l-0 lg:border-l lg:pl-4 border-slate-200">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter Lembaga:</Label>
              <Select value={localFilterInstId} onValueChange={setLocalFilterInstId}>
                <SelectTrigger className="h-9 w-64 bg-white border-slate-200 text-xs font-semibold text-emerald-700 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="font-bold">Semua Lembaga</SelectItem>
                  {institutions.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md w-full lg:w-auto" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Kurikulum
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl relative">
        {isFetching && !isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        )}

        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari nama kurikulum..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 bg-slate-50/50 focus:bg-white transition-colors border-slate-200" />
           </div>
           <div className="hidden sm:block text-[11px] text-slate-400 italic">Mendukung pencarian pintar instan dari server.</div>
        </div>

        <div className="overflow-x-auto min-h-[250px]">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow>
                <TableHead className="font-bold text-slate-500 text-xs uppercase pl-6 py-4">Nama Kurikulum</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase py-4">Status</TableHead>
                {isSuperAdmin && <TableHead className="font-bold text-slate-500 text-xs uppercase py-4">Lembaga</TableHead>}
                <TableHead className="font-bold text-slate-500 text-xs uppercase text-right py-4 pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={isSuperAdmin ? 4 : 3} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" /></TableCell></TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-bold text-slate-800 pl-6 py-3">{item.name}</TableCell>
                    <TableCell className="py-3">
                      {item.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-emerald-200">Aktif</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-none border-slate-200">Non-Aktif</Badge>
                      )}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-xs text-slate-500 font-medium py-3">
                        {(item as any).institution?.name || institutions.find((i) => i.id === item.institution_id)?.name || "-"}
                      </TableCell>
                    )}
                    <TableCell className="text-right py-3 pr-6">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-sm" onClick={() => handleManageGroups(item)}>
                          <Layers className="h-3.5 w-3.5 mr-1.5" /> Kelompok Mapel
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 4 : 3} className="h-48 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <BookX className="h-12 w-12 opacity-20 mb-2" />
                      <p className="text-sm font-medium">Data kurikulum tidak ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/*  PAGINASI ENTERPRISE */}
        {!isLoading && paginatedData.length > 0 && (
          <TablePagination
            page={page}
            limit={limit}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
      </Card>

      <CurriculumFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        isEditMode={isEditMode}
        initialData={selectedData}
        onSubmit={(data) => mutation.mutate(data)}
        isLoading={mutation.isPending}
        institutions={institutions}
        isSuperAdmin={isSuperAdmin}
      />

      <SubjectGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        curriculum={selectedCurriculumForGroup}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kurikulum?</AlertDialogTitle>
            <AlertDialogDescription>Seluruh kelompok mapel yang terkait di dalamnya akan terhapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-50 border-slate-200">Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white shadow-md" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}