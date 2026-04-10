"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, CheckCircle2, Database, Loader2, Send } from "lucide-react";
import { useStudentExamStore } from "@/stores/use-student-exam-store";
import { dbProvider } from "@/lib/db";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface QuestionNavigatorProps {
  questions: any[];
  answers: Record<string, string>;
  doubtfulAnswers: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onFinishClick: () => void;
}

export const QuestionNavigator = ({
  questions,
  answers,
  doubtfulAnswers,
  currentIndex,
  onNavigate,
  onFinishClick,
}: QuestionNavigatorProps) => {
  const { isOnline, syncAnswers } = useStudentExamStore();
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isForcingSync, setIsForcingSync] = useState(false);

  // Monitor antrean jawaban
  useEffect(() => {
    const checkSync = async () => {
      const unsynced = await dbProvider.getUnsyncedAnswers();
      setUnsyncedCount(unsynced.length);
    };
    checkSync();
    const interval = setInterval(checkSync, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFinishAttempt = async () => {
    if (unsyncedCount > 0) {
      setIsForcingSync(true);
      const toastId = toast.loading("Menyinkronkan sisa jawaban ke server...");

      try {
        await syncAnswers();
        const remaining = await dbProvider.getUnsyncedAnswers();

        if (remaining.length > 0) {
          toast.error("Gagal menyinkronkan jawaban. Pastikan koneksi stabil.", { id: toastId });
          setIsForcingSync(false);
          return;
        }

        toast.success("Seluruh jawaban tersinkronisasi!", { id: toastId });
      } catch (error) {
        toast.error("Terjadi kesalahan jaringan.", { id: toastId });
        setIsForcingSync(false);
        return;
      }
      setIsForcingSync(false);
    }
    onFinishClick();
  };

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-xl border border-slate-100/50 shadow-2xl rounded-[2rem] p-5 md:p-6 relative overflow-hidden">
      
      {/* Header Navigator */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner shrink-0">
          <LayoutGrid className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg tracking-tight leading-none mb-1">
            Navigasi Soal
          </h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Peta Pengerjaan Anda
          </span>
        </div>
      </div>

      {/* Grid Nomor Soal */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 -mx-2 px-2">
        <div className="grid grid-cols-5 gap-2.5">
          {questions.map((q, i) => {
            const hasAnswer = !!answers[q.id];
            const isDoubtful = doubtfulAnswers.includes(q.id);
            const isActive = currentIndex === i;

            return (
              <Button
                key={q.id}
                onClick={() => onNavigate(i)}
                variant="outline"
                className={cn(
                  "relative h-11 w-full rounded-xl font-black text-sm transition-all duration-300 border-2 p-0",
                  isActive ? "ring-4 ring-emerald-500/20 scale-110 z-10 shadow-lg" : "hover:scale-105 hover:shadow-md",
                  isDoubtful
                    ? "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200"
                    : hasAnswer
                      ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                )}
              >
                {i + 1}
                {hasAnswer && !isDoubtful && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-950 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Panel Bawah & Tombol Selesai */}
      <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 relative z-10">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
            <span className="text-slate-400">Status Server</span>
            <span className={isOnline ? "text-emerald-600" : "text-rose-600"}>
              {isOnline ? "Terhubung" : "Terputus"}
            </span>
          </div>
          {unsyncedCount > 0 && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-2.5 rounded-xl border border-amber-200 animate-pulse">
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-bold leading-tight">
                {unsyncedCount} Antrean Sinkronisasi
              </span>
            </div>
          )}
        </div>

        <Button
          onClick={handleFinishAttempt}
          disabled={isForcingSync || (!isOnline && unsyncedCount > 0)}
          className={cn(
            "w-full h-14 rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-lg border-0",
            (!isOnline && unsyncedCount > 0)
              ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95"
          )}
        >
          {isForcingSync ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> MENYINKRONKAN...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> SELESAI UJIAN</>
          )}
        </Button>
      </div>
    </div>
  );
};