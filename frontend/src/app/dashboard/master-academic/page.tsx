// LOKASI: src/app/dashboard/master-academic/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { CalendarCheck, CalendarOff, BookOpen, BookMarked } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterAcademicHeader } from "@/components/pages/master-academic/master-academic-header";
import { AcademicYearTab } from "@/components/pages/master-academic/academic-year-tab";
import { CurriculumTab } from "@/components/pages/master-academic/curriculum-tab";
import { SubjectTab } from "@/components/pages/master-academic/subject-tab";
import { HolidayTab } from "@/components/pages/master-academic/holiday-tab";

export default function MasterAcademicPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const { user } = useAuthStore();

  if (!isMounted || !user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <MasterAcademicHeader />

      {/* Diselaraskan menjadi rounded-2xl dan border-slate-200 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Tabs defaultValue="academic-year" className="w-full">
          <div className="border-b border-slate-200 bg-slate-50/50 px-4 pt-4">
            <TabsList className="bg-transparent h-12 p-0 gap-6 w-full justify-start overflow-x-auto hide-scrollbar flex-nowrap">
              <TabsTrigger value="academic-year" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-bold text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
                <CalendarCheck className="h-4 w-4 mr-2" /> Tahun Ajaran
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-bold text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
                <BookOpen className="h-4 w-4 mr-2" /> Kurikulum
              </TabsTrigger>
              <TabsTrigger value="subject" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-bold text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
                <BookMarked className="h-4 w-4 mr-2" /> Mata Pelajaran
              </TabsTrigger>
              <TabsTrigger value="holiday" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-bold text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap">
                <CalendarOff className="h-4 w-4 mr-2" /> Libur Akademik
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Area konten diberikan background yang sangat tipis agar tabel di dalamnya lebih menonjol */}
          <div className="p-6 bg-slate-50/30">
            <TabsContent value="academic-year" className="mt-0 outline-none"><AcademicYearTab /></TabsContent>
            <TabsContent value="curriculum" className="mt-0 outline-none"><CurriculumTab /></TabsContent>
            <TabsContent value="subject" className="mt-0 outline-none"><SubjectTab /></TabsContent>
            <TabsContent value="holiday" className="mt-0 outline-none"><HolidayTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}