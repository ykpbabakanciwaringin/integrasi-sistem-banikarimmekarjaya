"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  User,
  CreditCard,
  Building2,
  Users,
  Clock,
  Home,
  BookOpen,
  Calendar,
} from "lucide-react";
import { API_URL, apiClient } from "@/lib/axios";

// --- KOMPONEN KOTAK DATA LENGKAP (1 KOLOM PENUH) ---
const InfoField = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex flex-col gap-1 w-full text-left mb-2.5">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">
      {label}
    </span>
    <div className="flex items-center gap-3 bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
      <div className="text-emerald-600/70">{icon}</div>
      <span className="text-[13px] font-bold text-slate-800 w-full truncate">
        {value}
      </span>
    </div>
  </div>
);

// --- KOMPONEN KOTAK DATA GRID (2 KOLOM SEJAJAR) ---
const GridInfoField = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex flex-col gap-1 w-full text-left mb-2.5">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1 truncate">
      {label}
    </span>
    <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
      <div className="text-emerald-600/70 shrink-0">{icon}</div>
      <span className="text-[12px] font-bold text-slate-800 w-full truncate">
        {value}
      </span>
    </div>
  </div>
);

function VerificationContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "error">("loading");
  const [personData, setPersonData] = useState<any | null>(null);
  const [role, setRole] = useState<"TEACHER" | "STUDENT" | null>(null);

  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:image")) return path;

    let baseUrl = API_URL ? API_URL.replace(/\/api\/v1\/?$/, "") : "";
    if (!baseUrl || baseUrl === "") {
      baseUrl = typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:8080`
          : "http://localhost:8080";
    }
    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const getInstName = (item: any) => {
    if (!item) return "-";
    if (item.role === "SUPER_ADMIN") return "PUSAT / GLOBAL";
    if (item.enrollments && item.enrollments.length > 0) {
      const names = item.enrollments
        .map((en: any) => en.institution?.name)
        .filter((name: string, index: number, self: string[]) => name && self.indexOf(name) === index);
      if (names.length > 0) return names.join(", ");
    }
    if (item.institution?.name) return item.institution.name;
    return "Belum Terdaftar";
  };

  const formatTTL = (place?: string, date?: string) => {
    let dateStr = "-";
    if (date && !date.startsWith("0001") && date !== "1/1/1") {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
      }
    }
    return `${place || "-"}, ${dateStr}`;
  };

  useEffect(() => {
    const verifyId = async () => {
      if (!id) {
        setStatus("invalid");
        return;
      }

      try {
        // 1. Coba Cari di Data Guru Dulu
        try {
          const resTeacher = await apiClient.get(`/public/verify/teacher/${id}`);
          if (resTeacher.data && resTeacher.data.data) {
            setPersonData(resTeacher.data.data);
            setRole("TEACHER");
            setTimeout(() => setStatus("valid"), 600);
            return;
          }
        } catch (err) {
          // Abaikan error (bukan guru), lanjut cari ke data siswa
        }

        // 2. Jika bukan guru, Coba Cari di Data Siswa
        const resStudent = await apiClient.get(`/public/verify/student/${id}`);
        if (resStudent.data && resStudent.data.data) {
          setPersonData(resStudent.data.data);
          setRole("STUDENT");
          setTimeout(() => setStatus("valid"), 600);
          return;
        }

        // 3. Jika tidak ketemu di keduanya
        throw new Error("Data tidak ditemukan di database manapun");
      } catch (error) {
        console.error("Verification error:", error);
        setTimeout(() => setStatus("invalid"), 600);
      }
    };

    verifyId();
  }, [id]);

  const pData = personData || {};
  const profile = pData.profile || {};

  const photoSrc = getImageUrl(profile.image);
  const nama = profile.full_name || pData.full_name || "-";

  const today = new Date();
  const printDate = today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  let genderLabel = "-";
  if (profile.gender === "L") genderLabel = "Laki-laki";
  if (profile.gender === "P") genderLabel = "Perempuan";

  // --- LOGIKA STATUS ADAPTIF (GURU / SISWA) ---
  const isAccountActive = pData.is_active !== false;
  const isPersonActive = !profile.status || profile.status.toUpperCase() === "ACTIVE";

  let statusConfig = {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    text: role === "TEACHER" ? "Tenaga Pendidik Aktif" : "Siswa Aktif Resmi",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-100",
    textClass: "text-emerald-700",
  };

  if (!isAccountActive) {
    statusConfig = {
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      text: "Menunggu Verifikasi Sistem",
      bgClass: "bg-rose-50",
      borderClass: "border-rose-100",
      textClass: "text-rose-700",
    };
  } else if (!isPersonActive) {
    statusConfig = {
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      text: role === "TEACHER" ? "Status Non-Aktif / Cuti" : "Status Non-Aktif / Lulus",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-100",
      textClass: "text-amber-700",
    };
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 py-10 px-4 font-sans">
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-[480px]">
        <AnimatePresence mode="wait">
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
              <div className="text-center space-y-1 mt-2">
                <h3 className="font-bold text-slate-800 animate-pulse">
                  Memverifikasi Data...
                </h3>
              </div>
            </motion.div>
          )}

          {status === "valid" && personData && (
            <motion.div
              key="valid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-[#f8fcfb] rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20 relative flex flex-col items-center pb-2"
            >
              {/* Desain Header Sama Persis Dengan Cetak Kartu Fisik */}
              <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b from-[#043425] to-[#065f46] rounded-b-[40%] scale-x-[1.25] origin-top shadow-md z-0"></div>

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
                  Email : ykpbabakanciwaringin@gmail.com
                </p>
              </div>

              {/* Foto Profil */}
              <div className="relative z-20 w-28 h-36 mt-3 rounded-xl bg-slate-200 border-[4px] border-white shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                {photoSrc ? (
                  <img src={photoSrc} alt={nama} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 font-bold tracking-widest text-sm">3x4</span>
                )}
              </div>

              <div className="relative z-10 text-center w-full px-6 flex flex-col items-center mt-3 pb-2">
                <h2 className="text-[19px] font-black text-[#043425] uppercase tracking-wide leading-tight mb-2 line-clamp-2 px-2">
                  {nama}
                </h2>
                
                {/* Badge Status Adaptif */}
                <div className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full border shadow-sm mb-4 ${statusConfig.bgClass} ${statusConfig.borderClass}`}>
                  {statusConfig.icon}
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${statusConfig.textClass}`}>
                    {statusConfig.text}
                  </span>
                </div>

                <span className="bg-[#047857] text-white border border-[#064e3b] shadow-md px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-3">
                  {role === "TEACHER" ? "IDENTITAS PENDIDIK" : "KARTU TANDA SISWA"}
                </span>

                <div className="w-full mt-1 border-t-2 border-b-2 border-emerald-100/50 py-3">
                  {role === "TEACHER" ? (
                    <>
                      <div className="grid grid-cols-2 gap-x-3 w-full">
                        <GridInfoField label="NIP / NIY" value={profile.n_ip || profile.nip || "-"} icon={<CreditCard className="w-[14px] h-[14px]" />} />
                        <GridInfoField label="NIK KTP" value={profile.nik || "-"} icon={<CreditCard className="w-[14px] h-[14px]" />} />
                        <GridInfoField label="Jenis Kelamin" value={genderLabel} icon={<Users className="w-[14px] h-[14px]" />} />
                        <GridInfoField label="Tanggal Lahir" value={formatTTL(profile.birth_place, profile.birth_date)} icon={<Calendar className="w-[14px] h-[14px]" />} />
                      </div>
                      <InfoField label="Tugas / Jabatan" value={profile.position || "Tenaga Pendidik"} icon={<User className="w-[18px] h-[18px]" />} />
                      <InfoField label="Lembaga Pendidikan" value={getInstName(personData)} icon={<Building2 className="w-[18px] h-[18px]" />} />
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-x-3 w-full">
                        <GridInfoField label="NISN / NIK" value={profile.nisn || profile.nik || "-"} icon={<CreditCard className="w-[14px] h-[14px]" />} />
                        <GridInfoField label="Jenis Kelamin" value={genderLabel} icon={<Users className="w-[14px] h-[14px]" />} />
                        <GridInfoField label="Kelas Formal" value={profile.class?.name || "Tanpa Kelas"} icon={<Users className="w-[14px] h-[14px]" />} />
                        <GridInfoField label="Tanggal Lahir" value={formatTTL(profile.birth_place, profile.birth_date)} icon={<Calendar className="w-[14px] h-[14px]" />} />
                      </div>
                      <InfoField label="Lembaga Formal" value={getInstName(personData)} icon={<Building2 className="w-[18px] h-[18px]" />} />
                      <InfoField
                        label="Pondok / Asrama"
                        value={profile.pondok && profile.pondok !== "TIDAK MUKIM" ? `${profile.pondok} ${profile.asrama ? `(${profile.asrama})` : ""} ${profile.kamar ? `- Kamar ${profile.kamar}` : ""}` : "Tidak Mukim"}
                        icon={<Home className="w-[18px] h-[18px]" />}
                      />
                      <InfoField
                        label="Program Diniyah"
                        value={profile.program && profile.program !== "TIDAK MUKIM" ? `${profile.program} ${profile.kelas_program ? `(${profile.kelas_program})` : ""}` : "Tidak Ada / Tidak Mukim"}
                        icon={<BookOpen className="w-[18px] h-[18px]" />}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="w-full flex justify-end items-end px-6 pb-6 pt-2 relative z-10 shrink-0">
                <div className="flex flex-col items-center text-center">
                  <p className="text-[9px] font-bold text-slate-600">
                    Cirebon, {printDate}
                  </p>
                  <p className="text-[9px] font-bold text-slate-600">
                    Ketua Yayasan,
                  </p>

                  <div className="h-[65px] w-[130px] relative -mb-2">
                    <img
                      src="/images/stempel-ykp.png"
                      alt="Stempel"
                      className="absolute -left-12 -top-8 w-[100px] h-[100px] object-contain mix-blend-multiply opacity-85 z-0 -rotate-12"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />

                    <img
                      src="/images/ttd-ketua-yayasan.png"
                      alt="Tanda Tangan"
                      className="absolute right-0 -top-1 w-[130px] h-[80px] object-contain mix-blend-multiply drop-shadow-sm z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement).classList.remove("hidden");
                      }}
                    />

                    <span className="font-[Signature] text-xl text-[#043425] opacity-80 italic hidden absolute right-2 top-4 z-10">
                      Arwani
                    </span>
                  </div>

                  <p className="text-[10px] font-black text-[#043425] border-b border-[#043425] pb-0.5 inline-block relative z-20">
                    Dr. KH. Arwani Syaerozi, Lc, MA.
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#043425] via-[#065f46] to-[#043425]"></div>
            </motion.div>
          )}

          {(status === "invalid" || status === "error") && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20"
            >
              <div className="bg-rose-50 border-b border-rose-100 px-8 py-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border border-rose-100 rounded-full shadow-sm flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-2">
                  Data Tidak Valid
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Data kartu tidak ditemukan di dalam sistem akademik kami.
                  Pastikan barcode yang dipindai adalah resmi dan dikeluarkan oleh Yayasan.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-emerald-200/60 hover:text-white text-xs font-medium flex items-center justify-center gap-2 mx-auto transition-colors outline-none focus:text-white"
          >
            ← Kembali ke Portal Utama
          </button>
        </div>
      </div>
    </main>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 to-teal-900">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
            <p className="text-emerald-400 text-sm animate-pulse tracking-widest uppercase">
              Memuat...
            </p>
          </div>
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}