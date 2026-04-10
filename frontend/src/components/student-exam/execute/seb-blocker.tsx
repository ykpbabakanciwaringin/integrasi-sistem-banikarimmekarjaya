"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudentExamStore } from "@/stores/use-student-exam-store";

export function SEBBlocker() {
  const { clearExam } = useStudentExamStore();

  const handleBackToDashboard = () => {
    // 1. Bersihkan memori ujian di state agar tidak tersangkut
    clearExam();
    
    // 2.  FIX: Gunakan Hard Reload untuk memastikan status error SEB bersih sepenuhnya
    // dan mengembalikan layar ke Dasbor asli.
    window.location.href = "/student-exam"; 
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[999] bg-slate-50/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
    >
      {/* Dekorasi Glassmorphism */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }}
        className="relative z-10 flex flex-col items-center max-w-xl bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 md:p-12"
      >
        <div className="w-20 h-20 rounded-[1.5rem] bg-rose-50 flex items-center justify-center border border-rose-100 shadow-inner mb-6 relative">
          <ShieldAlert className="h-10 w-10 text-rose-500" />
          <div className="absolute -bottom-2 -right-2 bg-white text-rose-500 p-1.5 rounded-full border border-slate-100 shadow-sm">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
          <AlertTriangle className="w-4 h-4" />
          Mode Ujian Tidak Aman
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tight">
          Akses Browser Ditolak
        </h1>
        
        <div className="bg-slate-50 text-slate-600 p-5 rounded-2xl border border-slate-100 mb-8 text-sm leading-relaxed font-medium">
          Sesi ujian ini <span className="font-bold text-emerald-700">mewajibkan penggunaan Safe Exam Browser (SEB)</span>. 
          Anda terdeteksi menggunakan peramban (browser) biasa. Silakan keluar dan gunakan aplikasi resmi.
        </div>

        <Button 
          onClick={handleBackToDashboard}
          className="h-14 px-10 w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 mr-3" />
          Kembali ke Dasbor
        </Button>
      </motion.div>
    </motion.div>
  );
}