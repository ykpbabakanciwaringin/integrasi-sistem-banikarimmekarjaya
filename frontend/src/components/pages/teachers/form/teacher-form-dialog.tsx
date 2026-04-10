// LOKASI: src/components/pages/teachers/form/teacher-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserCircle, Building2, Lock, Pencil } from "lucide-react";
import { toast } from "sonner";

// Import Sub-Komponen Tab
import { TabBiodata } from "./tab-biodata";
import { TabAcademic } from "./tab-academic";
import { TabCredential } from "./tab-credential";

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: any;
  onSubmit: (data: any, photo: File | null) => void;
  isLoading: boolean;
  institutions: { id: string; name: string }[];
  isSuperAdmin: boolean;
  userInstName: string;
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  isEditMode,
  initialData,
  onSubmit,
  isLoading,
  institutions,
  isSuperAdmin,
  userInstName,
}: TeacherFormDialogProps) {
  const [formData, setFormData] = useState(initialData);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("biodata");

  useEffect(() => {
    if (open) {
      setFormData({ ...initialData, password: "" }); 
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setActiveTab("biodata");
    }
  }, [initialData, open]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.full_name && formData.nik && formData.username && formData.gender && (isSuperAdmin ? formData.institution_id : true) && (isEditMode ? true : formData?.password?.length >= 6);

  const handleSubmit = () => {
    if (!isFormValid) {
      toast.error("Gagal menyimpan. Pastikan semua field wajib (*) telah diisi dengan benar.");
      return;
    }
    onSubmit(formData, selectedPhoto);
  };

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[850px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          {/* Efek Glowing / Cahaya Mewah */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Pencil className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Perbarui Data Guru" : "Registrasi Guru Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs mt-1">
                Lengkapi biodata, penugasan akademik, dan kredensial akun pendidik.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/50 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full mb-6 bg-slate-200/50 p-1.5 grid-cols-3 rounded-lg">
              <TabsTrigger value="biodata" className="text-xs rounded-md"><UserCircle className="h-3.5 w-3.5 mr-1.5" />Biodata Pribadi</TabsTrigger>
              <TabsTrigger value="academic" className="text-xs rounded-md"><Building2 className="h-3.5 w-3.5 mr-1.5" />Akademik & Lembaga</TabsTrigger>
              <TabsTrigger value="credential" className="text-xs rounded-md"><Lock className="h-3.5 w-3.5 mr-1.5" />Akun Login</TabsTrigger>
            </TabsList>

            <TabsContent value="biodata"><TabBiodata formData={formData} handleChange={handleChange} selectedPhoto={selectedPhoto} setSelectedPhoto={setSelectedPhoto} photoPreview={photoPreview} setPhotoPreview={setPhotoPreview} isLoading={isLoading} /></TabsContent>
            <TabsContent value="academic"><TabAcademic formData={formData} handleChange={handleChange} institutions={institutions} isSuperAdmin={isSuperAdmin} userInstName={userInstName} isLoading={isLoading} /></TabsContent>
            <TabsContent value="credential"><TabCredential formData={formData} handleChange={handleChange} isEditMode={isEditMode} isLoading={isLoading} /></TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center sm:justify-between rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 hover:text-slate-700 bg-white">
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !isFormValid} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all">
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan Data...</> : isEditMode ? "Simpan Perubahan Guru" : "Tambahkan Guru Baru"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}