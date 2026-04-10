"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Lock, UserCircle, Briefcase, FileText } from "lucide-react";
import { AccountPayload } from "@/types/user";
import { getUniversalImageUrl } from "@/lib/axios";
import { toast } from "sonner";

// Import Sub-Komponen Tabs
import { TabLogin } from "./tab-login";
import { TabPersonal } from "./tab-personal";
import { TabPelengkap } from "./tab-pelengkap";
import { TabEnrollments } from "./tab-enrollments";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  initialData: Partial<AccountPayload>;
  activeAccountDetail?: any;
  onSubmit: (data: Partial<AccountPayload>) => void;
  isLoading: boolean;
  institutions: { id: string; name: string }[];
  isSuperAdmin: boolean;
  onAddEnrollment?: (instId: string, role: string, position: string) => void;
  onDeleteEnrollment?: (enrollId: string) => void;
  isEnrollmentLoading?: boolean;
}

export function AccountFormDialog({
  open, onOpenChange, isEditMode, initialData, activeAccountDetail, onSubmit,
  isLoading, institutions, isSuperAdmin, onAddEnrollment, onDeleteEnrollment, isEnrollmentLoading = false,
}: AccountFormDialogProps) {
  const [formData, setFormData] = useState<Partial<AccountPayload>>(initialData);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const [deletedEnrollmentIds, setDeletedEnrollmentIds] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab("login");
      setDeletedEnrollmentIds([]);
      setFormData(initialData);
      if (initialData.image && typeof initialData.image === "string") {
        setPreviewUrl(getUniversalImageUrl(initialData.image));
      } else {
        setPreviewUrl(null);
      }
    }
  }, [initialData, open]);

  const handleChange = (key: keyof AccountPayload, value: string | File | null | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) return toast.error("Maksimal 2MB");
      handleChange("image", file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const isFormValid = useMemo(() => {
    if (!formData.full_name?.trim() || !formData.username?.trim()) return false;
    if (!isEditMode && (!formData.password || formData.password.length < 6)) return false;
    return true;
  }, [formData, isEditMode]);

  const showEnrollmentTab = isEditMode && formData.role !== "SUPER_ADMIN";

  return (
    <Dialog open={open} onOpenChange={!isLoading ? onOpenChange : undefined}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[800px] p-0 overflow-hidden rounded-xl border-0 bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-[#043425] text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {isEditMode ? "Edit Data Akun" : "Registrasi Akun Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-xs">
                {isEditMode ? "Perbarui informasi dan hak akses pengguna di sini." : "Lengkapi data kredensial dan profil dasar akun baru."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/50 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full mb-6 bg-slate-200/50 p-1.5 rounded-lg ${showEnrollmentTab ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="login" className="text-xs rounded-md"><Lock className="h-3.5 w-3.5 mr-1.5" />Kredensial</TabsTrigger>
              <TabsTrigger value="personal" className="text-xs rounded-md"><UserCircle className="h-3.5 w-3.5 mr-1.5" />Profil</TabsTrigger>
              <TabsTrigger value="pelengkap" className="text-xs rounded-md"><FileText className="h-3.5 w-3.5 mr-1.5" />Akademik</TabsTrigger>
              {showEnrollmentTab && <TabsTrigger value="enrollments" className="text-xs rounded-md"><Briefcase className="h-3.5 w-3.5 mr-1.5" />Penugasan</TabsTrigger>}
            </TabsList>

            <TabsContent value="login"><TabLogin formData={formData} handleChange={handleChange} isEditMode={isEditMode} isLoading={isLoading} /></TabsContent>
            <TabsContent value="personal"><TabPersonal formData={formData} handleChange={handleChange} handleFileSelect={handleFileSelect} previewUrl={previewUrl} fileInputRef={fileInputRef} isLoading={isLoading} /></TabsContent>
            <TabsContent value="pelengkap"><TabPelengkap formData={formData} handleChange={handleChange} isLoading={isLoading} /></TabsContent>
            {showEnrollmentTab && (
              <TabsContent value="enrollments">
                <TabEnrollments 
                  activeAccountDetail={activeAccountDetail} deletedEnrollmentIds={deletedEnrollmentIds} setDeletedEnrollmentIds={setDeletedEnrollmentIds}
                  institutions={institutions} onAddEnrollment={onAddEnrollment} onDeleteEnrollment={onDeleteEnrollment} isLoading={isLoading} isEnrollmentLoading={isEnrollmentLoading}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center sm:justify-between rounded-b-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-slate-500 hover:text-slate-700 bg-white shadow-sm">Batal</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all" onClick={() => onSubmit(formData)} disabled={isLoading || !isFormValid}>
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Menyimpan...</> : isEditMode ? "Simpan Perubahan Akun" : "Buat Akun Baru"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}