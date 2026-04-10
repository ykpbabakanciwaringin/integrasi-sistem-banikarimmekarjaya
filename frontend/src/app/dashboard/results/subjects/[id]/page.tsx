// LOKASI: src/app/dashboard/results/subjects/[id]/page.tsx
"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubjectResultController } from "@/components/pages/results/subjects/useSubjectResultController";
import { SubjectDetailHeader } from "@/components/pages/results/subjects/subject-detail-header";
import { SubjectStatsCards } from "@/components/pages/results/subjects/subject-stats-cards";
import { SubjectPrintTemplate } from "@/components/pages/results/subjects/subject-print-template";
import { ScoreTable } from "@/components/pages/results/subjects/score-table";

export default function DetailNilaiMapelPage() {
  const controller = useSubjectResultController();

  if (!controller.isMounted) return null;
  const { tableState, kkmState, data, exportState, handlers, refs } = controller;

  // Tampilan loading kerangka utama saat pertama kali dimuat
  if (data.isLoading && !data.detail) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        <Skeleton className="h-16 w-1/3 rounded-xl bg-slate-200" />
        <Skeleton className="h-28 w-full rounded-xl bg-slate-200" />
        <Skeleton className="h-[500px] w-full rounded-xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-6 font-sans flex flex-col h-full bg-slate-50/30 min-h-screen animate-in fade-in duration-500 relative">
      
      {/* Indikator Loading Tipis Saat Auto-Refresh (Background Fetching) */}
      {data.isFetching && !data.isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden no-print">
          <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
      )}

      {/* Style khusus untuk mencetak (Print) */}
      <style dangerouslySetInnerHTML={{ __html: `@media print { @page { size: A4 portrait; margin: 10mm; } .no-print { display: none !important; } .print-visible { display: block !important; } }` }} />

      <SubjectDetailHeader 
        detail={data.detail} 
        isLoading={data.isLoading} 
        exportState={exportState} 
        handlers={handlers} 
      />

      <SubjectStatsCards stats={data.stats} />

      <ScoreTable
        tableState={tableState}
        kkmState={kkmState}
        data={data}
      />

      <SubjectPrintTemplate 
        ref={refs.printRef} 
        detail={data.detail} 
        grades={data.grades} // Membawa raw grades untuk versi cetak
        todayStr={data.todayStr} 
      />
    </div>
  );
}