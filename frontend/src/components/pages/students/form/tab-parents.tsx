// LOKASI: src/components/pages/students/form/tab-parents.tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

export function TabParents({ formData, handleChange, isLoading }: any) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Ayah Kandung</Label>
          <Input value={formData?.father_name || ""} onChange={(e) => handleChange("father_name", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Nama lengkap Ayah..." disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Ibu Kandung</Label>
          <Input value={formData?.mother_name || ""} onChange={(e) => handleChange("mother_name", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Nama lengkap Ibu..." disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. HP Wali / Ortu</Label>
          <Input value={formData?.guardian_phone || ""} onChange={(e) => handleChange("guardian_phone", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: 081234567890" disabled={isLoading} />
        </div>
      </div>
      
      <div className="space-y-1.5 pt-2 border-t border-slate-100 mt-2">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Alamat Rumah Lengkap</Label>
        <Input value={formData?.address || ""} onChange={(e) => handleChange("address", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Jl. KH. Abdul Hannan Blok Pesantren RT 01/RW 02..." disabled={isLoading} />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Desa / Kelurahan</Label>
          <Input value={formData?.village || ""} onChange={(e) => handleChange("village", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Babakan" disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kecamatan</Label>
          <Input value={formData?.subdistrict || ""} onChange={(e) => handleChange("subdistrict", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Ciwaringin" disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kabupaten / Kota</Label>
          <Input value={formData?.regency || ""} onChange={(e) => handleChange("regency", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Cirebon" disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Provinsi</Label>
          <Input value={formData?.province || ""} onChange={(e) => handleChange("province", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Jawa Barat" disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kode Pos</Label>
          <Input value={formData?.postal_code || ""} onChange={(e) => handleChange("postal_code", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: 45167" disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}