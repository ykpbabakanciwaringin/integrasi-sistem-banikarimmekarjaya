"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, UserCircle, Phone, MapPin, FileText, 
  Briefcase, CheckCircle, Loader2, AlertCircle
} from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { getUniversalImageUrl } from "@/lib/axios";
import { RoleDisplayMap } from "@/types/user";

interface AccountDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: any | null;
  onActivate?: (id: string) => void;
  isActivating?: boolean;
}

export function AccountDetailDialog({ 
  open, onOpenChange, account, onActivate, isActivating = false
}: AccountDetailDialogProps) {
  if (!account) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-rose-500/20 text-rose-200 border-rose-400/30 hover:bg-rose-500/30";
      case "ADMIN": return "bg-indigo-500/20 text-indigo-200 border-indigo-400/30 hover:bg-indigo-500/30";
      case "ADMIN_ACADEMIC": return "bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30";
      case "ADMIN_FINANCE": return "bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30";
      case "TEACHER": return "bg-orange-500/20 text-orange-200 border-orange-400/30 hover:bg-orange-500/30";
      default: return "bg-emerald-500/20 text-emerald-100 border-emerald-400/30 hover:bg-emerald-500/30";
    }
  };

  const enrollments = account.enrollments || [];
  const avatarUrl = getUniversalImageUrl(account.profile?.image);
  const userInitials = (account.profile?.full_name || account.username || "U").substring(0, 2).toUpperCase();
  const roleLabel = RoleDisplayMap[account.role as keyof typeof RoleDisplayMap] || account.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[750px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <VisuallyHidden.Root><DialogTitle>Detail Akun</DialogTitle></VisuallyHidden.Root>

        {/* HEADER MEWAH DENGAN EFEK CAHAYA (GLOWING) */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-[#043425] to-[#065f46] p-8 text-white shrink-0">
          <div className="absolute -right-4 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5">
            <Avatar className="h-20 w-20 border-4 border-white/20 bg-white shadow-xl">
              <AvatarImage src={avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="font-bold text-2xl text-emerald-800">{userInitials}</AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left space-y-2 flex-1">
              <DialogTitle className="text-2xl font-black tracking-tight text-white flex flex-col md:flex-row items-center md:items-center gap-2">
                {account.profile?.full_name || account.username}
                {account.is_active && <CheckCircle className="h-5 w-5 text-emerald-400 drop-shadow-sm" />}
              </DialogTitle>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                <Badge className={`border shadow-none font-semibold ${getRoleColor(account.role)}`}>
                  {roleLabel}
                </Badge>
                {!account.is_active && (
                  <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/30 shadow-none font-semibold animate-pulse hover:bg-amber-500/30">
                    Menunggu Verifikasi
                  </Badge>
                )}
                <span className="text-xs text-emerald-100/70 font-mono bg-black/10 px-2 py-0.5 rounded border border-white/5">
                  ID: {account.id.split("-")[0]}
                </span>
              </div>
            </div>

            {/* Tombol Verifikasi Instan di Header */}
            {!account.is_active && onActivate && (
              <div className="mt-4 md:mt-0">
                 <Button 
                    onClick={() => onActivate(account.id)}
                    disabled={isActivating}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg border-none"
                 >
                    {isActivating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                    Verifikasi Akun
                 </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/80 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* SECTION 1: KREDENSIAL & KONTAK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-slate-400" /> Info Utama
              </h4>
              <InfoRow label="Username" value={`@${account.username}`} valueClass="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit" />
              <InfoRow label="Status Akun" value={account.is_active ? "Aktif" : "Menunggu Verifikasi"} valueClass={account.is_active ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"} />
              <InfoRow label="Terdaftar Pada" value={new Date(account.created_at || Date.now()).toLocaleDateString("id-ID", { dateStyle: "long" })} />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" /> Kontak & Pribadi
              </h4>
              <InfoRow label="Email" value={account.profile?.email || "-"} />
              <InfoRow label="WhatsApp" value={account.profile?.phone_number || "-"} />
              <InfoRow label="Gender" value={account.profile?.gender === "L" ? "Laki-laki" : account.profile?.gender === "P" ? "Perempuan" : "-"} />
              <InfoRow label="Tempat, Tanggal Lahir" value={`${account.profile?.birth_place || "-"}, ${account.profile?.birth_date ? new Date(account.profile.birth_date).toLocaleDateString("id-ID") : "-"}`} />
            </div>
          </div>

          {/* SECTION 2: DATA PELENGKAP */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" /> Identitas & Domisili
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
                 <InfoRow label="NIK (KTP/KK)" value={account.profile?.nik || "-"} />
                 <InfoRow label="NISN" value={account.profile?.nisn || "-"} />
                 <InfoRow label="NIP (Pegawai)" value={account.profile?.nip || "-"} />
                 <div className="md:col-span-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><MapPin className="h-3.5 w-3.5"/> Alamat Lengkap</span>
                    <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {account.profile?.address || "Belum ada data alamat"}
                    </p>
                 </div>
              </div>
          </div>

          {/* SECTION 3: PENUGASAN */}
          {account.role !== "SUPER_ADMIN" && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                Daftar Penugasan Lembaga
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {enrollments.length > 0 ? (
                  enrollments.map((en: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{en.institution?.name || "Lembaga Dihapus"}</p>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                              {RoleDisplayMap[en.role as keyof typeof RoleDisplayMap] || en.role}
                            </span>
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                              {en.position || "Belum Diatur"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-6 border-2 border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                    <Building2 className="h-6 w-6 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Belum memiliki penugasan lembaga.</p>
                  </div>
                )}
              </div>
            </div>
          )}
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