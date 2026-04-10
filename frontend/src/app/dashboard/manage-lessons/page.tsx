// LOKASI: src/app/dashboard/manage-lessons/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LibrarySquare,
  CalendarClock,
  Building2,
  Plus,
  Trash2,
  Loader2,
  UserCheck,
  LayoutGrid,
  Clock,
  Server
} from "lucide-react";
import { toast } from "sonner";

// Services
import { scheduleService } from "@/services/schedule.service";
import { institutionService } from "@/services/institution.service";
import { academicYearService } from "@/services/academic-year.service";
import { classService } from "@/services/class.service";
import { useAuthStore } from "@/stores/use-auth-store";

// UI Components
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, MoreHorizontal } from "lucide-react";
import { subjectService } from "@/services/subject.service";
import { AssignmentImportDialog } from "@/components/pages/manage-lessons/assignment-import-dialog";

// Import Komponen Custom
import { AllocationFormDialog } from "@/components/pages/manage-lessons/allocation-form-dialog";
import { InteractiveScheduleGrid } from "@/components/pages/manage-lessons/interactive-schedule-grid";
import { MasterScheduleView } from "@/components/pages/manage-lessons/master-schedule-view";
import { SessionManagerDialog } from "@/components/pages/manage-lessons/session-manager-dialog";

export function extractArray(res: any) {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

function ManageLessonsContent() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userInstId = user?.institution_id || "";

  // === URL STATE MANAGEMENT ===
  const activeTab = searchParams.get("tab") || "schedules";
  const filterInstId = searchParams.get("instId") || (isSuperAdmin ? "" : userInstId);
  const filterClassId = searchParams.get("classId") || "";

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // FUNGSI EKSPOR BARU
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await subjectService.exportAssignmentsExcel({ 
        institution_id: filterInstId, 
        class_id: filterClassId 
      });
      toast.success("File Excel berhasil diunduh");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await subjectService.exportAssignmentsPDF({ 
        institution_id: filterInstId, 
        class_id: filterClassId 
      });
      toast.success("File PDF berhasil diunduh");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh PDF");
    } finally {
      setIsExporting(false);
    }
  };
  
  const [filterAyId, setFilterAyId] = useState("");

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // === DIALOG STATES ===
  const [allocFormOpen, setAllocFormOpen] = useState(false);
  const [deleteAllocId, setDeleteAllocId] = useState<string | null>(null);
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);

  // === QUERIES ===
  const { data: institutionsRes = [] } = useQuery({
    queryKey: ["institutions_list"],
    queryFn: () => institutionService.getAllPaginated({ limit: 1000 }),
    enabled: isMounted, 
  });
  const institutions = extractArray(institutionsRes);

  const selectedInstitution = institutions.find((inst: any) => inst.id === filterInstId);
  const isPqActive = selectedInstitution?.is_pq_integration_enabled === true;

  const { data: activeAy } = useQuery({
    queryKey: ["academic_years_active", filterInstId],
    queryFn: () => academicYearService.getActive(filterInstId),
    enabled: isMounted && !!filterInstId,
  });

  useEffect(() => {
    if (activeAy?.id) setFilterAyId(activeAy.id);
  }, [activeAy]);

  const { data: classesRes = [] } = useQuery({
    queryKey: ["classes_list", filterInstId],
    queryFn: () => classService.getAll({ institution_id: filterInstId, limit: 1000 }),
    enabled: isMounted && (activeTab === "schedules" || activeTab === "master") && !!filterInstId,
  });
  const classesList = extractArray(classesRes);

  const { data: allocations = [], isLoading: isLoadingAllocations } = useQuery({
    queryKey: ["allocations", filterInstId, filterAyId, filterClassId],
    queryFn: () => scheduleService.getAllocations({
      institution_id: filterInstId,
      academic_year_id: filterAyId,
      class_id: filterClassId
    }),
    enabled: isMounted && activeTab === "schedules" && !!filterInstId && !!filterAyId && !!filterClassId,
  });

  const { data: masterSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["class_sessions", filterInstId],
    queryFn: () => scheduleService.getSessions(filterInstId),
    enabled: isMounted && activeTab === "sessions" && !!filterInstId,
  });

  // === MUTATIONS ===
  const deleteAllocMutation = useMutation({
    mutationFn: scheduleService.deleteAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations", filterInstId, filterAyId, filterClassId] });
      queryClient.invalidateQueries({ queryKey: ["allocations_master", filterInstId, filterAyId] });
      toast.success("Penugasan guru dicabut");
      setDeleteAllocId(null);
    },
    onError: (err: any) => toast.error(err.message || "Gagal mencabut penugasan"),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: scheduleService.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_sessions", filterInstId] });
      toast.success("Sesi KBM berhasil dihapus!");
    },
    onError: (err: any) => toast.error(err.message || "Gagal menghapus sesi"),
  });

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* === HEADER === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <LibrarySquare className="h-6 w-6 text-emerald-600" /> Manajemen Pelajaran & Jadwal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Transaksi plotting Guru pengampu, penentuan waktu sesi, dan jadwal kelas interaktif.
          </p>
        </div>
      </div>

      {/* === FILTER LEMBAGA (SUPER ADMIN) === */}
      {isSuperAdmin && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <Label className="text-sm font-bold text-slate-600 shrink-0 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Pilih Lembaga:
            </Label>
            <Select 
              value={filterInstId || "ALL"} 
              onValueChange={(v) => { 
                updateURL({ instId: v === "ALL" ? "" : v, classId: "" }); 
              }}
            >
              <SelectTrigger className="w-[300px] bg-slate-50">
                <SelectValue placeholder="Pilih Lembaga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Lembaga (Global)</SelectItem>
                {institutions.map((inst: any) => (
                  <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* === TABS NAVIGATION === */}
      <Tabs value={activeTab} onValueChange={(val) => updateURL({ tab: val })} className="space-y-4">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto shadow-sm rounded-lg flex-wrap">
          <TabsTrigger value="schedules" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-6 py-2.5 rounded-md font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Alokasi & Jadwal Kelas
          </TabsTrigger>
          
          <TabsTrigger value="sessions" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-6 py-2.5 rounded-md font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" /> Atur Sesi KBM
          </TabsTrigger>

          <TabsTrigger value="master" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-6 py-2.5 rounded-md font-semibold flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" /> Master Jadwal Global
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: ALOKASI & JADWAL KELAS --- */}
        <TabsContent value="schedules" className="space-y-4 m-0">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 flex flex-wrap gap-4 items-end bg-emerald-50/30 rounded-xl">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label className="text-xs font-bold text-slate-500 uppercase">Tahun Ajaran Aktif</Label>
                <div className="h-10 px-3 bg-white border border-slate-200 rounded-md flex items-center text-sm font-bold text-emerald-700 cursor-not-allowed opacity-80">
                  {activeAy ? `${activeAy.name} - ${activeAy.semester}` : "Belum ada TA Aktif"}
                </div>
              </div>
              <div className="space-y-2 flex-1 min-w-[250px]">
                <Label className="text-xs font-bold text-slate-500 uppercase">Pilih Kelas</Label>
                <Select value={filterClassId} onValueChange={(v) => updateURL({ classId: v })} disabled={!filterInstId || classesList.length === 0}>
                  <SelectTrigger className="bg-white h-10 border-slate-300">
                    <SelectValue placeholder="Pilih kelas untuk diatur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classesList.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {!filterClassId ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[400px] text-center">
              <div className="h-20 w-20 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-full mb-6 shadow-inner">
                <CalendarClock className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Jadwal KBM</h2>
              <p className="text-slate-500 mt-2 max-w-lg mb-8">
                Silakan pilih <b>Kelas</b> pada filter di atas untuk melihat dan mengatur jadwal. 
                <span> Pastikan Anda sudah melakukan pengaturan jam di tab <b>Atur Sesi KBM</b>.</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* KOLOM KIRI: DAFTAR GURU PENGAMPU */}
              <div className="xl:col-span-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-600" /> Guru Pengampu
                  </h3>
                  
                  {/* BUNGKUSAN TOMBOL DAN MENU BARU */}
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs px-2" onClick={() => setAllocFormOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Tugaskan
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 px-2" disabled={!filterInstId || isExporting}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-white">
                        <DropdownMenuItem onClick={() => setIsImportOpen(true)} className="cursor-pointer py-2">
                          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                          <span className="font-medium text-slate-700">Import / Upload Batch</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportExcel} disabled={!filterClassId} className="cursor-pointer py-2">
                          <Download className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="font-medium text-slate-700">Export Excel (Daftar)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPDF} disabled={!filterClassId} className="cursor-pointer py-2">
                          <FileText className="w-4 h-4 mr-2 text-rose-600" />
                          <span className="font-medium text-slate-700">Export PDF (Kop Surat)</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 h-[600px] overflow-y-auto space-y-3 shadow-inner">
                  {isLoadingAllocations ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
                  ) : extractArray(allocations).length > 0 ? (
                    extractArray(allocations).map((alloc: any) => (
                      <div key={alloc.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group hover:border-emerald-300 transition-colors">
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setDeleteAllocId(alloc.id)} className="text-rose-400 hover:text-rose-600 p-1 bg-rose-50 rounded-md">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                         </div>
                         <Badge variant="outline" className="mb-2 bg-slate-50 text-[10px] uppercase text-slate-500 border-slate-200">
                           {alloc.subject?.code}
                         </Badge>
                         <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{alloc.subject?.name}</h4>
                         <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                           <UserCheck className="h-3 w-3" /> {alloc.teacher?.profile?.full_name || alloc.teacher?.full_name || alloc.teacher?.name || "Guru"}
                         </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-xs text-slate-400 italic">
                      Belum ada guru yang ditugaskan ke kelas ini.
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: GRID JADWAL INTERAKTIF */}
              <div className="xl:col-span-3">
                <InteractiveScheduleGrid
                  allocations={extractArray(allocations)}
                  institutionId={filterInstId}
                  academicYearId={filterAyId}
                  classId={filterClassId}
                  isPqActive={isPqActive} 
                />
              </div>

            </div>
          )}
        </TabsContent>

        {/* TAB 2: ATUR SESI KBM (DENGAN TABEL PENUH) */}
        <TabsContent value="sessions" className="space-y-4 m-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-slate-800 tracking-tight">Daftar Sesi KBM</h3>
              <p className="text-xs text-slate-500">Atur master jam pelajaran baku untuk digunakan pada jadwal.</p>
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              onClick={() => {
                if (!filterInstId) toast.error("Silakan pilih lembaga terlebih dahulu!");
                else setSessionManagerOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Tambah Sesi
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase">Nama Sesi</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase text-center">Jam Mulai</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase text-center">Jam Selesai</TableHead>
                  
                  {/* UX: Header ID PesantrenQu disembunyikan jika mati */}
                  {isPqActive && (
                    <TableHead className="font-bold text-slate-500 text-xs uppercase text-center">ID PesantrenQu</TableHead>
                  )}
                  
                  <TableHead className="font-bold text-slate-500 text-xs uppercase text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSessions ? (
                  <TableRow><TableCell colSpan={isPqActive ? 5 : 4} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" /></TableCell></TableRow>
                ) : masterSessions.length > 0 ? (
                  masterSessions.map((session: any) => (
                    <TableRow key={session.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-bold text-slate-700">{session.name}</TableCell>
                      <TableCell className="text-center font-mono text-sm text-emerald-600 font-bold">{session.start_time}</TableCell>
                      <TableCell className="text-center font-mono text-sm text-rose-500 font-bold">{session.end_time}</TableCell>
                      
                      {/* UX: Kolom ID PesantrenQu disembunyikan jika mati */}
                      {isPqActive && (
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 shadow-none font-mono">
                            <Server className="w-3 h-3 mr-1.5" /> {session.pesantrenqu_event_id || "-"}
                          </Badge>
                        </TableCell>
                      )}
                      
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50" onClick={() => deleteSessionMutation.mutate(session.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isPqActive ? 5 : 4} className="text-center h-32 text-slate-400">
                      Belum ada sesi KBM. Silakan klik tombol <strong className="text-slate-500">Tambah Sesi</strong> di kanan atas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* --- TAB 3: MASTER MATRIKS --- */}
        <TabsContent value="master" className="space-y-4 m-0">
          <MasterScheduleView
            institutionId={filterInstId}
            academicYearId={filterAyId}
          />
        </TabsContent>
      </Tabs>

      {/* === DIALOGS & MODALS === */}
      
      {/* 1. Modal Form Alokasi Guru */}
      {allocFormOpen && (
        <AllocationFormDialog
          open={allocFormOpen}
          onOpenChange={setAllocFormOpen}
          institutionId={filterInstId}
          academicYearId={filterAyId}
          classId={filterClassId}
        />
      )}

      {/* 2. Alert Hapus Alokasi */}
      <AlertDialog open={!!deleteAllocId} onOpenChange={(v) => !v && setDeleteAllocId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Cabut Penugasan Guru?</AlertDialogTitle>
            <AlertDialogDescription>Semua jadwal hari & jam mengajar guru ini di kelas tersebut akan ikut terhapus secara permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => deleteAllocId && deleteAllocMutation.mutate(deleteAllocId)}>
              Ya, Cabut Penugasan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 3. Modal Session Manager */}
      {sessionManagerOpen && (
        <SessionManagerDialog
          open={sessionManagerOpen}
          onOpenChange={setSessionManagerOpen}
          institutionId={filterInstId}
          isPqActive={isPqActive}
        />
      )}

      {/* 4. Modal Import Penugasan */}
      {isImportOpen && (
        <AssignmentImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          institutionId={filterInstId}
        />
      )}

    </div>
  );
}

// === KOMPONEN UTAMA (Dibungkus dengan Suspense) ===
export default function ManageLessonsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 font-medium">Memuat halaman jadwal...</p>
      </div>
    }>
      <ManageLessonsContent />
    </Suspense>
  );
}