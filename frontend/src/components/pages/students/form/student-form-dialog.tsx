// LOKASI: src/components/pages/students/form/student-form-dialog.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { classService } from "@/services/class.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserCircle, Lock, Users, BookOpen, Pencil } from "lucide-react";
import { getUniversalImageUrl } from "@/lib/axios";
import { toast } from "sonner";

// Import Sub-Komponen
import { TabPersonal } from "./tab-personal";
import { TabAcademic } from "./tab-academic";
import { TabParents } from "./tab-parents";
import { TabAccount } from "./tab-account";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: any;
  onSubmit: (data: any, photo: File | null) => void;
  isLoading: boolean;
  institutions: any[];
  isSuperAdmin: boolean;
  userInstName?: string;
}

export function StudentFormDialog({
  open, onOpenChange, isEditMode, initialData, onSubmit, isLoading,
  institutions, isSuperAdmin, userInstName,
}: StudentFormDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["classes_list_form", formData?.institution_id],
    queryFn: () => classService.getAll({ institution_id: formData?.institution_id, limit: 500 }),
    enabled: !!formData?.institution_id && open,
  });

  const formClasses = classesData?.data || [];

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setActiveTab("personal");
      if (initialData?.profile?.image) {
        setPreviewUrl(getUniversalImageUrl(initialData.profile.image));
      } else if (initialData?.image && typeof initialData.image === "string") {
        setPreviewUrl(getUniversalImageUrl(initialData.image));
      } else {
        setPreviewUrl(null);
      }
      setSelectedPhoto(null);
    }
  }, [initialData, open]);

  const handleChange = (key: string, value: string) => setFormData((prev: any) => ({ ...prev, [key]: value }));

  const handleInstitutionChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, institution_id: value, class_id: "none" }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) return toast.error("Ukuran foto maksimal 2MB");
      if (!file.type.startsWith("image/")) return toast.error("Format file harus berupa gambar");
      setSelectedPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPreviewUrl(null);
    handleChange("image", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isFormValid = useMemo(() => {
    if (!formData?.full_name?.trim()) return false;
    if (!formData?.nisn?.trim()) return false;
    if (!formData?.username?.trim()) return false;
    if (!isEditMode && (!formData?.password || formData.password.length < 6)) return false;
    if (isEditMode && formData?.password && formData.password.length < 6) return false;
    if (!isEditMode && isSuperAdmin && !formData?.institution_id) return false;
    return true;
  }, [formData, isEditMode, isSuperAdmin]);

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[850px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Pencil className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Perbarui Data Siswa" : "Registrasi Siswa Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs mt-1">
                Lengkapi biodata, akademik, asrama, dan kontak orang tua wali.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/50 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full mb-6 bg-slate-200/50 p-1.5 grid-cols-4 rounded-lg">
              <TabsTrigger value="personal" className="text-xs rounded-md"><UserCircle className="h-3.5 w-3.5 mr-1.5" />Identitas</TabsTrigger>
              <TabsTrigger value="academic" className="text-xs rounded-md"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Akademik</TabsTrigger>
              <TabsTrigger value="parents" className="text-xs rounded-md"><Users className="h-3.5 w-3.5 mr-1.5" />Orang Tua</TabsTrigger>
              <TabsTrigger value="account" className="text-xs rounded-md"><Lock className="h-3.5 w-3.5 mr-1.5" />Akun</TabsTrigger>
            </TabsList>

            <TabsContent value="personal"><TabPersonal formData={formData} handleChange={handleChange} handlePhotoSelect={handlePhotoSelect} handleRemovePhoto={handleRemovePhoto} previewUrl={previewUrl} fileInputRef={fileInputRef} isLoading={isLoading} /></TabsContent>
            <TabsContent value="academic"><TabAcademic formData={formData} handleChange={handleChange} handleInstitutionChange={handleInstitutionChange} institutions={institutions} formClasses={formClasses} isLoading={isLoading} isLoadingClasses={isLoadingClasses} isSuperAdmin={isSuperAdmin} isEditMode={isEditMode} userInstName={userInstName} /></TabsContent>
            <TabsContent value="parents"><TabParents formData={formData} handleChange={handleChange} isLoading={isLoading} /></TabsContent>
            <TabsContent value="account"><TabAccount formData={formData} handleChange={handleChange} isLoading={isLoading} isEditMode={isEditMode} /></TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center sm:justify-between rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 hover:text-slate-700 bg-white">Batal</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all" onClick={() => onSubmit(formData, selectedPhoto)} disabled={isLoading || !isFormValid}>
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan Data...</> : isEditMode ? "Simpan Perubahan Siswa" : "Tambahkan Siswa Baru"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}