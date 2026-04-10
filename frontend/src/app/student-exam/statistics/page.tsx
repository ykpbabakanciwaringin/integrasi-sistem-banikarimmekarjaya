// LOKASI: src/app/student-exam/statistics/page.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StudentExamService } from "@/services/student-exam.service";
import { ArrowLeft, TrendingUp, Target, Award, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudentStatisticsPage() {
  const router = useRouter();

  // Mengambil data riwayat (Otomatis menggunakan Cache jika sudah dibuka sebelumnya)
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["student-exam-history"],
    queryFn: StudentExamService.getHistory,
    refetchOnWindowFocus: false,
  });

  // Kalkulasi Statistik Cerdas di sisi Client (Zero Backend Load)
  const stats = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return { total: 0, average: 0, passed: 0, failed: 0, highest: 0, completionRate: 0 };
    }

    let totalScore = 0;
    let validExams = 0;
    let passed = 0;
    let failed = 0;
    let highest = 0;

    historyData.forEach((exam: any) => {
      if (exam.score !== null && exam.score !== undefined) {
        const score = Number(exam.score);
        const passingGrade = Number(exam.passing_grade || 70);

        totalScore += score;
        validExams += 1;
        
        if (score >= passingGrade) passed += 1;
        else failed += 1;

        if (score > highest) highest = score;
      }
    });

    const average = validExams > 0 ? (totalScore / validExams).toFixed(1) : 0;
    const completionRate = validExams > 0 ? Math.round((passed / validExams) * 100) : 0;

    return { total: validExams, average, passed, failed, highest, completionRate };
  }, [historyData]);

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
          className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-100 hover:text-emerald-600 transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Statistik Akademik</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Pantau perkembangan nilai dan pencapaian ujian Anda.</p>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">Menghitung statistik...</p>
        </div>
      ) : !historyData || historyData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center px-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <AlertCircle className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Belum Ada Data Statistik</h3>
          <p className="text-slate-500 max-w-md">Statistik akan muncul setelah Anda menyelesaikan dan mendapatkan nilai dari ujian.</p>
        </div>
      ) : (
        <motion.div 
          variants={FADE_UP_ANIMATION_VARIANTS}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* WIDGET STATISTIK ATAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatWidget title="Rata-rata Nilai" value={stats.average} icon={<TrendingUp />} color="emerald" desc="Dari seluruh ujian" />
            <StatWidget title="Nilai Tertinggi" value={stats.highest} icon={<Award />} color="blue" desc="Pencapaian terbaik" />
            <StatWidget title="Ujian Diselesaikan" value={stats.total} icon={<BookOpen />} color="purple" desc="Total ujian dinilai" />
            <StatWidget title="Rasio Kelulusan" value={`${stats.completionRate}%`} icon={<Target />} color="orange" desc="Diatas nilai KKM" />
          </div>

          {/* KARTU VISUALISASI KELULUSAN */}
          <Card className="border-slate-200 shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800">Distribusi Kelulusan</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                
                {/* Visual Bar Cincin (Custom CSS) */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                    {/* Progress Circle */}
                    <circle 
                      cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * stats.completionRate) / 100}
                      strokeLinecap="round"
                      className={cn("transition-all duration-1000 ease-out", stats.completionRate >= 70 ? "text-emerald-500" : "text-amber-500")} 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-800">{stats.completionRate}%</span>
                  </div>
                </div>

                {/* Info Detail */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="font-bold text-emerald-800">Lulus (Di atas KKM)</span>
                    </div>
                    <span className="text-lg font-black text-emerald-600">{stats.passed} Ujian</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="font-bold text-rose-800">Remedial (Di bawah KKM)</span>
                    </div>
                    <span className="text-lg font-black text-rose-600">{stats.failed} Ujian</span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </motion.div>
      )}
    </div>
  );
}

// --- SUB KOMPONEN KARTU WIDGET ---
function StatWidget({ title, value, icon, color, desc }: { title: string, value: string | number, icon: any, color: "emerald" | "blue" | "purple" | "orange", desc: string }) {
  const colorMap = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem] bg-white">
      <CardContent className="p-5 flex flex-col items-center text-center justify-center h-full">
        <div className={cn("p-3 rounded-xl mb-3", colorMap[color])}>
          {icon}
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-1">{title}</p>
        <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
      </CardContent>
    </Card>
  );
}