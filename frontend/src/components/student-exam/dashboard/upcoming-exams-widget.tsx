"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarX2, CalendarDays, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface UpcomingExamsWidgetProps {
  exams?: any[]; // Nanti bisa disesuaikan dengan tipe data ujian dari backend Anda
}

export function UpcomingExamsWidget({ exams = [] }: UpcomingExamsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full mt-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          Jadwal Ujian Terdekat
        </h3>
      </div>

      <Card className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-[1.5rem] shadow-sm overflow-hidden">
        <CardContent className="p-5 flex flex-col items-center justify-center text-center min-h-[120px]">
          {exams.length > 0 ? (
            // Jika ada data ujian real-time, render di sini nantinya
            <div className="w-full flex flex-col gap-3">
              {exams.map((exam, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800">{exam.name || "Ujian Akademik"}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{exam.subject || "Mata Pelajaran"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3" />
                    {exam.time || "Segera"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Tampilan kosong jika tidak ada jadwal
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2 shadow-inner">
                <CalendarX2 className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-500">Belum ada jadwal hari ini</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Silakan tunggu arahan dari pengawas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}