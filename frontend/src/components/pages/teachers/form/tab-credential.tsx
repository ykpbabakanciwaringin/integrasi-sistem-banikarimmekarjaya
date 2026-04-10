// LOKASI: src/components/pages/teachers/form/tab-credential.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";

interface TabCredentialProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  isEditMode: boolean;
  isLoading?: boolean;
}

export function TabCredential({ formData, handleChange, isEditMode, isLoading }: TabCredentialProps) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-5 animate-in fade-in">
      
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username Login Sistem *</Label>
        <Input 
          value={formData?.username || ""} 
          onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/\s+/g, ""))} 
          placeholder="Cth: ahmadfulan" 
          className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" 
          disabled={isEditMode || isLoading} // Username tidak boleh diubah saat edit
        />
        {isEditMode && <p className="text-[10px] text-slate-400 font-medium">Username sistem pendidik bersifat permanen dan tidak dapat diubah.</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
          <span>Password Login {isEditMode ? <span className="text-slate-400 font-normal normal-case">(Kosongkan jika tidak ingin diubah)</span> : "*"}</span>
          {formData?.password && formData.password.length < 6 && (
            <span className="text-rose-500 normal-case text-[10px]">Minimal 6 Karakter</span>
          )}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="password" 
            value={formData?.password || ""} 
            onChange={(e) => handleChange("password", e.target.value)} 
            placeholder={isEditMode ? "Masukkan kata sandi baru jika ingin diubah..." : "Default disarankan 123456 agar mudah diingat..."} 
            className={`h-10 pl-9 border-slate-200 focus-visible:ring-emerald-500 shadow-sm ${formData?.password && formData.password.length < 6 ? "border-rose-300 focus-visible:ring-rose-500" : ""}`} 
            disabled={isLoading} 
          />
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Akun Pendidik</Label>
        <Select value={formData?.status || "ACTIVE"} onValueChange={(v) => handleChange("status", v)} disabled={isLoading}>
          <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE" className="font-bold text-emerald-700">Aktif Bertugas</SelectItem>
            <SelectItem value="PENDING" className="font-bold text-amber-600">Menunggu Verifikasi</SelectItem>
            <SelectItem value="NON AKTIF" className="font-bold text-rose-600">Non Aktif / Cuti</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
    </div>
  );
}