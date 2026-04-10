// LOKASI: src/components/pages/student-exam/execute/rest-blocker.tsx
"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Coffee, Hourglass, Loader2 } from "lucide-react";
import { useStudentExamStore } from "@/stores/use-student-exam-store";

export function RestBlocker() {
  const { restTimeRemaining, decrementRestTime } = useStudentExamStore();

  // Pengendali Hitung Mundur Jeda
  useEffect(() => {
    if (restTimeRemaining <= 0) return;
    const timer = setInterval(() => decrementRestTime(), 1000);
    return () => clearInterval(timer);
  }, [restTimeRemaining, decrementRestTime]);

  // Format waktu ke MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isPreparingNext = restTimeRemaining === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[1000] bg-emerald-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center"
    >
      {/* Dekorasi Visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }}
        className="relative z-10 flex flex-col items-center max-w-xl bg-slate-900 border border-white/10 shadow-2xl shadow-emerald-900/50 rounded-[2.5rem] p-8 md:p-12 overflow-hidden"
      >
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border-[6px] border-emerald-500/20 shadow-inner mb-6">
          <Coffee className="h-10 w-10 text-emerald-400" />
        </div>

        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <Hourglass className="w-4 h-4 animate-spin-slow" />
          Jeda Waktu Istirahat
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
          Mata Pelajaran Selesai
        </h1>
        
        <p className="text-sm text-slate-300 mb-8 leading-relaxed font-medium px-4">
          Bagus sekali! Jawaban Anda telah direkam. Silakan tarik napas sejenak. Mata pelajaran selanjutnya akan otomatis terbuka dalam:
        </p>

        {isPreparingNext ? (
          <div className="flex flex-col items-center justify-center bg-white/5 w-full py-8 rounded-3xl border border-white/10">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
            <p className="text-sm font-bold text-white tracking-widest uppercase">Menyiapkan Paket Soal...</p>
          </div>
        ) : (
          <div className="text-6xl md:text-7xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-lg">
            {formatTime(restTimeRemaining)}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}