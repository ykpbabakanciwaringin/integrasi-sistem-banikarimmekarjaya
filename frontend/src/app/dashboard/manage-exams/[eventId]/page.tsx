// LOKASI: src/app/dashboard/manage-exams/[eventId]/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

// --- CONTROLLER ---
import { useExamSessionController } from "@/components/pages/manage-exams/[eventId]/useExamSessionController";

// --- KOMPONEN UI ---
import { EventDetailHeader } from "@/components/pages/manage-exams/[eventId]/event-detail-header";
import { SessionsFilters } from "@/components/pages/manage-exams/[eventId]/sessions-filters";
import { SessionsTable } from "@/components/pages/manage-exams/[eventId]/sessions-table";
import { ExamFormDialog } from "@/components/pages/manage-exams/[eventId]/exam-form-dialog";
import { ExamSessionImportDialog } from "@/components/pages/manage-exams/[eventId]/exam-session-import-dialog";
import { ExamCardPrint } from "@/components/pages/manage-exams/[eventId]/exam-card-print";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertTriangle, Loader2, Printer, RefreshCcw, Users } from "lucide-react";

export default function EventDetailPage() {
  const router = useRouter();
  
  const {
    isMounted,
    auth,
    state,
    modals,
    data,
    mutations,
    handlers,
    print, 
  } = useExamSessionController();

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* HEADER HALAMAN */}
      <EventDetailHeader
        eventDetail={data.eventDetail}
        isLoading={data.isLoadingEvent}
        onBack={() => router.push("/dashboard/manage-exams")}
        onAddClick={handlers.handleAddClick} 
        role={auth.role}
        onImportClick={() => modals.setIsImportOpen(true)} 
        onExportData={handlers.handleExportData} 
      />

      <Tabs value={state.mainTab} onValueChange={state.setMainTab} className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white border border-slate-200 shadow-sm p-1 rounded-xl h-12">
            <TabsTrigger value="sessions" className="rounded-lg data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-bold px-6 h-9 transition-all">
              Jadwal & Sesi
            </TabsTrigger>
            <TabsTrigger value="participants" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 font-bold px-6 h-9 transition-all">
              Peserta & Kartu Ujian
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: JADWAL & SESI */}
        <TabsContent value="sessions" className="space-y-6 outline-none animate-in fade-in duration-500">
          <Card className="border-0 shadow-[0_2px_20px_rgba(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden relative transition-all duration-300">
            {data.isLoadingSessions && data.sessions.length > 0 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden">
                <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
            )}

            <SessionsFilters
              activeTab={state.activeTab}
              onTabChange={state.setActiveTab}
              search={state.search}
              onSearchChange={state.setSearch}
              filterSubject={state.filterSubject}
              onFilterSubjectChange={state.setFilterSubject}
              subjects={data.subjects}
            />

            <CardContent className="p-0">
              <SessionsTable
                eventId={data.eventId}
                sessions={data.sessions}
                isLoading={data.isLoadingSessions}
                page={state.page}
                limit={state.limit}
                totalItems={data.totalItems}
                totalPages={data.totalPages}
                onPageChange={state.setPage}
                onLimitChange={state.setLimit}
                onEdit={handlers.handleEditClick} 
                onDelete={modals.setDeleteId} 
                onToggleStatus={(session) => mutations.toggleStatusMutation.mutate(session)} 
                role={auth.role}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PESERTA & KARTU UJIAN */}
        <TabsContent value="participants" className="space-y-6 outline-none animate-in fade-in duration-500">
          <Card className="border-0 shadow-[0_2px_20px_rgba(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Rekap Peserta Kegiatan</h3>
                <p className="text-xs text-slate-500 mt-1">Data di bawah adalah peserta unik (tanpa duplikasi) yang ditarik dari seluruh sesi di kegiatan ini.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => data.refetchParticipants()} className="bg-white hover:bg-slate-50 text-slate-600 h-9">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md h-9 transition-all active:scale-95" 
                      disabled={data.isLoadingParticipants || print.isPrinting || data.eventParticipants.length === 0}
                    >
                      {print.isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                      {print.isPrinting ? "Mencetak..." : "Cetak Semua Kartu"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl p-1">
                    <DropdownMenuItem onClick={() => handlers.handlePrintCards("a4")} className="cursor-pointer font-bold text-slate-700 focus:bg-indigo-50 focus:text-indigo-700 rounded-lg py-2.5">
                      Cetak Format A4 (PDF)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlers.handlePrintCards("single")} className="cursor-pointer font-bold text-slate-700 focus:bg-indigo-50 focus:text-indigo-700 rounded-lg py-2.5">
                      Cetak Satuan (ZIP)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-[60px] text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">No</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Peserta</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Username & Password</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nomor Ujian</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kelas / Ruangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.isLoadingParticipants ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-16"><Loader2 className="animate-spin mx-auto h-6 w-6 text-slate-400 mb-2" /><p className="text-xs text-slate-500">Memuat data peserta...</p></TableCell></TableRow>
                  ) : data.eventParticipants.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-16 text-slate-500"><div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-6 h-6 text-slate-400" /></div><p className="font-medium text-sm text-slate-600">Belum ada peserta</p><p className="text-xs mt-1">Silakan tambahkan atau unggah peserta ke dalam sesi ujian terlebih dahulu.</p></TableCell></TableRow>
                  ) : (
                    data.eventParticipants.map((p: any, idx: number) => (
                        <TableRow key={p.student_id || idx} className="hover:bg-slate-50/50">
                          <TableCell className="text-center text-xs text-slate-500 font-medium">{idx + 1}</TableCell>
                          <TableCell>
                              <div className="font-bold text-slate-800 text-sm">{p.student_name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">NISN: <span className="font-medium text-slate-600">{p.student_nisn}</span></div>
                          </TableCell>
                          <TableCell>
                              <div className="flex flex-col gap-1.5 items-start">
                                <Badge variant="outline" className="bg-slate-50 font-mono text-[11px] text-slate-700 px-2 py-0.5 border-slate-200">
                                  U: {p.student_username}
                                </Badge>
                                <Badge variant="outline" className="bg-slate-50 font-mono text-[11px] text-slate-700 px-2 py-0.5 border-slate-200">
                                  P: {p.student_password}
                                </Badge>
                              </div>
                          </TableCell>
                          <TableCell><Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0 font-bold">{p.exam_number}</Badge></TableCell>
                          <TableCell className="text-xs font-semibold text-slate-600">{p.class_name || "Umum"}</TableCell>
                        </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      <ExamFormDialog
        open={modals.isFormOpen}
        onOpenChange={handlers.handleCloseForm}
        isEditMode={modals.isEditMode}
        initialData={modals.selectedSession}
        eventId={data.eventId}
        institutionId={auth.institutionId}
        institutionName={auth.institutionName}
        onSubmit={(formData) => mutations.saveMutation.mutate(formData)}
        isLoading={mutations.saveMutation.isPending}
        availableSubjects={data.subjects}
        availableTeachers={data.teachers}
      />

      {/* ======================================================= */}
      {/* UPDATE: PENAMBAHAN PROP ERROR LOGS PADA IMPORT DIALOG   */}
      {/* ======================================================= */}
      <ExamSessionImportDialog
        open={modals.isImportOpen}
        onOpenChange={modals.setIsImportOpen}
        onImport={async (file) => {
          await mutations.importMutation.mutateAsync(file);
        }}
        isLoading={mutations.importMutation.isPending}
        onDownloadTemplate={handlers.handleDownloadTemplate}
        errorLogs={modals.detailErrors}         // <-- Props Baru
        setErrorLogs={modals.setDetailErrors}   // <-- Props Baru
      />

      <Dialog open={!!modals.deleteId} onOpenChange={(v) => !v && modals.setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center p-6 border-0 shadow-2xl">
          <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <DialogTitle className="text-lg font-black text-slate-900">Hapus Jadwal Sesi?</DialogTitle>
          <DialogDescription className="text-xs mt-2 text-slate-500">
            Aksi ini akan menghapus permanen jadwal ini beserta <b className="text-rose-600">data nilai peserta</b> di dalamnya!
          </DialogDescription>
          <DialogFooter className="mt-5 flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => modals.setDeleteId(null)} className="flex-1 rounded-xl font-bold border-slate-200" disabled={mutations.deleteMutation.isPending}>
              Batal
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform"
              onClick={() => modals.deleteId && mutations.deleteMutation.mutate(modals.deleteId)}
              disabled={mutations.deleteMutation.isPending}
            >
              {mutations.deleteMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RUANG GELAP: CETAK KARTU */}
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none -z-50 overflow-hidden" aria-hidden="true">
        {print.singlePrintData && (
          <ExamCardPrint ref={print.singlePrintRef} student={print.singlePrintData} />
        )}
      </div>

    </div>
  );
}