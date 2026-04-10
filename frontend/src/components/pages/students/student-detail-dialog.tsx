// LOKASI: src/components/pages/students/student-detail-dialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, UserCircle, Phone, Lock, BookOpen, Users, MapPin, CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { User } from "@/types/user";
import { getUniversalImageUrl } from "@/lib/axios";

interface StudentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: User | null;
  institutionName: string;
  formatDate: (date?: string) => string;
  onVerify?: (id: string) => void;
  isVerifying?: boolean;
}

export function StudentDetailDialog({ 
  open, onOpenChange, student, institutionName, formatDate, onVerify, isVerifying = false 
}: StudentDetailDialogProps) {
  if (!student) return null;

  const avatarUrl = getUniversalImageUrl(student.profile?.image);
  const initials = (student.profile?.full_name || student.username || "S").substring(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[750px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <VisuallyHidden.Root><DialogTitle>Detail Siswa</DialogTitle></VisuallyHidden.Root>

        {/* HEADER MEWAH DENGAN EFEK CAHAYA (GLOWING) */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-[#043425] to-[#065f46] p-8 text-white shrink-0">
          <div className="absolute -right-4 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5">
            <Avatar className="h-20 w-20 border-4 border-white/20 bg-white shadow-xl">
              <AvatarImage src={avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="font-bold text-2xl text-emerald-800">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left space-y-2 flex-1">
              <DialogTitle className="text-2xl font-black tracking-tight text-white flex flex-col md:flex-row items-center md:items-center gap-2">
                {student.profile?.full_name || student.username}
                {student.is_active && (
                  <CheckCircle className="h-5 w-5 text-emerald-400 drop-shadow-sm" />
                )}
              </DialogTitle>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                {student.is_active ? (
                  <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 border border-emerald-400/30 shadow-none font-semibold">
                    Siswa Aktif
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 shadow-none font-semibold animate-pulse">
                    Menunggu Verifikasi
                  </Badge>
                )}
                <span className="text-xs text-emerald-100/70 font-mono bg-black/10 px-2 py-0.5 rounded border border-white/5">
                  NISN: {student.profile?.nisn || "-"}
                </span>
              </div>
            </div>

            {/* Tombol Verifikasi Instan di Header */}
            {!student.is_active && onVerify && (
              <div className="mt-4 md:mt-0">
                 <Button 
                    onClick={() => onVerify(student.id)}
                    disabled={isVerifying}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg border-none"
                 >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    Verifikasi Siswa
                 </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/80 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* SECTION 1: IDENTITAS & KREDENSIAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-slate-400" /> Identitas Diri
              </h4>
              <InfoRow label="Jenis Kelamin" value={student.profile?.gender === "L" ? "Laki-laki" : "Perempuan"} />
              <InfoRow label="NIK (KTP/KK)" value={student.profile?.nik || "-"} />
              <InfoRow label="Tempat, Tanggal Lahir" value={`${student.profile?.birth_place || "-"}, ${formatDate(student.profile?.birth_date)}`} />
              <InfoRow label="WhatsApp" value={student.profile?.phone_number || "-"} />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" /> Kredensial Akun
              </h4>
              <InfoRow label="Username Login" value={`@${student.username}`} valueClass="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit" />
              {/*  FITUR: Menampilkan Plain Password jika ada (Memudahkan Admin) */}
              {(student as any).plain_password && (
                <InfoRow label="Password Sementara" value={(student as any).plain_password} valueClass="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded w-fit" />
              )}
              <InfoRow label="Terdaftar Pada" value={formatDate(student.created_at)} />
            </div>
          </div>

          {/* SECTION 2: AKADEMIK & PESANTREN */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" /> Akademik & Pesantren
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5"/> Lembaga Formal</span>
                    <span className="font-bold text-emerald-700 text-sm truncate">{institutionName}</span>
                 </div>
                 <InfoRow label="Kelas / Rombel" value={student.profile?.class?.name || "Belum Ditentukan"} />
                 <InfoRow label="Status Siswa" value={student.profile?.status || "ACTIVE"} />
                 <InfoRow label="Program Mengaji" value={`${student.profile?.program || "TIDAK IKUT PROGRAM"} ${student.profile?.kelas_program ? `(${student.profile.kelas_program})` : ""}`} />
                 <InfoRow label="Pondok Pesantren" value={student.profile?.pondok || "Tidak Mukim"} />
                 <InfoRow label="Asrama & Kamar" value={`${student.profile?.asrama || "-"} (Kamar: ${student.profile?.kamar || "-"})`} />
              </div>
          </div>

          {/* SECTION 3: ORANG TUA & ALAMAT */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" /> Keluarga & Domisili
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                 <InfoRow label="Nama Ayah" value={student.profile?.father_name || "-"} />
                 <InfoRow label="Nama Ibu" value={student.profile?.mother_name || "-"} />
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Phone className="h-3.5 w-3.5"/> Telepon Wali</span>
                    <span className="font-semibold text-slate-800 text-sm truncate">{student.profile?.guardian_phone || "-"}</span>
                 </div>
                 <div className="md:col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><MapPin className="h-3.5 w-3.5"/> Alamat Lengkap</span>
                    <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {student.profile?.address || "Alamat belum diisi"}, Ds. {student.profile?.village || "-"}, Kec. {student.profile?.subdistrict || "-"}, {student.profile?.regency || "-"}, {student.profile?.province || "-"} 
                      {/*  FIX: Penambahan Kode Pos */}
                      {student.profile?.postal_code ? ` - Kode Pos: ${student.profile.postal_code}` : ""}
                    </p>
                 </div>
              </div>
          </div>
        </div>

        <DialogFooter className="bg-white p-4 border-t border-slate-100 sm:justify-end rounded-b-xl">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 font-semibold shadow-sm">
            Tutup Detail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const InfoRow = ({ label, value, valueClass = "font-semibold text-slate-800" }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex flex-col gap-1 overflow-hidden">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={`text-sm truncate ${valueClass}`}>{value}</span>
  </div>
);