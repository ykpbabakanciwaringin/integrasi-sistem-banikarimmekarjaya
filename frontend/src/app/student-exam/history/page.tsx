// LOKASI: src/app/student-exam/history/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StudentExamService } from "@/services/student-exam.service";
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudentHistoryPage() {
  const router = useRouter();

  // Fetch Data Riwayat dari Backend
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["student-exam-history"],
    queryFn: StudentExamService.getHistory,
    refetchOnWindowFocus: false,
  });

  //  FIX TYPE: Menambahkan ": any" agar TypeScript tidak memprotes tipe animasi Framer Motion
  const FADE_UP_ANIMATION_VARIANTS: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", staggerChildren: 0.1 } },
  };

  return (
    <div className="w-full flex flex-col pb-16 animate-in fade-in duration-500">
      
      {/* HEADER HALAMAN */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          onClick={() => router.push("/student-exam")}
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Riwayat Ujian</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Daftar evaluasi akademik yang telah Anda selesaikan.</p>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">Memuat data riwayat...</p>
        </div>
      ) : historyData && historyData.length > 0 ? (
        <motion.div 
          variants={FADE_UP_ANIMATION_VARIANTS}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {historyData.map((exam: any, index: number) => (
            <motion.div key={index} variants={FADE_UP_ANIMATION_VARIANTS}>
              <ExamHistoryCard exam={exam} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center px-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <BookOpen className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Belum Ada Riwayat</h3>
          <p className="text-slate-500 max-w-md">Anda belum menyelesaikan ujian apapun. Hasil ujian akan muncul di sini setelah Anda menyelesaikannya.</p>
        </div>
      )}
    </div>
  );
}

// --- KOMPONEN KARTU RIWAYAT ---
function ExamHistoryCard({ exam }: { exam: any }) {
  // Parsing skor (jika nilainya belum keluar, tampilkan 'Menunggu')
  const score = exam.score !== null && exam.score !== undefined ? Number(exam.score).toFixed(1) : null;
  const isPassed = score !== null && Number(score) >= (exam.passing_grade || 70);

  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem] overflow-hidden group bg-white">
      <div className={cn(
        "h-2 w-full", 
        score === null ? "bg-slate-300" : isPassed ? "bg-emerald-500" : "bg-rose-500"
      )} />
      <CardContent className="p-6">
        
        {/* Header Kartu */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <Badge variant="outline" className="w-fit mb-2 bg-slate-50 text-slate-600 border-slate-200 uppercase tracking-widest text-[10px] font-bold">
              {exam.subject_name || "Mata Pelajaran"}
            </Badge>
            <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
              {exam.title || "Judul Ujian"}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
        </div>

        {/* Info Waktu */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center text-xs font-medium text-slate-500 gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {exam.finished_at ? new Date(exam.finished_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
          </div>
          <div className="flex items-center text-xs font-medium text-slate-500 gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Dikerjakan dalam {exam.duration_used || 0} menit
          </div>
        </div>

        {/* Skor Akhir */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nilai Akhir</span>
          {score !== null ? (
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-black", isPassed ? "text-emerald-600" : "text-rose-600")}>
                {score}
              </span>
              {isPassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <div className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Remedial</div>
              )}
            </div>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Menunggu Penilaian
            </Badge>
          )}
        </div>

      </CardContent>
    </Card>
  );
}