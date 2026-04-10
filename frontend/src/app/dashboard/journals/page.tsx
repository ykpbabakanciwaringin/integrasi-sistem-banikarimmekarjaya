// LOKASI: src/app/dashboard/journals/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { BookOpenCheck, Loader2, ListChecks, Users, LibraryBig, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/use-auth-store";

// Import Keempat Tab yang sudah dipisah (Code Splitting)
import { HistoryTab } from "@/components/pages/journals/tabs/history-tab";
import { RecapMapelTab } from "@/components/pages/journals/tabs/recap-mapel-tab";
import { RecapClassTab } from "@/components/pages/journals/tabs/recap-class-tab";
import { RecapTeacherTab } from "@/components/pages/journals/tabs/recap-teacher-tab";

function JournalContainer() {
  const [mounted, setMounted] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === "TEACHER";
  const isAdminOrSuper = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "ADMIN_ACADEMIC";

  // Default tab saat halaman dibuka
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cegah render sebelum komponen menempel di browser (Mencegah Layar Merah Hydration)
  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER MASTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
            <BookOpenCheck className="h-7 w-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pusat Jurnal & Absensi KBM</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Kelola pencatatan mengajar dan analitik kehadiran siswa kelas Enterprise.
            </p>
          </div>
        </div>
      </div>

      {/* MASTER TABS NAVIGATION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <TabsList className="bg-white border border-slate-200 p-1.5 shadow-sm rounded-xl h-auto flex w-max min-w-full sm:min-w-0">
            <TabsTrigger value="history" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
              <ListChecks className="w-4 h-4 mr-2" /> Riwayat KBM
            </TabsTrigger>
            <TabsTrigger value="recap_mapel" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
              <LibraryBig className="w-4 h-4 mr-2" />Presensi Mata Pelajaran
            </TabsTrigger>
            <TabsTrigger value="recap_class" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 mr-2" />Presensi Kelas
            </TabsTrigger>
            
            {/* Tab Kinerja Guru Hanya Muncul untuk Admin/Kepala Sekolah */}
            {isAdminOrSuper && (
              <TabsTrigger value="recap_teacher" className="py-2.5 px-4 rounded-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
                <GraduationCap className="w-4 h-4 mr-2" />Presensi Guru
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* KONTEN TAB 1: RIWAYAT KBM & FORM INPUT */}
        <TabsContent value="history" className="flex-1 mt-4 data-[state=inactive]:hidden outline-none">
          <HistoryTab user={user} isTeacher={isTeacher} isAdminOrSuper={isAdminOrSuper} />
        </TabsContent>

        {/* KONTEN TAB 2: REKAP MATRIKS PER MATA PELAJARAN */}
        <TabsContent value="recap_mapel" className="flex-1 mt-4 data-[state=inactive]:hidden outline-none">
          <RecapMapelTab institutionId={user?.institution_id || ""} />
        </TabsContent>

        {/* KONTEN TAB 3: REKAP TOTAL ALPA SELURUH KELAS */}
        <TabsContent value="recap_class" className="flex-1 mt-4 data-[state=inactive]:hidden outline-none">
          <RecapClassTab institutionId={user?.institution_id || ""} />
        </TabsContent>

        {/* KONTEN TAB 4: REKAP KINERJA & KEHADIRAN GURU */}
        {isAdminOrSuper && (
          <TabsContent value="recap_teacher" className="flex-1 mt-4 data-[state=inactive]:hidden outline-none">
            <RecapTeacherTab institutionId={user?.institution_id || ""} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
      <JournalContainer />
    </Suspense>
  );
}