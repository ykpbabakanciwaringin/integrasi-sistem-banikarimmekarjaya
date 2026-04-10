"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { LogoHeader } from "@/components/shared/logo-header";
import {
  LogIn,
  DoorOpen,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// 1. Tambahkan daftar lembaga di sini
// Pastikan file gambar logo sudah ada di folder public Anda (misal: public/logos/sd.png)
const daftarLembaga = [
  { id: "mtsnu", name: "MTs NU Assalafie", logo: "/images/logo-mts-nu.png" },
  {
    id: "smpnu",
    name: "SMP NU Assalafie Unggulan",
    logo: "/images/logo-smp-nu.png",
  },
  { id: "manu", name: "MA NU Assalafie", logo: "/images/logo-ma-nu.png" },
  { id: "stainu", name: "STAI NU Assalafie", logo: "/images/logo-stai-nu.png" },
];

function EntryPageContent() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "timeout"
  >("loading");

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setStatus("timeout");
    }, 7000);

    const initSystem = async () => {
      try {
        const needsSetup = await authService.checkSetup({
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (needsSetup) {
          router.replace("/setup");
        } else {
          setStatus("ready");
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") return;
        setStatus("error");
      }
    };

    initSystem();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [router]);

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900">
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-3xl px-4 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div
              key="loader"
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 flex flex-col items-center gap-4 shadow-2xl"
            >
              <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
              <p className="text-emerald-50 font-medium tracking-widest text-xs uppercase">
                Menghubungkan ke Server...
              </p>
            </motion.div>
          )}

          {status === "ready" && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20">
                <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <LogoHeader size="md" />
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Sistem Operasional
                  </div>
                </div>

                <div className="p-8 md:p-12 text-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
                    Portal Akademik Terpadu
                  </h1>
                  <p className="text-slate-500 max-w-lg mx-auto mb-10">
                    Pusat akses Sistem Ujian dan Administrasi lembaga pendidikan
                    di lingkungan Yayasan Kebajikan Pesantren
                  </p>

                  {/* 2. Bagian Logo Lembaga Ditambahkan Di Sini */}
                  <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8">
                    {daftarLembaga.map((lembaga) => (
                      <div
                        key={lembaga.id}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm border border-slate-100 transition-transform hover:scale-105 hover:shadow-md">
                          {/* Pastikan menggunakan tag img standard atau komponen Image dari next/image */}
                          <img
                            src={lembaga.logo}
                            alt={`Logo ${lembaga.name}`}
                            className="w-full h-full object-contain drop-shadow-sm"
                            onError={(e) => {
                              // Fallback jika gambar tidak ditemukan
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/80?text=Logo";
                            }}
                          />
                        </div>
                        <span className="text-xs md:text-sm font-bold text-slate-600">
                          {lembaga.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Akhir Bagian Logo Lembaga */}

                  <Link
                    href="/login"
                    className="inline-block w-full md:w-auto outline-none group"
                  >
                    <div className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-emerald-200 hover:-translate-y-1 hover:shadow-xl">
                      <DoorOpen className="w-5 h-5" />
                      Masuk Portal Akademik
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>

                <div className="bg-slate-50 border-t border-slate-100 px-8 py-5 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    &copy; {new Date().getFullYear()} IT Development Yayasan
                    Kebajikan Pesantren
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {(status === "error" || status === "timeout") && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-auto border-t-4 border-red-500"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                {status === "timeout"
                  ? "Koneksi Terlambat"
                  : "Koneksi Terputus"}
              </h3>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                {status === "timeout"
                  ? "Server terlalu lama merespons. Pastikan koneksi internet Anda stabil."
                  : "Gagal menghubungi server utama. Silakan coba beberapa saat lagi."}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Coba Muat Ulang
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function EntryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 to-teal-900">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
            <p className="text-emerald-400 text-sm animate-pulse">
              Menyiapkan portal...
            </p>
          </div>
        </div>
      }
    >
      <EntryPageContent />
    </Suspense>
  );
}
