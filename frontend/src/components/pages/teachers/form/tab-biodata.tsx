// LOKASI: src/components/pages/teachers/form/tab-biodata.tsx
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UploadCloud, Trash2 } from "lucide-react";
import { getUniversalImageUrl } from "@/lib/axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TabBiodataProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  selectedPhoto: File | null;
  setSelectedPhoto: (file: File | null) => void;
  photoPreview: string | null;
  setPhotoPreview: (url: string | null) => void;
  isLoading?: boolean;
}

export function TabBiodata({ formData, handleChange, selectedPhoto, setSelectedPhoto, photoPreview, setPhotoPreview, isLoading }: TabBiodataProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) return toast.error("Ukuran foto maksimal 2MB");
      if (!file.type.startsWith("image/")) return toast.error("Format file harus berupa gambar");
      
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    handleChange("image", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const initials = (formData?.full_name || formData?.username || "G").substring(0, 2).toUpperCase();
  const currentImageUrl = photoPreview || getUniversalImageUrl(formData.image);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in">
      {/* Bagian Foto Profil (4 Kolom) */}
      <div className="md:col-span-4 flex flex-col items-center p-5 border border-slate-200 rounded-xl bg-white shadow-sm space-y-4">
        <Avatar className="w-28 h-28 border-4 border-slate-50 shadow-md">
          <AvatarImage src={currentImageUrl || undefined} className="object-cover" />
          <AvatarFallback className="text-2xl text-emerald-800 bg-slate-100 font-bold">{initials}</AvatarFallback>
        </Avatar>
        <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
        <div className="flex flex-col gap-2 w-full mt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full text-xs hover:bg-emerald-50 hover:text-emerald-700 border-slate-200 shadow-sm" disabled={isLoading}>
            <UploadCloud className="mr-2 h-4 w-4" /> {currentImageUrl ? "Ganti Foto" : "Unggah Foto"}
          </Button>
          {(currentImageUrl || formData?.image) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto} className="w-full text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600" disabled={isLoading}>
              <Trash2 className="mr-2 h-4 w-4" /> Hapus Foto
            </Button>
          )}
        </div>
      </div>

      {/* Bagian Form Identitas (8 Kolom) */}
      <div className="md:col-span-8 bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap & Gelar *</Label>
          <Input value={formData?.full_name || ""} onChange={(e) => handleChange("full_name", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Ahmad Fulan, S.Pd." disabled={isLoading} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Kelamin *</Label>
            <Select value={formData?.gender || "L"} onValueChange={(v) => handleChange("gender", v)} disabled={isLoading}>
              <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki (L)</SelectItem>
                <SelectItem value="P">Perempuan (P)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nomor WhatsApp</Label>
            <Input value={formData?.phone_number || ""} onChange={(e) => handleChange("phone_number", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: 081234567890" disabled={isLoading} />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tempat Lahir</Label>
            <Input value={formData?.birth_place || ""} onChange={(e) => handleChange("birth_place", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Cirebon" disabled={isLoading} />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Lahir</Label>
            <Input type="date" value={formData?.birth_date || ""} onChange={(e) => handleChange("birth_date", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
          </div>
          
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alamat Email Aktif</Label>
            <Input type="email" value={formData?.email || ""} onChange={(e) => handleChange("email", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: guru.hebat@email.com" disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}