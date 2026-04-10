// LOKASI: src/app/dashboard/students/page.tsx
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
import { StudentHeader } from "@/components/pages/students/student-header";
import { StudentFilters } from "@/components/pages/students/student-filters";
import { StudentTable } from "@/components/pages/students/student-table";
import { StudentFormDialog } from "@/components/pages/students/form/student-form-dialog";
import { StudentDetailDialog } from "@/components/pages/students/student-detail-dialog";
import { StudentImportDialog } from "@/components/pages/students/student-import-dialog";
import { StudentIdCardPrint } from "@/components/pages/students/student-id-card-print";

//  ARSITEKTUR BARU: Mengimpor "Otak" Halaman dari Hook Kustom
import { useStudentController } from "@/components/pages/students/useStudentController";

export default function StudentsPage() {
  // Memanggil pengontrol (controller) yang menyimpan seluruh logika bisnis
  const controller = useStudentController();

  if (!controller.isMounted) return null;

  // Destrukturisasi objek dari controller agar mudah digunakan di UI
  const { auth, state, modals, data, mutations, handlers, print, queryClient } = controller;

  //  Helper Visual Murni (Dibiarkan di file page karena hanya untuk mengatur teks)
  const getInstitutionNameForDetail = (student: any) => {
    return student?.institution?.name || student?.enrollments?.[0]?.institution?.name || (auth.isSuperAdmin ? "Lembaga Pendidikan" : auth.userInstName);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString.startsWith("0001") || dateString === "1/1/1") return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 1900) return "-";
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  // Indikator visual saat data sedang dimuat latar belakang namun tabel kosong
  const isTransitioning = data.isFetching && data.students.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none z-[-1]">
        {print.printData && (
          <StudentIdCardPrint ref={print.printCardRef} student={print.printData} />
        )}
      </div>
      
      <StudentHeader 
        selectedCount={state.selectedIds.length}
        isPrinting={print.isPrinting}
        onPrintClick={print.processBatchPrint}
        onImportClick={() => modals.setIsImportOpen(true)}
        onAddClick={handlers.handleAddClick}
        onExportExcelClick={handlers.handleExportExcel} //  Fungsi Ekspor
        onExportPdfClick={handlers.handleExportPdf}     //  Fungsi Laporan PDF
      />

      <Card className="border-0 shadow-sm rounded-xl bg-white overflow-hidden relative">
        {/* Indikator Loading Tipis saat sinkronisasi data dengan backend */}
        {data.isFetching && !data.isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        )}

        <StudentFilters 
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
          pendingCount={data.pendingCount}
          search={state.search}
          onSearchChange={state.setSearch}
          filterInstId={state.filterInstId}
          onFilterInstIdChange={state.setFilterInstId}
          filterClassId={state.filterClassId}
          onFilterClassIdChange={state.setFilterClassId}
          filterGender={state.filterGender}
          onFilterGenderChange={state.setFilterGender}
          filterStatus={state.filterStatus}
          onFilterStatusChange={state.setFilterStatus}
          institutions={data.institutions}
          classes={data.classes}
          isSuperAdmin={auth.isSuperAdmin}
        />

        <CardContent className="p-0">
          <StudentTable 
            students={data.students}
            isLoading={data.isLoading || isTransitioning}
            page={state.page}
            limit={state.limit}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            activeTab={state.activeTab}
            selectedIds={state.selectedIds}
            activatingId={state.activatingId}
            onSelectAll={(c) => state.setSelectedIds(c ? data.students.map((s: any) => s.id) : [])}
            onSelectOne={(c, id) => state.setSelectedIds(p => c ? [...p, id] : p.filter(i => i !== id))}
            onPageChange={state.setPage}
            onLimitChange={state.setLimit}
            onVerify={(id) => mutations.verifyMutation.mutate(id)}
            onDetail={(student) => { modals.setSelectedStudent(student); modals.setIsDetailOpen(true); }}
            onEdit={handlers.handleEditClick}
            onDelete={modals.setDeleteId}
          />
        </CardContent>
      </Card>

      {/* --- MODAL DIALOGS --- */}

      <StudentImportDialog 
        open={modals.isImportOpen}
        onOpenChange={modals.setIsImportOpen}
        onSuccess={() => {
          modals.setIsImportOpen(false);
          queryClient.invalidateQueries({ queryKey: ["students_all"], refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: ["students_pending_count"], refetchType: "all" });
        }}
        institutions={data.institutions}
        isSuperAdmin={auth.isSuperAdmin}
        userInstId={auth.userInstId}
      />

      <StudentFormDialog
        open={modals.isFormOpen} 
        onOpenChange={(v) => !v ? handlers.handleCloseForm() : modals.setIsFormOpen(v)} 
        isEditMode={modals.isEditMode} 
        initialData={modals.formData} 
        onSubmit={(form, photo) => mutations.saveMutation.mutate({ data: form, photo })} 
        isLoading={mutations.saveMutation.isPending} 
        institutions={data.institutions} 
        isSuperAdmin={auth.isSuperAdmin} 
        userInstName={auth.userInstName} 
      />
      
      <StudentDetailDialog 
        open={modals.isDetailOpen} 
        onOpenChange={modals.setIsDetailOpen} 
        student={modals.selectedStudent}
        institutionName={getInstitutionNameForDetail(modals.selectedStudent)}
        formatDate={formatDate}
        onVerify={(id) => { mutations.verifyMutation.mutate(id); modals.setIsDetailOpen(false); }}
        isVerifying={state.activatingId === modals.selectedStudent?.id}
      />

      <AlertDialog open={!!modals.deleteId} onOpenChange={(open) => !open && modals.setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Seluruh riwayat akademik, nilai ujian, asrama, dan data kehadiran siswa ini akan ikut terhapus dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
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