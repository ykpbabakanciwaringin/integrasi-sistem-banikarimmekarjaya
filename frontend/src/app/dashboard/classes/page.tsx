// LOKASI: src/app/dashboard/classes/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classService } from "@/services/class.service";
import { institutionService } from "@/services/institution.service";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";

// UI Wrappers & Modals
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileSpreadsheet, Download, UploadCloud, CheckCircle2, Loader2, Building2 } from "lucide-react";

// Modals Components
import { ClassFormDialog } from "@/components/pages/classes/class-form-dialog";
import { ClassDetailDialog } from "@/components/pages/classes/class-detail-dialog";
import { ClassHomeroomDialog } from "@/components/pages/classes/class-homeroom-dialog";

// Custom Refactored Components
import { ClassHeader } from "@/components/pages/classes/class-header";
import { ClassFilters } from "@/components/pages/classes/class-filters";
import { ClassTable } from "@/components/pages/classes/class-table";

const defaultForm = { name: "", level: "", institution_id: "", major: "" };

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userInstId = user?.institution_id || "";

  // --- STATE FILTER SERVER-SIDE ---
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
    institution_id: "ALL",
    level: "ALL",
    major: "ALL"
  });
  const [searchInput, setSearchInput] = useState("");

  // --- STATE MODALS & ACTIONS ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHomeroomOpen, setIsHomeroomOpen] = useState(false);

  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importInstId, setImportInstId] = useState(isSuperAdmin ? "" : userInstId);

  useEffect(() => { setIsMounted(true); }, []);

  // Debounce Pencarian
  useEffect(() => {
    const timer = setTimeout(() => setFilter((prev) => ({ ...prev, search: searchInput, page: 1 })), 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- QUERIES ---
  const { data: result, isLoading } = useQuery({
    queryKey: ["classes", filter],
    queryFn: () => classService.getAll({
      page: filter.page,
      limit: filter.limit,
      search: filter.search,
      institution_id: isSuperAdmin ? (filter.institution_id === "ALL" ? undefined : filter.institution_id) : userInstId,
      level: filter.level === "ALL" ? undefined : filter.level,
      major: filter.major === "ALL" ? undefined : filter.major,
    }),
    refetchInterval: 15000,
  });

  const { data: institutionsRes = [] } = useQuery({
    queryKey: ["institutions_list"],
    queryFn: () => institutionService.getAllPaginated({ limit: 100 }),
    enabled: isSuperAdmin && isMounted,
  });
  const institutions = Array.isArray(institutionsRes) ? institutionsRes : institutionsRes?.data || [];

  const paginatedData = result?.data || [];
  const meta = {
    page: filter.page,
    limit: filter.limit,
    total: result?.total || 0,
    total_pages: result?.total_pages || 1,
  };

  const getInstName = (item: any) => {
    if (item?.institution?.name) return item.institution.name;
    const found = institutions.find((i: any) => i.id === item?.institution_id);
    return found ? found.name : "-";
  };

  // --- MUTATIONS ---
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      if (!isSuperAdmin) payload.institution_id = userInstId;
      if (isEditMode && selectedClass) return classService.update(selectedClass.id, payload);
      return classService.create(payload);
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success(isEditMode ? "Data kelas diperbarui" : "Kelas berhasil dibuat");
      handleCloseForm();
    },
    onError: (err: any) => toast.error(`Gagal: ${err.message}`),
  });

  const homeroomMutation = useMutation({
    mutationFn: async ({ classId, teacherId }: { classId: string; teacherId: string }) => 
      classService.assignHomeroom(classId, teacherId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsHomeroomOpen(false);
      toast.success("Wali kelas berhasil ditetapkan");
    },
    onError: (err: any) => toast.error(err.message || "Gagal menetapkan wali kelas"),
  });

  const deleteMutation = useMutation({
    mutationFn: classService.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      setDeleteId(null);
      toast.success("Kelas berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.message || "Gagal menghapus data"),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const target = isSuperAdmin ? importInstId : userInstId;
      if (isSuperAdmin && !target) throw new Error("Pilih lembaga tujuan import.");
      return classService.importClasses(file, target);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsImportOpen(false);
      setImportFile(null);
      toast.success(`Import Berhasil!`);
    },
    onError: (err: any) => toast.error(err.message || "Gagal import data"),
  });

  // --- HANDLERS ---
  const handleEdit = (item: any) => {
    setFormData({ name: item.name, level: item.level || "", major: item.major || "", institution_id: item.institution_id || "" });
    setSelectedClass(item); setIsEditMode(true); setIsFormOpen(true);
  };

  const handleCreate = () => {
    setFormData({ ...defaultForm, institution_id: isSuperAdmin ? (filter.institution_id !== "ALL" ? filter.institution_id : "") : userInstId });
    setSelectedClass(null); setIsEditMode(false); setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setTimeout(() => { setFormData(defaultForm); setIsEditMode(false); setSelectedClass(null); }, 300);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <ClassHeader onOpenImport={() => { setImportFile(null); if (isSuperAdmin) setImportInstId(""); setIsImportOpen(true); }} onOpenCreate={handleCreate} />

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
        <ClassFilters searchInput={searchInput} setSearchInput={setSearchInput} filter={filter} setFilter={setFilter} institutions={institutions} isSuperAdmin={isSuperAdmin} />
        <CardContent className="p-0">
          <ClassTable data={paginatedData} isLoading={isLoading} meta={meta} onPageChange={(p) => setFilter({ ...filter, page: p })} onLimitChange={(l) => setFilter({ ...filter, limit: l, page: 1 })} onOpenDetail={(item) => { setSelectedClass(item); setIsDetailOpen(true); }} onOpenEdit={handleEdit} onOpenHomeroom={(item) => { setSelectedClass(item); setIsHomeroomOpen(true); }} onDelete={(id) => setDeleteId(id)} getInstName={getInstName} />
        </CardContent>
      </Card>

      {/* --- MODALS --- */}
      <ClassFormDialog open={isFormOpen} onOpenChange={(v) => !v ? handleCloseForm() : setIsFormOpen(v)} isEditMode={isEditMode} initialData={formData} onSubmit={(data) => mutation.mutate(data)} isLoading={mutation.isPending} institutions={institutions} isSuperAdmin={isSuperAdmin} />
      <ClassHomeroomDialog open={isHomeroomOpen} onOpenChange={setIsHomeroomOpen} classItem={selectedClass} onSubmit={(classId, teacherId) => homeroomMutation.mutate({ classId, teacherId })} isLoading={homeroomMutation.isPending} />
      <ClassDetailDialog open={isDetailOpen} onOpenChange={setIsDetailOpen} classItem={selectedClass} getInstName={getInstName} />

      {/* MODAL IMPORT DENGAN DESAIN PREMIUM */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
          <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-left space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white">Import Data Kelas</DialogTitle>
                <DialogDescription className="text-emerald-100/80 text-xs">
                  Upload data massal menggunakan template Excel standar sistem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 bg-slate-50/50">
             {isSuperAdmin && (
              <div className="mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Building2 className="h-3.5 w-3.5" /> Lembaga Tujuan
                </Label>
                <Select value={importInstId} onValueChange={setImportInstId}>
                  <SelectTrigger className="bg-slate-50 h-10 focus:ring-emerald-500"><SelectValue placeholder="Pilih Lembaga..." /></SelectTrigger>
                  <SelectContent>{institutions.map((inst: any) => (<SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors group flex flex-col justify-between h-full">
                <div>
                  <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                    <Download className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">1. Download Template</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Unduh file Excel standar sistem.</p>
                </div>
                <Button variant="outline" className="w-full mt-4 bg-slate-50 hover:bg-white hover:text-indigo-600 border-slate-200 transition-colors" onClick={() => classService.downloadTemplate()}>
                  Unduh .xlsx
                </Button>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors group flex flex-col justify-between h-full">
                <div>
                  <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-100 group-hover:scale-110 transition-all">
                    <UploadCloud className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">2. Upload File</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Pilih file Excel yang sudah diisi.</p>
                </div>
                <div
                  onClick={() => { if (isSuperAdmin && !importInstId) return toast.warning("Pilih lembaga terlebih dahulu!"); !importMutation.isPending && fileInputRef.current?.click(); }}
                  className={`mt-4 border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${importFile ? "border-emerald-500 bg-emerald-50 shadow-inner" : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50"}`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={(e) => { if (e.target.files?.[0]) setImportFile(e.target.files[0]); }} />
                  {importFile ? (
                    <div className="flex flex-col items-center justify-center gap-1 text-emerald-700 font-bold text-xs animate-in zoom-in-95">
                      <CheckCircle2 className="h-5 w-5 mb-1" /> <span className="truncate w-full px-2">{importFile.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium flex items-center justify-center h-full">Klik cari file...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
            <Button variant="ghost" onClick={() => setIsImportOpen(false)} className="text-slate-500">Batal</Button>
            <Button className="bg-[#047857] hover:bg-[#065f46] text-white shadow-md transition-all active:scale-95" onClick={() => importFile && importMutation.mutate(importFile)} disabled={importMutation.isPending || !importFile || (isSuperAdmin && !importInstId)}>
              {importMutation.isPending ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Memproses...</> : "Proses Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL HAPUS */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent aria-describedby={undefined} className="bg-white rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Hapus Kelas?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Data akan dihapus permanen. Siswa dalam kelas ini akan kehilangan status kelas dan riwayat jurnal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 hover:bg-slate-50 text-slate-600">Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white shadow-md" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}