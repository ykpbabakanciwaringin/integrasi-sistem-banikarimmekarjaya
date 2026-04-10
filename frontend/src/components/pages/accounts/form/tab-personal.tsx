import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

export function TabPersonal({ formData, handleChange, handleFileSelect, previewUrl, fileInputRef, isLoading }: any) {
  const initials = (formData.full_name || formData.username || "U").substring(0, 2).toUpperCase();
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in">
      <div className="md:col-span-4 flex flex-col items-center p-5 border border-slate-200 rounded-xl bg-white shadow-sm space-y-4">
        <Avatar className="w-28 h-28 border-4 border-slate-50 shadow-md">
          <AvatarImage src={previewUrl || undefined} className="object-cover" />
          <AvatarFallback className="text-2xl text-emerald-800 bg-slate-100 font-bold">{initials}</AvatarFallback>
        </Avatar>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full text-xs hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 shadow-sm" disabled={isLoading}>
          <UploadCloud className="mr-2 h-4 w-4" /> {previewUrl ? "Ganti Foto" : "Unggah Foto"}
        </Button>
      </div>
      <div className="md:col-span-8 bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</Label>
          <Input value={formData.full_name || ""} onChange={(e) => handleChange("full_name", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email (Opsional)</Label>
            <Input type="email" value={formData.email || ""} onChange={(e) => handleChange("email", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. WhatsApp</Label>
            <Input value={formData.phone_number || ""} onChange={(e) => handleChange("phone_number", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}