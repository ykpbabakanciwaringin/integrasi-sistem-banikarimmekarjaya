// LOKASI: src/app/dashboard/questions/page.tsx
"use client";

// UI Components
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

// Custom Feature Components
import { QuestionHeader } from "@/components/pages/questions/question-header";
import { QuestionFilter } from "@/components/pages/questions/question-filter";
import { QuestionTable } from "@/components/pages/questions/question-table";
import { QuestionBankDialog } from "@/components/pages/questions/question-bank-dialog";
import { QuestionBatchImportDialog } from "@/components/pages/questions/question-batch-import-dialog"; 

// Controller
import { useQuestionController } from "@/components/pages/questions/useQuestionController";

export default function QuestionsPage() {
  const {
    isMounted, auth, state, modals, data, mutations, handlers
  } = useQuestionController();

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full">
      
      {/* 1. HEADER COMPONENT */}
      <QuestionHeader 
        onCreateClick={handlers.handleOpenCreate} 
        onExportClick={handlers.handleExportExcel} 
        isExporting={state.isExporting}            
        onExportPdfClick={handlers.handleExportPdf} 
        isExportingPdf={state.isExportingPdf}
        onImportBatchClick={handlers.handleOpenBatchModal} 
        onExportListClick={handlers.handleExportList}      
        isExportingList={state.isExportingList}           
      />

      {/* 2. AREA DATA (Filter & Tabel menyatu dalam 1 Card) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        
        {/* FILTER COMPONENT */}
        <QuestionFilter
          isSuperAdmin={auth.isSuperAdmin}
          filterInst={state.filterInst}
          setFilterInst={state.setFilterInst}
          institutions={Array.isArray(data.institutions) ? data.institutions : []}
          filterSubject={state.filterSubject}
          setFilterSubject={state.setFilterSubject}
          subjects={data.subjects}
          searchInput={state.searchInput}
          setSearchInput={state.setSearchInput}
        />

        {/* TABLE COMPONENT */}
        <QuestionTable
          isLoading={data.isLoading}
          packets={data.packets}
          page={state.page}
          limit={state.limit}
          totalData={data.totalData}
          totalPages={data.totalPages}
          isSuperAdmin={auth.isSuperAdmin}
          currentUser={auth.user} 
          onPageChange={state.setPage}
          onLimitChange={state.setLimit}
          onEdit={handlers.handleOpenEdit}
          onDelete={handlers.handleOpenDelete} 
        />
      </div>

      {/* --- MODALS & DIALOGS --- */}
      
      {/* MODAL FORM PAKET (MANUAL) */}
      <QuestionBankDialog
        open={modals.isModalOpen}
        onOpenChange={modals.setIsModalOpen}
        isEditMode={!!modals.editData}
        initialData={modals.editData}
        institutions={Array.isArray(data.institutions) ? data.institutions : []}
        isSuperAdmin={auth.isSuperAdmin}
        userInstId={auth.userInstId}
        onSubmit={async (payload) => {
          //  PERBAIKAN: Pemisahan create dan update sesuai controller baru
          if (modals.editData) {
            await mutations.updateMutation.mutateAsync({ id: modals.editData.id, ...payload });
          } else {
            await mutations.createMutation.mutateAsync(payload);
          }
        }}
        isLoading={mutations.createMutation.isPending || mutations.updateMutation.isPending}
      />

      {/* MODAL IMPORT BATCH PAKET SOAL (BARU) */}
      <QuestionBatchImportDialog
        open={modals.isBatchModalOpen}
        onOpenChange={modals.setIsBatchModalOpen}
        onDownloadTemplate={handlers.handleDownloadBatchTemplate}
        onSubmit={handlers.handleImportBatch}
        isLoading={state.isImporting}
      />

      {/* MODAL HAPUS KONFIRMASI */}
      <AlertDialog open={!!modals.deleteId} onOpenChange={(open) => !open && modals.setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-rose-600" />
              </div>
              Hapus Paket Soal?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
              Paket soal ini akan dihapus dari daftar dan tidak bisa dipilih lagi saat ujian.
              <br /><br />
              <span className="font-bold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded">
                Info Keamanan:
              </span>{" "}
              Jangan khawatir, data riwayat hasil ujian siswa yang sudah menggunakan paket soal ini akan tetap aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 text-slate-700 text-xs font-bold h-9 bg-white hover:bg-slate-50">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-9 shadow-md"
              onClick={() => modals.deleteId && mutations.deleteMutation.mutate(modals.deleteId)}
            >
              {mutations.deleteMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Ya, Hapus Paket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}