"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";

interface TokenEntryCardProps {
  onStartExam: (token: string) => Promise<void>;
}

export function TokenEntryCard({ onStartExam }: TokenEntryCardProps) {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 6) return;
    
    setIsLoading(true);
    try {
      const finalToken = token.toUpperCase();
      
      // Memanggil fungsi eksekusi dari komponen induk
      await onStartExam(finalToken);
      
      // [PEMBARUAN FASE 6]: Menyimpan token ujian ke memori lokal peramban.
      // Ini sangat krusial agar sistem dapat memuat mata pelajaran selanjutnya
      // secara otomatis setelah waktu jeda istirahat 2 menit berakhir.
      localStorage.setItem("active_exam_token", finalToken);
      
    } catch (error) {
      // Kesalahan (error) biasanya sudah ditangani oleh fungsi onStartExam melalui toast
      console.error("Gagal memvalidasi token ujian:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/30 shadow-2xl shadow-emerald-900/20 rounded-[2rem] overflow-hidden relative">
        {/* Ornamen Dekoratif */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <CardContent className="p-6 md:p-8 relative z-10 flex flex-col items-center text-center">
          <Badge className="bg-emerald-950/40 text-emerald-100 hover:bg-emerald-950/50 border border-emerald-400/30 mb-4 px-4 py-1.5 backdrop-blur-md rounded-full shadow-inner">
            <KeyRound className="w-3.5 h-3.5 mr-2 text-emerald-300" />
            Sesi Ujian Aman
          </Badge>
          
          <h2 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight">
            Masukkan Token Ujian
          </h2>
          <p className="text-sm text-emerald-100/90 mb-6 max-w-sm font-medium leading-relaxed">
            Dapatkan 6 digit kode token dari pengawas ruangan Anda untuk memulai sesi.
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4 relative">
            <div className="flex flex-col gap-2 text-left relative z-10">
              <label className="text-[10px] font-black text-emerald-200 uppercase tracking-widest ml-1 drop-shadow-sm">
                KODE TOKEN UJIAN
              </label>
              <Input
                type="text"
                placeholder="Ketik di sini..."
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                className="h-16 bg-white/95 border-0 text-center font-mono font-black text-3xl md:text-4xl tracking-[0.25em] text-slate-800 placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal placeholder:font-semibold placeholder:text-base rounded-2xl focus-visible:ring-4 focus-visible:ring-emerald-300/50 shadow-inner uppercase transition-all"
                maxLength={6}
                disabled={isLoading}
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || token.length < 6}
              className="h-14 w-full mt-2 bg-white hover:bg-emerald-50 text-emerald-700 font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95 text-xs group border-0 disabled:opacity-70 disabled:active:scale-100 relative z-10 overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2.5 group-hover:translate-x-1 transition-transform text-emerald-500" /> 
                  Masuk Ujian
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}