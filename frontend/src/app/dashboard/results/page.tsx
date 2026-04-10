"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useResultController } from "@/components/pages/results/useResultController";
import { ResultHeader } from "@/components/pages/results/result-header";
import { ResultFilters } from "@/components/pages/results/result-filters";
import { ResultTable } from "@/components/pages/results/result-table";

export default function RekapNilaiPage() {
  const controller = useResultController();

  // Mencegah error hidrasi (mismatch) antara server dan client
  if (!controller.isMounted) return null;
  
  const { state, data, isHomeroomTeacher } = controller;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER KOMPONEN (Judul & Deskripsi) */}
      <ResultHeader />

      <Card className="border-0 shadow-sm rounded-xl bg-white overflow-hidden relative">
        
        {/* Progress Bar Loading Indikator (Aktif saat fetching data di background) */}
        {data.isFetching && !data.isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        )}

        {/* KOMPONEN FILTER & TABS (Dinamis berdasarkan Role) */}
        <ResultFilters 
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
          search={state.search}
          onSearchChange={state.setSearch}
          isHomeroomTeacher={isHomeroomTeacher} //  Mengirim status Wali Kelas ke Filter
        />

        {/* KOMPONEN TABEL & PAGINASI */}
        <CardContent className="p-0">
          <ResultTable 
            activeTab={state.activeTab}
            isLoading={data.isLoading}
            page={state.page}
            limit={state.limit}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            dataMapel={data.mapel}
            dataClasses={data.classes}
            dataSessions={data.sessions}
            onPageChange={state.setPage}
            onLimitChange={state.setLimit}
          />
        </CardContent>
      </Card>
    </div>
  );
}