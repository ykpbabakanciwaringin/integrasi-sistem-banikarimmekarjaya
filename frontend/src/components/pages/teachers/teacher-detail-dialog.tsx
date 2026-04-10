// LOKASI: src/components/pages/teachers/teacher-detail-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  UserCircle,
  Phone,
  Lock,
  CheckCircle,
  AlertCircle,
  Mail,
  Loader2,
  Briefcase,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { getUniversalImageUrl } from "@/lib/axios";

interface TeacherDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any | null;
  onVerify?: (id: string) => void;
  isVerifying?: boolean;
}

export function TeacherDetailDialog({
  open,
  onOpenChange,
  teacher,
  onVerify,
  isVerifying = false,
}: TeacherDetailDialogProps) {
  if (!teacher) return null;

  const formatBirthDate = (dateString?: string) => {
    if (!dateString || dateString.startsWith("0001") || dateString === "1/1/1")
      return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const avatarUrl = getUniversalImageUrl(teacher.profile?.image);
  const initials = (teacher.profile?.full_name || teacher.username || "G").substring(0, 2).toUpperCase();
  const isPending = teacher.account_status === "PENDING" || teacher.account_status === "NON AKTIF";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[750px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <VisuallyHidden.Root><DialogTitle>Detail Guru</DialogTitle></VisuallyHidden.Root>

        {/* HEADER MEWAH DENGAN EFEK CAHAYA (GLOWING) SELARAS DENGAN DATA SISWA */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-[#043425] to-[#065f46] p-8 text-white shrink-0">
          <div className="absolute -right-4 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5">
            <Avatar className="h-20 w-20 border-4 border-white/20 bg-white shadow-xl">
              <AvatarImage src={avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="font-bold text-2xl text-emerald-800">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left space-y-2 flex-1">
              <DialogTitle className="text-2xl font-black tracking-tight text-white flex flex-col md:flex-row items-center gap-2">
                {teacher.profile?.full_name || teacher.username}
                {!isPending && (
                  <CheckCircle className="h-5 w-5 text-emerald-400 drop-shadow-sm" />
                )}
              </DialogTitle>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                {!isPending ? (
                  <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 border border-emerald-400/30 shadow-none font-semibold">
                    Aktif Bertugas
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 shadow-none font-semibold animate-pulse">
                    Menunggu Verifikasi
                  </Badge>
                )}
                <span className="text-xs text-emerald-100/70 font-mono bg-black/10 px-2 py-0.5 rounded border border-white/5">
                  NIP/NIG: {teacher.profile?.n_ip || teacher.profile?.nip || "-"}
                </span>
              </div>
            </div>

            {/* Tombol Verifikasi Instan di Header */}
            {isPending && onVerify && (
              <div className="mt-4 md:mt-0">
                 <Button 
                    onClick={() => onVerify(teacher.id)}
                    disabled={isVerifying}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg border-none"
                 >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    Verifikasi Pendidik
                 </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/80 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          
          {/* SECTION 1: IDENTITAS & KONTAK/KREDENSIAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-slate-400" /> Identitas Diri
              </h4>
              <InfoRow label="Jenis Kelamin" value={teacher.profile?.gender === "L" ? "Laki-laki" : teacher.profile?.gender === "P" ? "Perempuan" : "-"} />
              <InfoRow label="NIK (KTP/KK)" value={teacher.profile?.nik || "-"} />
              <InfoRow label="Tempat, Tanggal Lahir" value={`${teacher.profile?.birth_place || "-"}, ${formatBirthDate(teacher.profile?.birth_date)}`} />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" /> Kontak & Kredensial
              </h4>
              <InfoRow label="Username Login" value={`@${teacher.username}`} valueClass="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit" />
              {/* Fitur Admin: Menampilkan Plain Password jika diizinkan oleh backend */}
              {(teacher as any).plain_password && (
                <InfoRow label="Password Sementara" value={(teacher as any).plain_password} valueClass="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded w-fit" />
              )}
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-sm font-semibold text-slate-800">{teacher.profile?.phone_number || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-sm font-semibold text-slate-800 truncate">{teacher.profile?.email || "-"}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: PENUGASAN LEMBAGA */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" /> Penugasan Lembaga & Jabatan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacher.enrollments && teacher.enrollments.length > 0 ? (
                  teacher.enrollments.map((en: any, idx: number) => (
                    <div key={idx} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1"><Building2 className="h-3.5 w-3.5"/> Lembaga Utama</span>
                       <span className="font-bold text-emerald-700 text-sm truncate">{en.institution?.name || "Lembaga Induk"}</span>
                       <span className="mt-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded w-fit shadow-sm">
                         {en.position || "Guru Mapel"}
                       </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-4 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-500">Belum memiliki penugasan lembaga.</p>
                  </div>
                )}
              </div>
          </div>

          {/* SECTION 3: ALAMAT LENGKAP */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" /> Domisili Pendidik
              </h4>
              <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {teacher.profile?.address || "Alamat lengkap belum diisi atau diatur di dalam sistem."}
              </p>
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
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-ellipsis">{label}</span>
    <span className={`text-sm truncate ${valueClass}`} title={value}>{value || "-"}</span>
  </div>
);