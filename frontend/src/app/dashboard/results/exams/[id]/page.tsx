// LOKASI: src/app/dashboard/results/exams/[id]/page.tsx
"use client";

import React from "react";
import { useExamResultController } from "@/components/pages/results/exams/useExamResultController";
import { ExamDetailHeader } from "@/components/pages/results/exams/exam-detail-header";
import { ExamStatsCards } from "@/components/pages/results/exams/exam-stats-cards";
import { ExamResultFilters } from "@/components/pages/results/exams/exam-result-filters";
import { ExamLeaderboardTable } from "@/components/pages/results/exams/exam-leaderboard-table";
import { ResultDetailDialog } from "@/components/pages/manage-exams/[eventId]/sessions/result-detail-dialog";

export default function ExamResultPage() {
  const controller = useExamResultController();

  if (!controller.isMounted) return null;
  const { state, modals, data, exportState, handlers } = controller;

  return (
    <div className="p-6 space-y-6 w-full animate-in fade-in duration-500">
      
      {/* HEADER KOMPONEN (Telah Diperbarui Visualnya) */}
      <ExamDetailHeader 
        sessionData={data.sessionData} 
        isLoading={data.isLoading && !data.sessionData}
        exportState={exportState} 
        handlers={handlers}
      />

      {/* KARTU STATISTIK */}
      <ExamStatsCards stats={data.stats} />

      {/* KONTAINER UTAMA TABEL & FILTER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
        
        {data.isFetching && !data.isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        )}
        
        <ExamResultFilters 
          state={state} 
          uniqueClasses={data.uniqueClasses} 
          uniqueGenders={data.uniqueGenders} 
          uniqueSubjects={data.uniqueSubjects} //  Diteruskan ke Filter
        />
        
        <ExamLeaderboardTable 
          state={state} 
          data={data} 
          modals={modals} 
        />
      </div>

      <ResultDetailDialog 
        participant={modals.selectedParticipant} 
        onClose={() => modals.setSelectedParticipant(null)} 
      />
    </div>
  );
}