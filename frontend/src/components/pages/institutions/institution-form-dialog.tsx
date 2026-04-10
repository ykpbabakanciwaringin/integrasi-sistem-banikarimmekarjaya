// LOKASI: src/components/pages/institutions/institution-form-dialog.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Building2, MapPin, Settings, Pencil } from "lucide-react";
import { getUniversalImageUrl } from "@/lib/axios";
import { toast } from "sonner";

// Import Sub-Komponen Tab
import { TabIdentity } from "./form/tab-identity";
import { TabContact } from "./form/tab-contact";
import { TabConfig } from "./form/tab-config";

interface InstitutionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: any;
  onSubmit: (data: any, logo: File | null) => void;
  isLoading: boolean;
}

export function InstitutionFormDialog({
  open, onOpenChange, isEditMode, initialData, onSubmit, isLoading,
}: InstitutionFormDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("identity");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setActiveTab("identity");
      if (initialData.logo_url && initialData.logo_url !== "null") {
        setPreviewUrl(getUniversalImageUrl(initialData.logo_url));
      } else {
        setPreviewUrl(null);
      }
      setSelectedLogo(null);
    }
  }, [initialData, open]);

  const handleChange = (key: string, value: any) => setFormData((prev: any) => ({ ...prev, [key]: value }));

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) return toast.error("Ukuran logo maksimal 2MB");
      if (!file.type.startsWith("image/")) return toast.error("Format file harus berupa gambar");
      setSelectedLogo(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setSelectedLogo(null);
    setPreviewUrl(null);
    handleChange("logo_url", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Validasi Real-time
  const isFormValid = useMemo(() => {
    if (!formData?.name?.trim()) return false;
    if (!formData?.code?.trim()) return false;
    return true;
  }, [formData]);

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[750px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Pencil className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Perbarui Data Lembaga" : "Registrasi Lembaga Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs mt-1">
                Lengkapi identitas, kontak, dan konfigurasi sistem lembaga.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/50 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full mb-6 bg-slate-200/50 p-1.5 grid-cols-3 rounded-lg">
              <TabsTrigger value="identity" className="text-xs rounded-md"><Building2 className="h-3.5 w-3.5 mr-1.5" />Identitas Utama</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs rounded-md"><MapPin className="h-3.5 w-3.5 mr-1.5" />Kontak & Lokasi</TabsTrigger>
              <TabsTrigger value="config" className="text-xs rounded-md"><Settings className="h-3.5 w-3.5 mr-1.5" />Konfigurasi Cetak</TabsTrigger>
            </TabsList>

            <TabsContent value="identity"><TabIdentity formData={formData} handleChange={handleChange} handleLogoSelect={handleLogoSelect} handleRemoveLogo={handleRemoveLogo} previewUrl={previewUrl} fileInputRef={fileInputRef} isLoading={isLoading} /></TabsContent>
            <TabsContent value="contact"><TabContact formData={formData} handleChange={handleChange} isLoading={isLoading} /></TabsContent>
            <TabsContent value="config"><TabConfig formData={formData} handleChange={handleChange} isLoading={isLoading} /></TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center sm:justify-between rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 hover:text-slate-700 bg-white">Batal</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all" onClick={() => onSubmit(formData, selectedLogo)} disabled={isLoading || !isFormValid}>
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan Data...</> : isEditMode ? "Simpan Perubahan Lembaga" : "Tambahkan Lembaga Baru"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}