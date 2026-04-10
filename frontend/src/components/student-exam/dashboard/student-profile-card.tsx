// LOKASI: src/components/student-exam/dashboard/student-profile-card.tsx
"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUniversalImageUrl } from "@/lib/axios";
import { InfoBoxSmall } from "@/components/ui/info-box-small"; 
import { 
  LayoutGrid, Building2, Terminal, UserCircle, Home, 
  CreditCard, Phone, MapPin, CalendarDays, BookOpen, Users, Fingerprint,
  ChevronDown, ChevronUp
} from "lucide-react";

interface StudentProfileCardProps {
  user: any;
  classNameLabel: string;
  institutionName: string;
}

export function StudentProfileCard({ user, classNameLabel, institutionName }: StudentProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const profile = user?.profile || {};
  const fullName = profile.full_name || user?.username || "Siswa";
  const fallbackText = fullName.substring(0, 2).toUpperCase();
  
  const renderTime = useMemo(() => Date.now(), [user]);
  const rawPhotoUrl = getUniversalImageUrl(profile.image || profile.photo);
  const photoUrl = rawPhotoUrl ? `${rawPhotoUrl}?t=${renderTime}` : undefined;

  // 1. Ekstraksi Data (Dilengkapi Fallback untuk NIK)
  const nisn = profile.nisn || "Belum diisi";
  //  FIX NIK: Menambahkan pengecekan profile.NIK (huruf besar) sebagai pengaman JSON response
  const nik = profile.nik || profile.NIK || "Belum diisi"; 
  const phone = profile.phone_number || "Belum diisi";
  const genderLabel = profile.gender === "L" ? "Laki-Laki" : profile.gender === "P" ? "Perempuan" : "Belum diisi";
  
  const birthPlace = profile.birth_place || "";
  const birthDate = profile.birth_date && !profile.birth_date.startsWith("0001") 
    ? new Date(profile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : "";
  const ttl = birthPlace && birthDate ? `${birthPlace}, ${birthDate}` : birthPlace || birthDate || "Belum diisi";

  const pondokLabel = profile.pondok && profile.pondok !== "none" ? profile.pondok : "Tidak Mukim";
  const asramaKamar = [profile.asrama, profile.kamar ? `Kamar ${profile.kamar}` : ""].filter(Boolean).join(" - ") || "Belum diisi";
  const programLabel = profile.program && profile.program !== "none" 
    ? `${profile.program} ${profile.kelas_program ? `(${profile.kelas_program})` : ""}` 
    : "Tidak Ikut Program";

  const parentsName = [profile.father_name, profile.mother_name].filter(Boolean).join(" & ") || "Belum diisi";
  const guardianPhone = profile.guardian_phone || "Belum diisi";
  
  const addressDetail = [
    profile.address,
    profile.village ? `Ds. ${profile.village}` : "",
    profile.subdistrict ? `Kec. ${profile.subdistrict}` : "",
    profile.regency,
    profile.province,
    profile.postal_code ? `Kode Pos ${profile.postal_code}` : ""
  ].filter(Boolean).join(", ") || "Alamat belum dilengkapi";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full"
    >
      <Card className="bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden flex flex-col relative h-auto">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />

        <CardContent className="p-6 flex-1 flex flex-col relative z-10">
          
          {/* HEADER: IDENTITAS UTAMA */}
          <div className={`flex flex-col items-center text-center transition-all duration-300 ${isExpanded ? 'pb-4 border-b border-slate-100' : 'pb-2'}`}>
            <div className="relative mb-4 group mt-2">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <Avatar className="w-24 h-24 border-4 border-white shadow-xl bg-slate-50 relative z-10">
                <AvatarImage src={photoUrl} alt={fullName} className="object-cover" />
                <AvatarFallback className="bg-emerald-50 text-emerald-700 text-2xl font-black">
                  {fallbackText}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm z-20">
                <UserCircle className="w-4 h-4" />
              </div>
            </div>

            <Badge variant="outline" className="mb-2 bg-emerald-50/50 text-emerald-700 border-emerald-200 font-bold uppercase tracking-widest text-[10px]">
              Kartu Peserta Didik
            </Badge>

            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-tight line-clamp-2 px-2">
              {fullName}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                @{user?.username || "-"}
              </p>
              {user?.is_active === false && (
                <span className="bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.5 rounded-full border border-rose-200 animate-pulse">
                  Belum Verifikasi
                </span>
              )}
            </div>

            <Button 
              variant="ghost" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 w-full rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-100 transition-all duration-300"
            >
              {isExpanded ? (
                <><ChevronUp className="w-4 h-4 mr-2" /> Tutup Detail Profil</>
              ) : (
                <><ChevronDown className="w-4 h-4 mr-2" /> Lihat Detail Profil</>
              )}
            </Button>
          </div>

          {/* KONTEN DETAIL ACCORDION */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex flex-col gap-6 pt-1 pb-2">
                  
                  {/*  SEMUA KOTAK SEKARANG MENGGUNAKAN FLEX-COL PENUH (TIDAK BERSAMPINGAN) */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 border-b border-slate-100 pb-1">Data Akademik</span>
                    <InfoBoxSmall icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-100" label="Institusi Formal" value={institutionName} />
                    <InfoBoxSmall icon={LayoutGrid} iconColor="text-emerald-600" iconBg="bg-emerald-100" label="Kelas / Rombel" value={classNameLabel} />
                    <InfoBoxSmall icon={UserCircle} iconColor="text-emerald-600" iconBg="bg-emerald-100" label="Status Siswa" value={profile.status || "ACTIVE"} />
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 border-b border-slate-100 pb-1">Identitas Pribadi</span>
                    <InfoBoxSmall icon={CreditCard} iconColor="text-indigo-600" iconBg="bg-indigo-100" label="NISN" value={nisn} />
                    <InfoBoxSmall icon={Fingerprint} iconColor="text-indigo-600" iconBg="bg-indigo-100" label="NIK (KTP/KK)" value={nik} />
                    
                    {/* Yang pendek-pendek seperti Gender & Telepon boleh bersampingan */}
                    <div className="grid grid-cols-2 gap-3">
                      <InfoBoxSmall icon={Terminal} iconColor="text-amber-600" iconBg="bg-amber-100" label="Jenis Kelamin" value={genderLabel} />
                      <InfoBoxSmall icon={Phone} iconColor="text-violet-600" iconBg="bg-violet-100" label="Telepon" value={phone} />
                    </div>
                    <InfoBoxSmall icon={CalendarDays} iconColor="text-cyan-600" iconBg="bg-cyan-100" label="Tempat, Tgl Lahir" value={ttl} />
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 border-b border-slate-100 pb-1">Data Kepesantrenan</span>
                    <InfoBoxSmall icon={Home} iconColor="text-rose-600" iconBg="bg-rose-100" label="Pondok Pesantren" value={pondokLabel} />
                    <InfoBoxSmall icon={MapPin} iconColor="text-rose-600" iconBg="bg-rose-100" label="Asrama & Kamar" value={asramaKamar} />
                    <InfoBoxSmall icon={BookOpen} iconColor="text-orange-600" iconBg="bg-orange-100" label="Program Mengaji" value={programLabel} />
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 border-b border-slate-100 pb-1">Keluarga & Domisili</span>
                    <InfoBoxSmall icon={Users} iconColor="text-teal-600" iconBg="bg-teal-100" label="Nama Orang Tua" value={parentsName} />
                    <InfoBoxSmall icon={Phone} iconColor="text-teal-600" iconBg="bg-teal-100" label="Telepon Wali" value={guardianPhone} />
                    <InfoBoxSmall icon={MapPin} iconColor="text-slate-600" iconBg="bg-slate-200" label="Alamat Rumah Lengkap" value={addressDetail} />
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </CardContent>
      </Card>
    </motion.div>
  );
}