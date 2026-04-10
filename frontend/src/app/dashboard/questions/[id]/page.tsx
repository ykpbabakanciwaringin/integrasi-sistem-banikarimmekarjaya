// LOKASI: src/app/dashboard/questions/[id]/page.tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, ChevronLeft } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Custom Feature Components
import { QuestionDetailHeader } from "@/components/pages/questions/[id]/question-detail-header";
import { QuestionInfoGrid } from "@/components/pages/questions/[id]/question-info-grid";
import { QuestionEditorTab } from "@/components/pages/questions/[id]/question-editor-tab";
import { QuestionPreviewTab } from "@/components/pages/questions/[id]/question-preview-tab";
import { QuestionFormDialog } from "@/components/pages/questions/[id]/question-form-dialog";
import { ImportExcelDialog } from "@/components/pages/questions/[id]/import-excel-dialog";

// Controller
import { useQuestionDetailController } from "@/components/pages/questions/[id]/useQuestionDetailController";

// Next.js 15+ Params definition
export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const {
    isMounted, state, modals, data, mutations, handlers
  } = useQuestionDetailController(resolvedParams.id);

  if (!isMounted) return null;

  if (data.isPacketLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="space-y-4"><Skeleton className="h-64 w-full rounded-2xl" /></div>
      </div>
    );
  }

  if (!data.packetDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h3 className="text-xl font-bold text-slate-800">Paket Soal Tidak Ditemukan</h3>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/questions")}>Kembali ke Bank Soal</Button>
      </div>
    );
  }

  const { packetDetail } = data;
  const optionLabels = ["A", "B", "C", "D", "E"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-10">
      
      {/* TOMBOL KEMBALI */}
      <Button variant="ghost" className="text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 -ml-2 h-9 px-3" onClick={() => router.push("/dashboard/questions")}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Kembali ke Bank Soal
      </Button>

      {/* HEADER & INFO GRID */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <QuestionDetailHeader 
          title={packetDetail.title} 
          // [PERBAIKAN]: Menarik relasi Code Mapel secara langsung dari objek subject
          subjectCode={packetDetail.subject?.code || "MAPEL"}
          onOpenImport={() => modals.setIsImportOpen(true)} 
          onOpenAdd={handlers.handleOpenAdd} 
        />
        <QuestionInfoGrid 
          // [PERBAIKAN]: Menarik relasi Nama Mapel secara langsung dari objek subject
          subjectName={packetDetail.subject?.name || "-"} 
          gradeLevel={packetDetail.grade_level} 
          questionType={packetDetail.type} // Tipe (PG/ESSAY/MIXED) diambil langsung
          totalItems={data.totalItems} 
          totalScore={data.totalScore} 
        />
      </div>

      {/* TABS KONTEN (EDITOR & PREVIEW) */}
      <Tabs value={state.activeTab} onValueChange={state.setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-white border border-slate-200 shadow-sm h-12 p-1 rounded-xl">
            <TabsTrigger value="editor" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg px-6 font-bold text-slate-500">
              Editor Soal
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg px-6 font-bold text-slate-500">
              Preview Ujian
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="m-0 border-none p-0 outline-none">
          <QuestionEditorTab 
            currentItems={data.currentItems}
            currentPage={state.currentPage}
            itemsPerPage={state.itemsPerPage}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            optionLabels={optionLabels}
            setItemsPerPage={state.setItemsPerPage}
            setCurrentPage={state.setCurrentPage}
            onOpenEdit={handlers.handleOpenEdit}
            onDelete={(id) => modals.setDeleteId(id)}
            onOpenAdd={handlers.handleOpenAdd}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0 border-none p-0 outline-none">
          <QuestionPreviewTab 
            packetTitle={packetDetail.title}
            currentItems={data.currentItems}
            currentPage={state.currentPage}
            itemsPerPage={state.itemsPerPage}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            optionLabels={optionLabels}
            setCurrentPage={state.setCurrentPage}
          />
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}
      <QuestionFormDialog 
        open={modals.isFormOpen} 
        onOpenChange={modals.setIsFormOpen} 
        isEditMode={!!modals.selectedItem} 
        initialData={modals.selectedItem} 
        onSubmit={(payload) => mutations.saveItemMutation.mutate(payload)} 
        isSaving={mutations.saveItemMutation.isPending}
      />

      <ImportExcelDialog 
        open={modals.isImportOpen} 
        onOpenChange={modals.setIsImportOpen} 
        onImport={(file) => mutations.importMutation.mutate(file)} 
        isImporting={mutations.importMutation.isPending} 
      />

      {/* ALERT HAPUS */}
      <AlertDialog open={!!modals.deleteId} onOpenChange={(open) => !open && modals.setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              Hapus Soal Ini?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-sm leading-relaxed mt-3">
              Soal ini akan disembunyikan dan tidak akan muncul lagi dalam ujian siswa berikutnya. 
              <br/><br/>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-md border border-emerald-100 inline-block">
                Info Keamanan:
              </span> Data riwayat ujian siswa yang sudah terlanjur menjawab soal ini sebelumnya akan tetap aman di database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="border-slate-200 text-slate-700 text-sm font-bold h-10 px-6 rounded-xl hover:bg-slate-50">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold h-10 px-6 rounded-xl shadow-md"
              onClick={() => modals.deleteId && mutations.deleteItemMutation.mutate(modals.deleteId)}
            >
              {mutations.deleteItemMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />} Ya, Hapus Soal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}