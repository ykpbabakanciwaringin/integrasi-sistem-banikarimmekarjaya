// LOKASI: src/app/dashboard/manage-exams/page.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Feature Components
import { ManageExamsHeader } from "@/components/pages/manage-exams/manage-exams-header";
import { ManageExamsFilters } from "@/components/pages/manage-exams/manage-exams-filters";
import { ManageExamsTable } from "@/components/pages/manage-exams/manage-exams-table";
import { EventFormDialog } from "@/components/pages/manage-exams/event-form-dialog";

// Mengimpor Controller Baru
import { useManageExamsController } from "@/components/pages/manage-exams/useManageExamsController";

export default function ManageExamsPage() {
  const controller = useManageExamsController();

  if (!controller.isMounted) return null;

  const { auth, state, modals, data, mutations, handlers } = controller;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <ManageExamsHeader 
        onAddClick={handlers.handleAddClick}
        role={auth.userRole} 
      />

      <Card className="border-0 shadow-sm rounded-xl bg-white overflow-hidden relative">
        {data.isFetching && !data.isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        )}

        <ManageExamsFilters 
          activeTab={state.activeTab} setActiveTab={state.setActiveTab}
          search={state.search} onSearchChange={state.setSearch}
          filterInstId={state.filterInstId} onFilterInstIdChange={state.setFilterInstId}
          institutions={data.institutions} isSuperAdmin={auth.isSuperAdmin}
        />

        <CardContent className="p-0">
          <ManageExamsTable controller={controller} />
        </CardContent>
      </Card>

      <EventFormDialog
        open={modals.isFormOpen} 
        onOpenChange={(v) => !v ? handlers.handleCloseForm() : modals.setIsFormOpen(v)} 
        isEditMode={modals.isEditMode} 
        initialData={modals.selectedEvent} 
        onSubmit={(payload) => mutations.saveMutation.mutate(payload)} 
        isLoading={mutations.saveMutation.isPending} 
        institutions={data.institutions} 
        isSuperAdmin={auth.isSuperAdmin} 
        userInstId={auth.userInstId} 
      />

      <AlertDialog open={!!modals.deleteId} onOpenChange={(open) => !open && modals.setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kegiatan Ujian?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini bersifat permanen. Seluruh sesi ujian dan data peserta di dalam kegiatan ini akan ikut terhapus dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-50 border-slate-200">Batal</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-rose-600 hover:bg-rose-700 shadow-md text-white" 
              onClick={() => modals.deleteId && mutations.deleteMutation.mutate(modals.deleteId)}
              disabled={mutations.deleteMutation.isPending}
            >
              {mutations.deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}