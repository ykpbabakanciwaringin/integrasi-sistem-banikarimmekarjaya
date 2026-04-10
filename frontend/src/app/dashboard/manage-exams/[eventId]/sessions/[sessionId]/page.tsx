// LOKASI: src/app/dashboard/manage-exams/[eventId]/sessions/[sessionId]/page.tsx
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Grid2X2, RefreshCcw, Wand2, UserX } from "lucide-react";

import { useParticipantController } from "@/components/pages/manage-exams/[eventId]/sessions/useParticipantController";
import { SessionDetailHeader } from "@/components/pages/manage-exams/[eventId]/sessions/session-detail-header";
import { ParticipantFilters } from "@/components/pages/manage-exams/[eventId]/sessions/participant-filters";
import { ParticipantTable } from "@/components/pages/manage-exams/[eventId]/sessions/participant-table";
import { ExamCardPrint } from "@/components/pages/manage-exams/[eventId]/sessions/exam-card-print";

// Lazy loading komponen modal untuk optimasi bundle size
const ParticipantFormDialog = dynamic(() => import("@/components/pages/manage-exams/[eventId]/sessions/participant-form-dialog").then(mod => mod.ParticipantFormDialog), { ssr: false });
const ParticipantImportDialog = dynamic(() => import("@/components/pages/manage-exams/[eventId]/sessions/participant-import-dialog").then(mod => mod.ParticipantImportDialog), { ssr: false });
const ParticipantSelectorDialog = dynamic(() => import("@/components/pages/manage-exams/[eventId]/sessions/participant-selector-dialog").then(mod => mod.ParticipantSelectorDialog), { ssr: false });
const ResultDetailDialog = dynamic(() => import("@/components/pages/manage-exams/[eventId]/sessions/result-detail-dialog").then(mod => mod.ResultDetailDialog), { ssr: false });
const ParticipantPhotoDialog = dynamic(() => import("@/components/pages/manage-exams/[eventId]/sessions/participant-photo-dialog").then(mod => mod.ParticipantPhotoDialog), { ssr: false });

function SessionDetailContent() {
  const controller = useParticipantController();

  if (!controller.isMounted) return null;

  const {
    auth: { isTeacher, userRole },
    params: { eventId, sessionId, institutionId },
    state,
    modals,
    data,
    mutations,
    handlers,
    print,
    router
  } = controller;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <SessionDetailHeader 
        sessionDetail={data.sessionDetail} 
        onBack={() => router.push(`/dashboard/manage-exams/${eventId}`)}
        onImportClick={() => modals.setIsImportOpen(true)}
        onUploadPhotoClick={() => modals.setIsPhotoDialogOpen(true)}
        onAddClick={() => modals.setIsAddOpen(true)}
        isLoading={data.isSessionLoading}
        role={userRole} 
      />

      <Card className="border-0 shadow-sm rounded-[1.5rem] bg-white overflow-hidden relative transition-all duration-300">
        {data.isFetching && !data.isParticipantsLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        )}

        <ParticipantFilters 
          search={state.search} 
          onSearchChange={state.setSearch} 
          filterStatus={state.filterStatus} 
          onFilterStatusChange={(val) => handlers.updateQueryParams({ status: val, page: 1 })}
          filterGender={state.filterGender} 
          onFilterGenderChange={(val) => handlers.updateQueryParams({ gender: val, page: 1 })} 
          filterClassId={state.filterClassId} 
          onFilterClassIdChange={(val) => handlers.updateQueryParams({ class_id: val, page: 1 })} 
          onClearFilters={handlers.handleClearFilters} 
          classes={data.classes}
        />

        <CardContent className="p-0">
          <ParticipantTable 
            sessionId={sessionId} 
            isActive={data.sessionDetail?.is_active || false} 
            participants={data.participants} 
            isLoading={data.isParticipantsLoading || data.isTransitioning} 
            page={state.page} 
            limit={state.limit} 
            totalItems={data.totalItems} 
            totalPages={data.totalPages}
            onPageChange={(val) => handlers.updateQueryParams({ page: val })} 
            onLimitChange={(val) => handlers.updateQueryParams({ limit: val, page: 1 })}
            selectedIds={state.selectedIds} 
            onSelectAll={handlers.handleSelectAll} 
            onSelect={handlers.handleSelect}
            onEditParticipant={modals.setEditingData} 
            onDelete={modals.setDeleteId} 
            onResetPassword={(id) => modals.setResetId(id)}
            role={userRole} 
          />
        </CardContent>
      </Card>

      {/* FLOATING ACTION BAR: Muncul saat ada siswa yang dipilih */}
      {state.selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-6 py-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-in slide-in-from-bottom-10 border border-slate-700">
          <div className="flex flex-col items-center sm:items-start">
            <span className="font-black text-sm leading-tight text-yellow-400">{state.selectedIds.length} Siswa Terpilih</span>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Aksi Massal Tersedia</span>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-700"></div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="sm" onClick={() => modals.setIsPrintModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-xl font-bold px-5 h-10 shadow-lg">
              <Printer className="w-4 h-4 mr-2"/> Cetak Kartu
            </Button>
            
            {!isTeacher && (
              <Button size="sm" onClick={() => modals.setIsBulkGenerateOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-xl font-bold px-5 h-10 shadow-lg">
                <Wand2 className="w-4 h-4 mr-2"/> Buat Sandi Baru
              </Button>
            )}
          </div>
        </div>
      )}

      {/* DIALOG CETAK */}
      <Dialog open={modals.isPrintModalOpen} onOpenChange={(v) => !print.isPrinting && modals.setIsPrintModalOpen(v)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md rounded-[1.5rem] p-0 overflow-hidden border-0 shadow-2xl [&>button]:hidden animate-in zoom-in-95">
           <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
             <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 border border-indigo-200/50 shadow-inner">
               <Printer className="h-8 w-8 text-indigo-600" />
             </div>
             <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Pilih Format Cetak</DialogTitle>
             <DialogDescription className="text-sm mt-3 text-slate-500 font-medium leading-relaxed">
               Anda akan mencetak <b>{state.selectedIds.length} kartu peserta</b>. Silakan pilih format output dokumen yang Anda butuhkan.
             </DialogDescription>
           </div>
          
          <div className="p-6 flex flex-col gap-3 bg-white">
            <Button variant="outline" className="h-auto p-4 flex items-center justify-start gap-4 rounded-2xl hover:bg-slate-50 group text-left border-slate-200" onClick={() => handlers.executePrint("a4")}>
              <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform shrink-0"><Grid2X2 className="h-6 w-6" /></div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Kertas A4 (Dokumen PDF)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Disusun 8 kartu per halaman. Langsung print ke printer.</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex items-center justify-start gap-4 rounded-2xl hover:bg-slate-50 group text-left border-slate-200" onClick={() => handlers.executePrint("single")}>
              <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform shrink-0"><Printer className="h-6 w-6" /></div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Kartu Satuan (Arsip .ZIP)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Gambar .PNG dipisah satu per satu (Ukuran Asli).</p>
              </div>
            </Button>
            <Button variant="ghost" className="mt-2 text-slate-500 font-bold hover:bg-red-100 rounded-xl h-11" onClick={() => modals.setIsPrintModalOpen(false)}>Batal Cetak</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG GENERATE SANDI MASSAL */}
      <Dialog open={modals.isBulkGenerateOpen} onOpenChange={modals.setIsBulkGenerateOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-sm rounded-[1.5rem] text-center p-8 border-0 shadow-2xl [&>button]:hidden animate-in zoom-in-95">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 border border-amber-200/50 shadow-inner">
            <Wand2 className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Generate Sandi Massal?</DialogTitle>
          <DialogDescription className="text-sm mt-3 text-slate-500 font-medium">
            Sistem akan membuat sandi acak baru untuk <b className="text-emerald-600">{state.selectedIds.length} peserta</b>. Sandi lama akan tertimpa dan tidak bisa dikembalikan.
          </DialogDescription>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => modals.setIsBulkGenerateOpen(false)} className="flex-1 rounded-xl font-bold h-11 border-slate-200">Batal</Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold h-11 shadow-md" onClick={() => mutations.bulkGeneratePassMutation.mutate(state.selectedIds)} disabled={mutations.bulkGeneratePassMutation.isPending}>
              {mutations.bulkGeneratePassMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Ya, Buat Sandi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG HAPUS PESERTA */}
      <Dialog open={!!modals.deleteId} onOpenChange={(v) => !v && modals.setDeleteId(null)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-sm rounded-[1.5rem] text-center p-8 border-0 shadow-2xl [&>button]:hidden animate-in zoom-in-95">
          <div className="mx-auto w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 border border-rose-200/50 shadow-inner rotate-3"><UserX className="h-8 w-8 text-rose-600" /></div>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Keluarkan Peserta?</DialogTitle>
          <DialogDescription className="text-sm mt-3 text-slate-500 font-medium">Siswa ini akan dihapus dari daftar peserta sesi ujian ini. Data jawaban (jika ada) mungkin akan hilang.</DialogDescription>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => modals.setDeleteId(null)} className="flex-1 rounded-xl font-bold h-11 border-slate-200">Batal</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold h-11 shadow-md" onClick={() => modals.deleteId && mutations.deleteMutation.mutate(modals.deleteId)} disabled={mutations.deleteMutation.isPending}>
              {mutations.deleteMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Ya, Keluarkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG RESET LOGIN */}
      <Dialog open={!!modals.resetId} onOpenChange={(v) => !v && modals.setResetId(null)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-sm rounded-[1.5rem] text-center p-8 border-0 shadow-2xl [&>button]:hidden animate-in zoom-in-95">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 border border-emerald-200/50 shadow-inner -rotate-3"><RefreshCcw className="h-8 w-8 text-emerald-600" /></div>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Reset Sesi Login?</DialogTitle>
          <DialogDescription className="text-sm mt-3 text-slate-500 font-medium">Aksi ini akan mengeluarkan siswa dari perangkat lamanya agar ia bisa login kembali (password tidak berubah).</DialogDescription>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={() => modals.setResetId(null)} className="flex-1 rounded-xl font-bold h-11 border-slate-200">Batal</Button>
            <Button className="flex-1 bg-[#043425] hover:bg-[#032419] text-white rounded-xl font-bold h-11 shadow-md" onClick={() => modals.resetId && mutations.resetPasswordMutation.mutate(modals.resetId)} disabled={mutations.resetPasswordMutation.isPending}>
              {mutations.resetPasswordMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Ya, Reset Login"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* LAZY LOADED MODALS */}
      {modals.isAddOpen && (
        <ParticipantSelectorDialog 
          open={modals.isAddOpen} 
          onOpenChange={modals.setIsAddOpen} 
          // [PERBAIKAN FASE MULTI-MAPEL]: Menggunakan qbankIds sebagai Array untuk mutasi bulk
          onSubmit={(studentIds: string[], qbankIds: string[]) => mutations.addBulkMutation.mutate({ studentIds, qbankIds })} 
          isLoading={mutations.addBulkMutation.isPending} 
          questionBanks={data.questionBanks} 
          institutionId={institutionId}
          sessionSubjectList={data.sessionDetail?.subject_list} 
        />
      )}
      
      {modals.isImportOpen && (
        <ParticipantImportDialog 
          open={modals.isImportOpen} 
          onOpenChange={modals.setIsImportOpen} 
          onDownloadTemplate={handlers.handleDownloadTemplate} 
          onImport={(file: File) => mutations.importMutation.mutate(file)} 
          isLoading={mutations.importMutation.isPending} 
          institutionName={data.sessionDetail?.institution?.name || "Semua Lembaga"} 
        />
      )}
      
      {modals.isPhotoDialogOpen && (
        <ParticipantPhotoDialog 
          open={modals.isPhotoDialogOpen} 
          onOpenChange={modals.setIsPhotoDialogOpen} 
          onDownloadReference={handlers.handleDownloadPhotoReference} 
          onUpload={(file: File) => mutations.bulkUploadPhotoMutation.mutate(file)} 
          isLoading={mutations.bulkUploadPhotoMutation.isPending} 
        />
      )}
      
      {!!modals.editingData && (
        <ParticipantFormDialog 
          open={!!modals.editingData} 
          onOpenChange={(open: boolean) => !open && modals.setEditingData(null)} 
          initialData={modals.editingData} 
          onSubmit={(payload: any) => mutations.editMutation.mutate(payload)} 
          isLoading={mutations.editMutation.isPending} 
          questionBanks={data.questionBanks}
          sessionSubjectList={data.sessionDetail?.subject_list} 
        />
      )}
      
      {!!modals.detailData && <ResultDetailDialog participant={modals.detailData} onClose={() => modals.setDetailData(null)} />}

      {/* AREA TERSEMBUNYI UNTUK RENDERING CETAK KARTU */}
      <div style={{ position: "absolute", top: 0, left: "-9999px", zIndex: -1000, pointerEvents: 'none' }}>
        <div ref={print.singlePrintRef}>
          {print.singlePrintData && <ExamCardPrint student={print.singlePrintData} />}
        </div>
      </div>

    </div>
  );
}

export default function SessionDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] w-full items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-black text-slate-800 tracking-tight">Memuat Ruang Ujian</p>
          </div>
        </div>
      </div>
    }>
      <SessionDetailContent />
    </Suspense>
  );
}