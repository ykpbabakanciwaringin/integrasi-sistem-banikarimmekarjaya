import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Trash2 } from "lucide-react";

const CATEGORY_OPTIONS = ["FORMAL", "PONDOK", "PROGRAM"];
const LEVEL_OPTIONS = ["SD/MI/SEDERAJAT", "SMP/MTs/SEDERAJAT", "SMA/MA/SMK/SEDERAJAT", "PERGURUAN TINGGI"];

export function TabIdentity({ formData, handleChange, handleLogoSelect, handleRemoveLogo, previewUrl, fileInputRef, isLoading }: any) {
  const initials = (formData?.name || "LB").substring(0, 2).toUpperCase();

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in">
      <div className="md:col-span-4 flex flex-col items-center p-5 border border-slate-200 rounded-xl bg-white shadow-sm space-y-4">
        <Avatar className="w-28 h-28 border-4 border-slate-50 shadow-md rounded-2xl p-1 bg-white">
          <AvatarImage src={previewUrl || undefined} className="object-contain" />
          <AvatarFallback className="text-2xl text-emerald-800 bg-emerald-50 font-bold rounded-xl">{initials}</AvatarFallback>
        </Avatar>
        <input type="file" ref={fileInputRef} onChange={handleLogoSelect} accept="image/*" className="hidden" />
        <div className="flex flex-col gap-2 w-full mt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full text-xs hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 shadow-sm" disabled={isLoading}>
            <UploadCloud className="mr-2 h-4 w-4" /> {previewUrl ? "Ganti Logo" : "Unggah Logo"}
          </Button>
          {(previewUrl || formData?.logo_url) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo} className="w-full text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600" disabled={isLoading}>
              <Trash2 className="mr-2 h-4 w-4" /> Hapus Logo
            </Button>
          )}
        </div>
      </div>

      <div className="md:col-span-8 bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Yayasan / Organisasi (Opsional)</Label>
          <Input value={formData?.foundation_name || ""} onChange={(e) => handleChange("foundation_name", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: YAYASAN KEBAJIKAN PESANTREN" disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Unit Lembaga / Sekolah *</Label>
          <Input value={formData?.name || ""} onChange={(e) => handleChange("name", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: MTs NU ASSALAFIE" disabled={isLoading} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kode Unik *</Label>
            <Input value={formData?.code || ""} onChange={(e) => handleChange("code", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Ex: YKP-01" disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenjang *</Label>
            <Select value={formData?.level_code || ""} onValueChange={(v) => handleChange("level_code", v)} disabled={isLoading}>
              <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori *</Label>
            <Select value={formData?.category || ""} onValueChange={(v) => handleChange("category", v)} disabled={isLoading}>
              <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}