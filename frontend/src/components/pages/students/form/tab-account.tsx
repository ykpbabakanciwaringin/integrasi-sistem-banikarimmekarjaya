// LOKASI: src/components/pages/students/form/tab-account.tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

export function TabAccount({ formData, handleChange, isLoading, isEditMode }: any) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-5 animate-in fade-in">
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username Login Sistem *</Label>
        <Input value={formData?.username || ""} onChange={(e) => handleChange("username", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Gunakan NISN atau nama unik tanpa spasi..." disabled={isLoading} />
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
            placeholder={isEditMode ? "Masukkan kata sandi baru jika ingin diubah..." : "Akan diisi otomatis (123456) jika dibiarkan kosong..."} 
            className={`h-10 pl-9 border-slate-200 focus-visible:ring-emerald-500 shadow-sm ${formData?.password && formData.password.length < 6 ? "border-rose-300 focus-visible:ring-rose-500" : ""}`} 
            disabled={isLoading} 
          />
        </div>
      </div>
    </div>
  );
}