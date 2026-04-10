"use client";

import { useEffect, useState, Suspense, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  XCircle,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  Users,
  Calendar,
  Trophy,
  Hash,
  RefreshCcw,
  QrCode,
  Building2,
  Clock,
} from "lucide-react";
import axios from "axios";

// --- INTERFACES ---
interface Institution {
  name: string;
  logo_url: string;
  header_1: string;
  header_2: string;
  address_detail: string;
  address_city: string;
  contact_phone: string;
  website: string;
}

interface SessionData {
  id: string;
  title: string;
  subject_list: string;
  token: string;
  start_time: string;
  end_time: string;
  institution?: Institution;
}

interface ResultData {
  student_id: string;
  student_name: string;
  class_name: string;
  username: string;
  final_score: number;
  status: string;
}

// --- KOMPONEN KOTAK DATA (GRID 2 KOLOM) ---
const GridInfoField = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex flex-col gap-1 w-full text-left mb-3">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1 truncate">
      {label}
    </span>
    <div className="flex items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
      <div className="text-emerald-600/70 shrink-0">{icon}</div>
      <span className="text-[12px] font-bold text-slate-800 w-full truncate">
        {value}
      </span>
    </div>
  </div>
);

// --- KOMPONEN KOTAK DATA (1 KOLOM PENUH) ---
const InfoField = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex flex-col gap-1 w-full text-left mb-3">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">
      {label}
    </span>
    <div className="flex items-center gap-3 bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
      <div className="text-emerald-600/70 shrink-0">{icon}</div>
      <span className="text-[13px] font-bold text-slate-800 w-full truncate">
        {value}
      </span>
    </div>
  </div>
);

function VerificationResultContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [status, setStatus] = useState<"loading" | "valid" | "error">("loading");
  const [session, setSession] = useState<SessionData | null>(null);
  const [results, setResults] = useState<ResultData[]>([]);

  // Helper untuk gambar Logo Dinamis
  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:image")) return path;

    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    baseUrl = baseUrl.replace(/\/api\/v1\/?$/, ""); // Hapus suffix api jika ada
    if (!baseUrl) {
      baseUrl = typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8080`
        : "http://localhost:8080";
    }
    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const verifyData = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setStatus("loading");
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const [sessionRes, resultsRes] = await Promise.all([
        axios.get(`${baseURL}/public/verify/sessions/${sessionId}`),
        axios.get(`${baseURL}/public/verify/sessions/${sessionId}/results`),
      ]);

      if (sessionRes.data && sessionRes.data.data) {
        setSession(sessionRes.data.data);
        setResults(resultsRes.data?.data || []);
        setTimeout(() => setStatus("valid"), 600); // Transisi halus
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Gagal memverifikasi:", err);
      setTimeout(() => setStatus("error"), 600);
    }
  }, [sessionId]);

  useEffect(() => {
    verifyData();
  }, [verifyData]);

  // Kalkulasi statistik presisi
  const stats = useMemo(() => {
    if (!results.length) return { avg: "0", total: 0, hadir: 0 };
    const valid = results.filter((r) => r.status === "FINISHED" || r.status === "WORKING");
    const sum = valid.reduce((acc, curr) => acc + (curr.final_score || 0), 0);
    return {
      avg: valid.length ? (sum / valid.length).toFixed(1) : "0",
      total: results.length,
      hadir: valid.length
    };
  }, [results]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      });
    } catch { return "-"; }
  };

  const formatTime = (start?: string, end?: string) => {
    if (!start || !end) return "-";
    try {
      const s = new Date(start).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const e = new Date(end).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      return `${s} - ${e} WIB`;
    } catch { return "-"; }
  };

  const inst = session?.institution;
  const logoSrc = getImageUrl(inst?.logo_url);
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 py-10 px-4 font-sans">
      {/* Background Ornamen */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-[480px]">
        <AnimatePresence mode="wait">
          {/* --- STATE: LOADING --- */}
          {status === "loading" && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl p-10 flex flex-col items-center justify-center gap-4 border border-white/20"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                <div className="relative bg-white p-4 rounded-full border-2 border-emerald-100 shadow-lg">
                  <QrCode className="w-10 h-10 text-[#043425]" />
                </div>
              </div>
              <h3 className="font-bold text-slate-800 animate-pulse uppercase tracking-widest text-sm mt-2">
                Memverifikasi Dokumen...
              </h3>
            </motion.div>
          )}

          {/* --- STATE: SUCCESS (DATA VALID) --- */}
          {status === "valid" && session && (
            <motion.div
              key="valid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-[#f8fcfb] rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20 relative flex flex-col items-center pb-2 w-full"
            >
              {/* Header Melengkung Khas Sertifikat - Ketinggian Diperbesar Menjadi 350px */}
              <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-b from-[#043425] to-[#065f46] rounded-b-[40%] scale-x-[1.25] origin-top shadow-md z-0"></div>

              {/* KOP Surat Dinamis */}
              <div className="relative z-10 w-full flex flex-col items-center pt-6 px-4 text-center text-white shrink-0">
                <div className="w-14 h-14 mb-2 relative">
                  <img
                    src="/images/logo-ykp.png"
                    alt="Logo Yayasan"
                    className="w-full h-full object-contain drop-shadow-md relative z-10"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                      (e.currentTarget.nextElementSibling as HTMLElement).classList.remove("hidden");
                    }}
                  />
                  <ShieldCheck className="w-full h-full text-emerald-300 hidden absolute inset-0 z-0" />
                </div>

                <h1 className="text-[14px] font-black tracking-wider uppercase leading-tight drop-shadow-sm">
                  YAYASAN KEBAJIKAN PESANTREN
                </h1>
                <p className="text-[8px] font-bold mt-1 uppercase text-emerald-100 tracking-widest drop-shadow-sm">
                  SK KEMENKUMHAM : AHU-0000028.AH.01.05. TAHUN 2023
                </p>
                <p className="text-[7px] font-medium mt-1 text-emerald-50/80 tracking-wide leading-snug px-4">
                  Jl. Gondang Manis No. 52 RT 002 RW 002 Ds. Babakan Kec.
                  Ciwaringin Kab. Cirebon
                  <br />
                  Jawa Barat Kode Pos 45167 Telp. / WA : 082 260 246 434
                  <br />
                  Email : banikarimmekarjaya@gmail.com
                </p>
              </div>

              {/* Box Putih Utama - Margin Top Diperbesar agar tidak menabrak teks */}
              <div className="relative z-20 w-full px-5 flex flex-col items-center mt-6">
                
                <div className="bg-white w-full rounded-2xl shadow-xl border border-slate-100 p-5 pt-8 relative overflow-hidden">
                   {/* Watermark */}
                   <ShieldCheck className="absolute -right-8 -bottom-8 w-40 h-40 text-emerald-50 opacity-50 -rotate-12 pointer-events-none" />
                   
                   {/* Badge Validasi - Tergantung rapi di border atas kotak */}
                   <div className="absolute top-0 left-0 w-full flex justify-center">
                     <div className="bg-emerald-600 text-white flex items-center gap-1.5 px-4 py-1.5 rounded-b-xl shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black tracking-widest uppercase">
                          DOKUMEN RESMI & VALID
                        </span>
                     </div>
                   </div>

                   <h2 className="text-[16px] font-black text-[#043425] text-center uppercase tracking-wide leading-tight mt-2 mb-5">
                     {session.title}
                   </h2>

                   <div className="mt-1 relative z-10">
                      <InfoField label="Lembaga Penyelenggara" value={inst?.name || "YAYASAN KEBAJIKAN PESANTREN"} icon={<Building2 className="w-[17px] h-[17px]" />} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-x-3 w-full relative z-10">
                      <GridInfoField label="Mata Pelajaran" value={session.subject_list || "-"} icon={<BookOpen className="w-[15px] h-[15px]" />} />
                      <GridInfoField label="Tanggal Ujian" value={formatDate(session.start_time)} icon={<Calendar className="w-[15px] h-[15px]" />} />
                      <GridInfoField label="Waktu Pelaksanaan" value={formatTime(session.start_time, session.end_time)} icon={<Clock className="w-[15px] h-[15px]" />} />
                      <GridInfoField label="Kehadiran" value={`${stats.hadir} dari ${stats.total} Siswa`} icon={<Users className="w-[15px] h-[15px]" />} />
                   </div>
                </div>

                {/* Preview Nilai */}
                <div className="w-full mt-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                      Rata-Rata Nilai Sesi:
                    </span>
                    <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded text-[12px] font-black shadow-sm">
                      {stats.avg}
                    </span>
                  </div>

                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
                    Sampel Nilai Teratas (Validasi Keaslian)
                  </span>
                  
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm max-h-[190px] overflow-y-auto custom-scrollbar">
                    {results
                      .filter((r) => r.status === "FINISHED")
                      .sort((a, b) => b.final_score - a.final_score)
                      .slice(0, 5)
                      .map((r, idx) => (
                      <div key={r.student_id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[11px] font-black text-slate-300 w-4">{idx + 1}.</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-800 uppercase truncate">
                              {r.student_name}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold tracking-tight">
                              {r.class_name || "UMUM"} • {r.username}
                            </p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 shadow-sm shrink-0">
                          <span className="text-emerald-700 font-black text-[12px]">
                            {r.final_score}
                          </span>
                        </div>
                      </div>
                    ))}
                    {stats.hadir === 0 && (
                      <div className="p-5 text-center text-[11px] font-semibold text-slate-400">
                        Belum ada peserta yang mengumpulkan nilai.
                      </div>
                    )}
                  </div>
                  <p className="text-[8px] text-center text-slate-400 mt-2.5 italic font-medium leading-tight px-2">
                    * Data nilai teratas ini diambil secara realtime dari Server Pangkalan Data CBT Yayasan Kebajikan Pesantren.
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#043425] via-[#065f46] to-[#043425]"></div>
            </motion.div>
          )}

          {/* --- STATE: ERROR (DATA TIDAK VALID) --- */}
          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20"
            >
              <div className="bg-rose-50 border-b border-rose-100 px-8 py-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border border-rose-100 rounded-full shadow-sm flex items-center justify-center mb-4 relative">
                  <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping" />
                  <XCircle className="w-8 h-8 text-rose-500 relative z-10" />
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-2">
                  Dokumen Tidak Valid
                </h2>
                <p className="text-slate-500 text-[13px] leading-relaxed mb-6 font-medium">
                  ID Sesi Ujian tidak ditemukan di dalam pangkalan data kami.
                  Pastikan dokumen yang Anda pindai adalah resmi dan bukan hasil rekayasa.
                </p>
                <button
                  onClick={verifyData}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  <RefreshCcw size={14} />
                  Pindai Ulang Server
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Link */}
        <div className="mt-8 text-center pb-8">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-emerald-200/60 hover:text-white text-[11px] font-bold flex items-center justify-center gap-2 mx-auto transition-colors outline-none tracking-widest uppercase"
          >
            ← Kembali ke Portal Utama
          </button>
        </div>
      </div>
    </main>
  );
}

export default function VerificationResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-teal-900 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <VerificationResultContent />
    </Suspense>
  );
}