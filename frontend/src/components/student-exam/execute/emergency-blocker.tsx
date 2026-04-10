"use client";

import React from "react";
import { motion } from "framer-motion";
import { PauseCircle, ServerCrash } from "lucide-react";

export function EmergencyBlocker() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[1000] bg-slate-50/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/50 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }}
        className="relative z-10 flex flex-col items-center max-w-xl bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 md:p-12"
      >
        <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center border-[6px] border-amber-100 shadow-inner mb-6">
          <PauseCircle className="h-12 w-12 text-amber-500 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <ServerCrash className="w-3.5 h-3.5" />
          Modul Darurat Aktif
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tight">
          Ujian Dijeda Sementara
        </h1>
        
        <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
          Sistem mendeteksi kendala teknis atau pengawas telah menjeda sesi Anda. 
          <strong className="text-emerald-700 block mt-2">Jawaban Anda sudah aman tersimpan.</strong>
        </p>

        <div className="flex items-center justify-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          Menunggu Instruksi Server...
        </div>
      </motion.div>
    </motion.div>
  );
}