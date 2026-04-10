import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";
import { UserRole } from "@/types/user";

export function TabLogin({ formData, handleChange, isEditMode, isLoading }: any) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-5 animate-in fade-in">
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username Login Sistem *</Label>
        <Input value={formData.username || ""} onChange={(e) => handleChange("username", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
          <span>Password Login {isEditMode ? <span className="text-slate-400 font-normal normal-case">(Kosongkan jika tidak diubah)</span> : "*"}</span>
          {formData.password && formData.password.length < 6 && <span className="text-rose-500 normal-case text-[10px]">Minimal 6 Karakter</span>}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input type="password" value={formData.password || ""} onChange={(e) => handleChange("password", e.target.value)} placeholder={isEditMode ? "Masukkan kata sandi baru jika ingin diubah..." : "Akan diisi otomatis (123456) jika dibiarkan kosong..."} className="h-10 pl-9 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Akses Role Utama</Label>
          <Select value={formData.role || "USER"} onValueChange={(v) => handleChange("role", v as UserRole)} disabled={isLoading}>
            <SelectTrigger className="h-10 bg-white shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin Lembaga</SelectItem>
              <SelectItem value="TEACHER">Guru / Staf</SelectItem>
              <SelectItem value="USER">Siswa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isEditMode && (
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Aktif</Label>
            <Select value={formData.is_active ? "true" : "false"} onValueChange={(v) => handleChange("is_active", v === "true")} disabled={isLoading}>
              <SelectTrigger className={`h-10 bg-white shadow-sm ${formData.is_active ? 'text-emerald-700' : 'text-amber-600'}`}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="true">Aktif</SelectItem><SelectItem value="false">Menunggu Verifikasi</SelectItem></SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}