// LOKASI: src/components/pages/institutions/institution-detail-dialog.tsx
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
  MapPin,
  Hash,
  School,
  Bookmark,
  Phone,
  Mail,
  Globe,
  Navigation,
  ClipboardList,
  Zap, 
  Key, 
  Building2,
  CheckCircle
} from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { getUniversalImageUrl } from "@/lib/axios";

interface InstitutionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: any | null;
}

export function InstitutionDetailDialog({
  open,
  onOpenChange,
  institution,
}: InstitutionDetailDialogProps) {
  if (!institution) return null;

  // URL Logo dengan cache buster untuk reaktivitas instan
  const cacheBuster = institution.updated_at ? `?t=${new Date(institution.updated_at).getTime()}` : "";
  const logoUrl = institution.logo_url ? `${getUniversalImageUrl(institution.logo_url)}${cacheBuster}` : undefined;
  const initials = institution.name?.substring(0, 2).toUpperCase() || "LB";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[750px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl"
      >
        <VisuallyHidden.Root><DialogTitle>Detail Lembaga</DialogTitle></VisuallyHidden.Root>

        {/* HEADER MEWAH DENGAN EFEK CAHAYA (GLOWING) SELARAS DENGAN DATA SISWA */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-[#043425] to-[#065f46] p-8 text-white shrink-0">
          <div className="absolute -right-4 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5">
            <Avatar className="h-24 w-24 border-4 border-white/20 bg-white shadow-xl p-1 rounded-2xl">
              {logoUrl ? (
                <AvatarImage src={logoUrl} className="object-contain rounded-xl" />
              ) : null}
              <AvatarFallback className="font-bold text-3xl text-emerald-800 bg-emerald-50 rounded-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left space-y-2 flex-1 mt-2 md:mt-0">
              <DialogTitle className="text-2xl font-black tracking-tight text-white flex flex-col md:flex-row items-center md:items-center gap-2">
                {institution.name}
                <CheckCircle className="h-5 w-5 text-emerald-400 drop-shadow-sm hidden md:block" />
              </DialogTitle>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 border border-emerald-400/30 shadow-none font-semibold px-3">
                  {institution.level_code}
                </Badge>
                <span className="text-xs text-emerald-100/70 font-mono bg-black/10 px-2 py-0.5 rounded border border-white/5">
                  KODE: {institution.code}
                </span>
                {institution.is_pq_integration_enabled && (
                  <Badge className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 shadow-none font-semibold">
                    <Zap className="h-3 w-3 mr-1 fill-amber-400" /> PQ Sync Aktif
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/80 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BLOK 1: IDENTITAS & KATEGORI */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                <School className="h-4 w-4 text-slate-400" /> Informasi Utama
              </h4>
              <InfoRow
                icon={<Building2 className="h-3.5 w-3.5" />}
                label="Nama Yayasan / Organisasi"
                value={institution.foundation_name}
              />
              <InfoRow
                icon={<ClipboardList className="h-3.5 w-3.5" />}
                label="Kategori Unit"
                value={institution.category}
              />
              <InfoRow
                icon={<Bookmark className="h-3.5 w-3.5" />}
                label="Jenjang Pendidikan"
                value={institution.level_code}
              />
            </div>

            {/* BLOK 2: INTEGRASI & KOP SURAT */}
            <div className="flex flex-col gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors flex-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400" /> Header Kop Surat
                </h4>
                <div className="space-y-3">
                  <InfoRow label="Header Baris 1" value={institution.header1} />
                  <InfoRow label="Header Baris 2" value={institution.header2} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-200 transition-colors flex-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-400" /> Pihak Ketiga
                </h4>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PesantrenQu Sync</span>
                  <Badge className={institution.is_pq_integration_enabled ? "bg-emerald-500" : "bg-slate-400"}>
                    {institution.is_pq_integration_enabled ? "AKTIF" : "NON-AKTIF"}
                  </Badge>
                </div>
                {institution.is_pq_integration_enabled && (
                  <InfoRow
                    icon={<Key className="h-3.5 w-3.5" />}
                    label="Partner Key (API Key)"
                    value={institution.pq_partner_key ? "••••••••••••••••" : "Menggunakan Kunci Global"}
                    valueClass={institution.pq_partner_key ? "text-amber-600 font-mono" : "text-slate-400 italic font-medium"}
                  />
                )}
              </div>
            </div>
          </div>

          {/* BLOK 3: KONTAK & ALAMAT (FULL WIDTH) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" /> Kontak & Alamat Detail
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Telepon / WA" value={institution.contact_phone} />
              <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email Resmi" value={institution.contact_email} />
              <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="Website" value={institution.website} valueClass="text-blue-600 underline" />
              
              <div className="md:col-span-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Navigation className="h-3.5 w-3.5"/> Lokasi Geografis
                </span>
                <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {institution.address_detail || "Alamat detail belum diisi"}
                  <br />
                  <span className="text-xs text-slate-500 font-medium italic mt-1 inline-block">
                    {institution.address_city || "Kota/Kabupaten belum diisi"}
                  </span>
                </p>
              </div>
            </div>
          </div>

        </div>

        <DialogFooter className="bg-white p-4 border-t border-slate-100 sm:justify-end rounded-b-xl">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 font-semibold shadow-sm"
          >
            Tutup Detail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const InfoRow = ({
  icon,
  label,
  value,
  valueClass = "text-slate-800"
}: {
  icon?: any;
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex flex-col gap-1 overflow-hidden">
    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
      {icon} <span>{label}</span>
    </div>
    <span className={`text-sm truncate font-semibold ${valueClass}`}>
      {value || "-"}
    </span>
  </div>
);