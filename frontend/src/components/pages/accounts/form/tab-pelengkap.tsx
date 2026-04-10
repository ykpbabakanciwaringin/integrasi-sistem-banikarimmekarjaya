import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function TabPelengkap({ formData, handleChange, isLoading }: any) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in">
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NIK (KTP)</Label>
        <Input value={formData.nik || ""} onChange={(e) => handleChange("nik", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NISN</Label>
        <Input value={formData.nisn || ""} onChange={(e) => handleChange("nisn", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NIP (Pegawai)</Label>
        <Input value={formData.nip || ""} onChange={(e) => handleChange("nip", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
      </div>
    </div>
  );
}