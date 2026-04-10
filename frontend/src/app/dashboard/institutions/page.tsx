// LOKASI: src/app/dashboard/institutions/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, FileImage } from "lucide-react";

// Hooks & Components Utama
import { useInstitutionController } from "@/components/pages/institutions/useInstitutionController";
import { InstitutionHeader } from "@/components/pages/institutions/institution-header";
import { InstitutionFilters } from "@/components/pages/institutions/institution-filters";
import { InstitutionTable } from "@/components/pages/institutions/institution-table";
import { KopSurat } from "@/components/pages/institutions/kop-surat";

// Import Modals (Semua Modal Sudah Terpisah Sesuai Tahap 2 & 3)
import { InstitutionFormDialog } from "@/components/pages/institutions/institution-form-dialog";
import { InstitutionDetailDialog } from "@/components/pages/institutions/institution-detail-dialog";
import { InstitutionImportDialog } from "@/components/pages/institutions/institution-import-dialog";

export default function InstitutionsPage() {
  const ctrl = useInstitutionController();

  if (!ctrl.isMounted) return null;

  const { state, modals, data, mutations, handlers } = ctrl;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. HEADER DENGAN FITUR EXPORT BARU */}
      <InstitutionHeader 
        onOpenImport={() => { modals.setImportFile(null); modals.setIsImportOpen(true); }}
        onOpenCreate={handlers.handleCreate}
        onExportExcel={handlers.handleExportListExcel} // <-- SUNTIKAN PROP BARU
        onExportPdf={handlers.handleExportListPdf}     // <-- SUNTIKAN PROP BARU
      />

      {/* 2. AREA FILTER & TABEL */}
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
        <InstitutionFilters 
          searchInput={state.searchInput}
          setSearchInput={state.setSearchInput}
          filter={state.filter}
          setFilter={state.setFilter}
        />

        <CardContent className="p-0">
          <InstitutionTable 
            data={data.displayData}
            isLoading={data.isLoading}
            meta={data.meta}
            onPageChange={(newPage) => state.setFilter({ ...state.filter, page: newPage })}
            onLimitChange={(newLimit) => state.setFilter({ ...state.filter, limit: newLimit, page: 1 })}
            onOpenDetail={(item) => { modals.setSelectedInstitution(item); modals.setIsDetailOpen(true); }}
            onOpenEdit={handlers.handleEdit}
            onOpenPreview={(item) => { modals.setSelectedInstitution(item); modals.setIsPreviewKopOpen(true); }}
            onDelete={(id) => modals.setDeleteId(id)}
          />
        </CardContent>
      </Card>

      {/* ========================================================
          AREA MODALS & DIALOGS (SANGAT BERSIH & MODULAR)
          ======================================================== */}
      
      {/* MODAL FORM LEMBAGA (Sistem Tabs) */}
      <InstitutionFormDialog
        open={modals.isFormOpen}
        onOpenChange={(v) => { if (!v) handlers.handleCloseForm(); else modals.setIsFormOpen(v); }}
        isEditMode={modals.isEditMode}
        initialData={modals.formData}
        onSubmit={(form, logo) => mutations.saveMutation.mutate({ data: form, logo })}
        isLoading={mutations.saveMutation.isPending}
      />

      {/* MODAL DETAIL LEMBAGA (Glowing Effect Header) */}
      <InstitutionDetailDialog
        open={modals.isDetailOpen}
        onOpenChange={modals.setIsDetailOpen}
        institution={modals.selectedInstitution}
      />

      {/* MODAL IMPORT LEMBAGA (Dipisah seperti standar Data Siswa) */}
      <InstitutionImportDialog
        open={modals.isImportOpen}
        onOpenChange={modals.setIsImportOpen}
        importFile={modals.importFile}
        setImportFile={modals.setImportFile}
        isPending={mutations.importMutation.isPending}
        onImport={() => modals.importFile && mutations.importMutation.mutate(modals.importFile)}
      />

      {/* MODAL PREVIEW KOP SURAT */}
      <Dialog open={modals.isPreviewKopOpen} onOpenChange={modals.setIsPreviewKopOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[850px] p-6 bg-slate-200 border-0 flex flex-col items-center rounded-2xl shadow-2xl">
          <DialogHeader className="w-full text-center pb-2">
            <DialogTitle className="text-slate-800 font-bold text-xl">Preview & Download Kop Surat</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Data ini disesuaikan secara dinamis. Klik format di bawah untuk mengunduh.
            </DialogDescription>
          </DialogHeader>
          
          <div className="w-full bg-white shadow-xl overflow-hidden overflow-y-auto rounded-xl border border-slate-300 min-h-[300px]">
            <KopSurat institution={modals.selectedInstitution} />
            <div className="px-12 py-8 text-slate-200 font-serif text-sm opacity-30 select-none space-y-3">
              <div className="h-4 bg-slate-100 rounded-md w-1/4 mb-4"></div>
              <div className="h-2 bg-slate-50 rounded-full w-full"></div>
              <div className="h-2 bg-slate-50 rounded-full w-full"></div>
              <div className="h-2 bg-slate-50 rounded-full w-5/6"></div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mt-6 w-full">
            <Button onClick={() => handlers.handleExportImage('png')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-lg flex items-center gap-2">
              <Download className="h-4 w-4" /> Unduh PNG (High Res)
            </Button>
            <Button onClick={() => handlers.handleExportImage('jpg')} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-lg flex items-center gap-2">
              <FileImage className="h-4 w-4" /> Unduh JPEG
            </Button>
            <Button variant="ghost" onClick={() => modals.setIsPreviewKopOpen(false)} className="text-slate-600 hover:bg-white/50">
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL HAPUS PERMANEN */}
      <AlertDialog open={!!modals.deleteId} onOpenChange={(open) => !open && modals.setDeleteId(null)}>
        <AlertDialogContent aria-describedby={undefined} className="bg-white rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Hapus Lembaga?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Data akan dihapus permanen dan dapat mempengaruhi data siswa serta kelas yang terkait dengan lembaga ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 hover:bg-slate-50 text-slate-600">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              onClick={() => modals.deleteId && mutations.deleteMutation.mutate(modals.deleteId)}
            >
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}