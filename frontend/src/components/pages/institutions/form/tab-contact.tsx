import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TabContact({ formData, handleChange, isLoading }: any) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in fade-in">
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap (Jalan, RT/RW, Desa, Kec)</Label>
        <Input value={formData?.address_detail || ""} onChange={(e) => handleChange("address_detail", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Jl. Gondang Manis No.52 RT 002 RW 002 Ds. Babakan Kec. Ciwaringin" disabled={isLoading} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kota / Kabupaten / Provinsi</Label>
        <Input value={formData?.address_city || ""} onChange={(e) => handleChange("address_city", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Kabupaten Cirebon Jawa Barat Kode Pos 45167" disabled={isLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. Telepon / WA</Label>
          <Input value={formData?.contact_phone || ""} onChange={(e) => handleChange("contact_phone", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: 082 260..." disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Resmi</Label>
          <Input value={formData?.contact_email || ""} onChange={(e) => handleChange("contact_email", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: email@lembaga.com" disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Website</Label>
          <Input value={formData?.website || ""} onChange={(e) => handleChange("website", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: www.lembaga.com" disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}