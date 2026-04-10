"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/use-auth-store";

// --- KOMPONEN UI ---
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronLeft } from "lucide-react";

// --- KOMPONEN LEGER KELAS ---
import { useClassLegerController } from "@/components/pages/results/classes/useClassLegerController";
import { LegerDetailHeader } from "@/components/pages/results/classes/leger-detail-header";
import { LegerStatsCards } from "@/components/pages/results/classes/leger-stats-cards";
import { LegerTable } from "@/components/pages/results/classes/leger-table";
import { LegerPrintTemplate } from "@/components/pages/results/classes/leger-print-template";

export default function ClassLegerPage() {
  const { user } = useAuthStore() as any;
  const controller = useClassLegerController();

  // Mencegah error hidrasi (hydration mismatch) di Next.js
  if (!controller.isMounted) return null;
  const { data, state, handlers, refs } = controller;

  // 1. SKELETON LOADER: Tampilan saat data pertama kali dimuat
  if (data.isLoading && !data.classInfo) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        <Skeleton className="h-16 w-1/3 rounded-xl bg-slate-200" />
        <Skeleton className="h-24 w-full rounded-xl bg-slate-200" />
        <Skeleton className="h-[500px] w-full rounded-xl bg-slate-200" />
      </div>
    );
  }

  // 2.  SISTEM KEAMANAN (ROLE GUARD) 
  // Mengecek apakah user adalah Admin, ATAU Guru yang ID-nya sama dengan Wali Kelas ini.
  const isAuthorized =
    ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"].includes(user?.role) ||
    user?.id === data.classInfo?.teacher_id;

  // Jika tidak diizinkan, tampilkan UI "Akses Ditolak"
  if (!isAuthorized && data.classInfo) {
    return (
      <div className="p-6 lg:p-8 w-full mx-auto flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-500 bg-slate-50/30">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-5 border border-rose-100">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Akses Ditolak</h2>
          <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
            Maaf, Halaman Leger Kelas ini bersifat rahasia dan hanya dapat diakses oleh <strong className="text-slate-700">Wali Kelas</strong> yang bersangkutan atau Administrator.
          </p>
          <Link href="/dashboard/results?tab=mapel" className="w-full">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-sm active:scale-95 transition-all text-sm">
              <ChevronLeft className="h-4 w-4 mr-2" /> Kembali ke Nilai Mata Pelajaran
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. TAMPILAN UTAMA (Hanya di-render jika LOLOS otorisasi)
  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-6 font-sans flex flex-col h-full bg-slate-50/30 min-h-screen animate-in fade-in duration-500 relative">
      
      {/* Indikator Loading Tipis Saat Auto-Save berjalan di latar belakang */}
      {data.isFetching && !data.isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 z-50 overflow-hidden no-print">
          <div className="h-full bg-emerald-500 animate-pulse w-1/3 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
      )}

      {/* Style khusus untuk mengatur kertas saat mencetak (Print) */}
      <style dangerouslySetInnerHTML={{ __html: `@media print { @page { size: A4 landscape; margin: 10mm; } .no-print { display: none !important; } .print-visible { display: block !important; } }` }} />

      {/* Komponen-Komponen yang sudah kita pecah (Clean Architecture) */}
      <LegerDetailHeader 
        classInfo={data.classInfo} 
        isLoading={data.isLoading} 
        onPrint={handlers.handlePrint} 
      />

      <LegerStatsCards 
        classInfo={data.classInfo} 
        totalStudents={data.totalItems} 
      />

      <LegerTable controller={controller} />
      
      <LegerPrintTemplate ref={refs.printRef} data={data} />

    </div>
  );
}