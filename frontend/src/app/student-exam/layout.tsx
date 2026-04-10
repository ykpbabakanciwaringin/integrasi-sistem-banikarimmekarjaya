"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { StudentHeader } from "@/components/student-exam/dashboard/header";
import { useStudentExamStore } from "@/stores/use-student-exam-store";
import { Toaster } from "react-hot-toast";

export default function StudentExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { initializeConnection } = useStudentExamStore();

  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  // Jika siswa berada di halaman EKSEKUSI UJIAN (/execute), hilangkan Header Dashboard
  const isExecutionRoom = pathname.includes("/execute");

  if (isExecutionRoom) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] relative font-sans">
        {children}
        <Toaster position="top-center" />
      </div>
    );
  }

  // LOKASI DASHBOARD (FULL-WIDTH MINIMALIST LAYOUT)
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC] font-sans selection:bg-emerald-500/30">
      
      {/* HEADER PENUH */}
      <StudentHeader />

      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300">
        {children}
      </main>

      <Toaster position="top-center" />
    </div>
  );
}