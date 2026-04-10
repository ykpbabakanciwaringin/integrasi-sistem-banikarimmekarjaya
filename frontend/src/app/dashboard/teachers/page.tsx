// LOKASI: src/app/dashboard/teachers/page.tsx
"use client";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
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

// Custom Feature Components
import { TeacherHeader } from "@/components/pages/teachers/teacher-header";
import { TeacherFilters } from "@/components/pages/teachers/teacher-filters";
import { TeacherTable } from "@/components/pages/teachers/teacher-table";
import { TeacherFormDialog } from "@/components/pages/teachers/form/teacher-form-dialog";
import { TeacherDetailDialog } from "@/components/pages/teachers/teacher-detail-dialog";
import { TeacherIdCardPrint } from "@/components/pages/teachers/teacher-id-card-print";
import { TeacherImportDialog } from "@/components/pages/teachers/teacher-import-dialog";

//  ARSITEKTUR BARU: Mengimpor "Otak" Halaman dari Hook Kustom
import { useTeacherController } from "@/components/pages/teachers/useTeacherController";

export default function TeachersPage() {
  // Memanggil pengontrol (controller) yang menyimpan seluruh logika bisnis
  const controller = useTeacherController();

  if (!controller.isMounted) return null;

  // Destrukturisasi objek dari controller agar mudah digunakan di UI
  const { auth, state, modals, data, mutations, handlers, print, queryClient } = controller;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/*  Komponen Tersembunyi (Hidden) Untuk Render Gambar ID Card */}
      <div className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none">
        {print.printData && (
          <TeacherIdCardPrint ref={print.printCardRef} teacher={print.printData} />
        )}
      </div>

      {/*  Komponen Header (Judul & Tombol Aksi) */}
      <TeacherHeader 
        selectedCount={state.selectedIds.length}
        isPrinting={print.isPrinting}
        onPrintClick={print.processBatchPrint} // Disesuaikan dengan use-teacher-print
        onImportClick={() => modals.setIsImportOpen(true)}
        onAddClick={handlers.handleAddClick}
        onExportExcelClick={handlers.handleExportExcel}
        onExportPdfClick={handlers.handleExportPdf}
      />

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
        <CardContent className="p-0">
          <div className="p-0 border-b border-slate-100 bg-slate-50/50">
            {/*  Komponen Filter & Pencarian */}
            <TeacherFilters 
              activeTab={state.activeTab}
              setActiveTab={state.setActiveTab}
              pendingCount={data.pendingCount}
              search={state.search}
              onSearchChange={state.setSearch}
              filterInstId={state.filterInstId}
              onFilterInstIdChange={state.setFilterInstId}
              filterGender={state.filterGender}
              onFilterGenderChange={state.setFilterGender}
              filterPosition={state.filterPosition}
              onFilterPositionChange={state.setFilterPosition}
              institutions={data.institutions}
              isSuperAdmin={auth.isSuperAdmin}
            />
          </div>

          {/*  Komponen Tabel Data */}
          <TeacherTable 
            teachers={data.teachers}
            isLoading={data.isLoading || data.isFetching}
            page={state.page}
            limit={state.limit}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            activeTab={state.activeTab}
            selectedIds={state.selectedIds}
            activatingId={state.activatingId}
            onSelectAll={(checked) => {
              state.setSelectedIds(checked ? data.teachers.map((t: any) => t.id) : []);
            }}
            onSelectOne={(id, checked) => {
              state.setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
            }}
            onPageChange={state.setPage}
            onLimitChange={state.setLimit}
            onEditClick={handlers.handleEditClick}
            onDeleteClick={(id) => modals.setDeleteId(id)}
            onViewClick={(item) => {
              modals.setSelectedTeacher(item);
              modals.setIsDetailOpen(true);
            }}
            onVerify={(id) => mutations.verifyMutation.mutate(id)} //  Ditambahkan untuk tombol inline verifikasi
            isSuperAdmin={auth.isSuperAdmin}
          />
        </CardContent>
      </Card>

      {/* =====================================================================
          KUMPULAN DIALOG / MODAL (Pop-up Murni Tanpa Menggeser Layout)
      ===================================================================== */}
      
      <TeacherImportDialog 
        open={modals.isImportOpen} 
        onOpenChange={modals.setIsImportOpen} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["teachers_all"] })}
        institutions={data.institutions}
        isSuperAdmin={auth.isSuperAdmin}
        userInstId={auth.userInstId}
      />

      <TeacherFormDialog 
        open={modals.isFormOpen} 
        onOpenChange={(v) => !v ? handlers.handleCloseForm() : modals.setIsFormOpen(v)} 
        isEditMode={modals.isEditMode} 
        initialData={modals.formData} 
        onSubmit={(postData, photo) => mutations.saveMutation.mutate({ data: postData, photo })} 
        isLoading={mutations.saveMutation.isPending} 
        institutions={data.institutions} 
        isSuperAdmin={auth.isSuperAdmin} 
        userInstName={auth.userInstName} 
      />
      
      <TeacherDetailDialog 
        open={modals.isDetailOpen} 
        onOpenChange={modals.setIsDetailOpen} 
        teacher={modals.selectedTeacher}
        onVerify={(id) => { mutations.verifyMutation.mutate(id); modals.setIsDetailOpen(false); }}
        isVerifying={state.activatingId === modals.selectedTeacher?.id}
      />

      <AlertDialog open={!!modals.deleteId} onOpenChange={(open) => !open && modals.setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Hapus Data Guru?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Seluruh data akademik dan penugasan lembaga guru ini akan ikut terhapus dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-slate-50 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-rose-600 hover:bg-rose-700 shadow-md text-white font-bold" 
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