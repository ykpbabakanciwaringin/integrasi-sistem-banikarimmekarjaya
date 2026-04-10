// LOKASI: src/app/dashboard/profile/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { useMutation } from "@tanstack/react-query";
import { apiClient, getUniversalImageUrl } from "@/lib/axios";
import { toast } from "sonner";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  UserCircle, Mail, Phone, KeyRound, ShieldCheck, 
  Camera, Loader2, Lock, Save, Contact2, UploadCloud 
} from "lucide-react";
import { RoleDisplayMap } from "@/types/user";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // States untuk Form Teks
  const [profileData, setProfileData] = useState({ email: "", phone_number: "", gender: "" });
  const [passData, setPassData] = useState({ old_password: "", new_password: "", confirm_password: "" });

  // States untuk Modal Foto
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (user && user.profile) {
      setProfileData({
        email: user.profile.email || "",
        phone_number: user.profile.phone_number || "",
        gender: user.profile.gender || "",
      });
    }
  }, [user]);

  // --- MUTASI 1: UPDATE DATA TEKS (PRIBADI) ---
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: typeof profileData) => {
      const res = await apiClient.put(`/auth/profile`, payload);
      return res.data; // Sekarang berisi { message: "...", user: { ... } }
    },
    onSuccess: (data) => {
      toast.success("Data pribadi berhasil diperbarui!");

      if (data.user && user) {
        setUser({
          ...user,
          ...data.user,
          avatar: data.user.profile?.image || user.avatar,
        });
      }
    },
    onError: (error: any) => {
      toast.error(`Gagal: ${error.response?.data?.error || error.message}`);
    },
  });

  // --- MUTASI 2: UPDATE FOTO (EKSKLUSIF VIA MODAL) ---
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Upload ke Media Service
      const fileData = new FormData();
      fileData.append("image", file);
      fileData.append("category", "profiles");
      const uploadRes = await apiClient.post("/utils/upload", fileData);
      
      const newImageUrl = uploadRes.data.url;

      // 2. Update Database Profil dengan URL baru
      const updateRes = await apiClient.put(`/auth/profile`, { image: newImageUrl });
      
      // Kembalikan data user terbaru dari backend
      return updateRes.data.user;
    },
    onSuccess: (updatedUser) => {
      toast.success("Foto profil berhasil diganti!");
      
      if (updatedUser && user) {
        // Cache Buster Mutlak: Menjamin browser merender gambar baru
        const cacheBustedAvatar = `${updatedUser.profile.image.split('?')[0]}?t=${Date.now()}`;
        
        // Update state Zustand dengan data mutlak dari database
        setUser({
          ...user,
          ...updatedUser,
          avatar: cacheBustedAvatar, 
          profile: { ...updatedUser.profile, image: cacheBustedAvatar }
        });
      }
      
      setIsPhotoModalOpen(false); // Tutup modal otomatis
      setPreviewUrl(null);
      setSelectedPhoto(null);
      // TANPA router.refresh() agar tidak berkedip!
    },
    onError: (error: any) => {
      toast.error(`Gagal unggah foto: ${error.response?.data?.error || error.message}`);
    },
  });

  // --- MUTASI 3: UPDATE KATA SANDI ---
  const passwordMutation = useMutation({
    mutationFn: async (payload: typeof passData) => {
      const res = await apiClient.post(`/auth/change-password`, { old_password: payload.old_password, new_password: payload.new_password });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Kata sandi berhasil diperbarui!");
      setPassData({ old_password: "", new_password: "", confirm_password: "" }); 
    },
    onError: (error: any) => {
      toast.error(`Gagal: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) return toast.error("Ukuran foto maksimal 2MB");
      setSelectedPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClosePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setSelectedPhoto(null);
    setPreviewUrl(null);
  };

  if (!isMounted || !user) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  const currentAvatarUrl = getUniversalImageUrl(user.avatar || user.profile?.image);
  const displayModalAvatar = previewUrl || currentAvatarUrl;
  const roleLabel = RoleDisplayMap[user.role as keyof typeof RoleDisplayMap] || user.role;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Pengaturan Profil</h2>
        <p className="text-sm text-slate-500">Kelola informasi pribadi dan pengaturan keamanan akun Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI (KARTU PROFIL) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-emerald-600 to-emerald-800"></div>
            <CardContent className="pt-0 relative px-6 pb-6 text-center">
              
              {/* TRIGGER MODAL FOTO */}
              <div 
                className="relative w-32 h-32 mx-auto -mt-16 mb-4 group cursor-pointer" 
                onClick={() => setIsPhotoModalOpen(true)}
              >
                {/* KUNCI REAKTIVITAS: key={currentAvatarUrl} */}
                <Avatar key={currentAvatarUrl} className="w-full h-full border-4 border-white shadow-lg bg-slate-100">
                  <AvatarImage src={currentAvatarUrl || undefined} alt={user.full_name || user.username} className="object-cover" />
                  <AvatarFallback className="text-3xl text-slate-400 bg-slate-100 font-bold">
                    {(user.full_name || user.username).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="w-8 h-8 text-white mb-1" />
                  <span className="text-[10px] text-white font-medium uppercase tracking-wider">Ubah Foto</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 truncate">{user.full_name || user.username}</h3>
              <p className="text-sm font-medium text-emerald-600 mb-4">{roleLabel}</p>

              <div className="bg-slate-50 rounded-lg p-4 text-left space-y-3">
                <LockedField label="Nama Terdaftar" value={user.full_name} />
                <LockedField label="Username / Akun" value={user.username} />
                {(user.role === "USER" || user.profile?.nisn) && <LockedField label="NISN" value={user.profile?.nisn} />}
                {(user.role === "TEACHER" || user.profile?.nip) && <LockedField label="NIP / No Pegawai" value={user.profile?.nip} />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN (FORMULIR LEBAR) */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100/80 p-1">
              <TabsTrigger value="personal" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Contact2 className="w-4 h-4 mr-2" /> Data Pribadi
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ShieldCheck className="w-4 h-4 mr-2" /> Keamanan Sandi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-0 focus-visible:outline-none">
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg">Informasi Kontak & Diri</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
                      <Input type="email" value={profileData.email} onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> WhatsApp</Label>
                      <Input type="text" value={profileData.phone_number} onChange={(e) => setProfileData(p => ({ ...p, phone_number: e.target.value }))} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" /> Gender</Label>
                      <Select value={profileData.gender} onValueChange={(v) => setProfileData(p => ({ ...p, gender: v }))}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Pilih" /></SelectTrigger>
                        <SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="pt-4 border-t flex justify-end">
                    <Button onClick={() => updateProfileMutation.mutate(profileData)} disabled={updateProfileMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 shadow-sm">
                      {updateProfileMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Data Pribadi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-0 focus-visible:outline-none">
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg">Ubah Kata Sandi</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-1.5 max-w-md">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Sandi Saat Ini</Label>
                    <Input type="password" value={passData.old_password} onChange={(e) => setPassData(p => ({ ...p, old_password: e.target.value }))} className="h-11" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Sandi Baru</Label>
                      <Input type="password" value={passData.new_password} onChange={(e) => setPassData(p => ({ ...p, new_password: e.target.value }))} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Ulangi Sandi</Label>
                      <Input type="password" value={passData.confirm_password} onChange={(e) => setPassData(p => ({ ...p, confirm_password: e.target.value }))} className="h-11" />
                    </div>
                  </div>
                  <div className="pt-4 border-t flex justify-end">
                    <Button onClick={() => { if (passData.new_password !== passData.confirm_password) return toast.error("Konfirmasi sandi tidak cocok!"); passwordMutation.mutate(passData); }} disabled={passwordMutation.isPending || !passData.old_password} className="bg-slate-800 hover:bg-slate-900 text-white h-11 px-8 shadow-sm">
                      {passwordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />} Perbarui Sandi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* MODAL KHUSUS UPLOAD FOTO */}
      <Dialog open={isPhotoModalOpen} onOpenChange={(isOpen) => !isOpen && handleClosePhotoModal()}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Ubah Foto Profil</DialogTitle>
            <DialogDescription className="text-center">Pastikan foto terlihat jelas dengan ukuran maksimal 2MB.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <Avatar className="w-40 h-40 border-4 border-slate-100 shadow-md mb-6">
              <AvatarImage src={displayModalAvatar || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl text-slate-400 bg-slate-100 font-bold">
                {(user.full_name || user.username).substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/jpeg,image/png,image/jpg" className="hidden" />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
              <UploadCloud className="mr-2 h-4 w-4 text-emerald-600" />
              {selectedPhoto ? "Pilih Foto Lain" : "Cari Foto dari Perangkat"}
            </Button>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button type="button" variant="ghost" onClick={handleClosePhotoModal} disabled={uploadPhotoMutation.isPending}>
              Batal
            </Button>
            <Button 
              type="button" 
              onClick={() => selectedPhoto && uploadPhotoMutation.mutate(selectedPhoto)} 
              disabled={!selectedPhoto || uploadPhotoMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploadPhotoMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Unggah & Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const LockedField = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="space-y-1 pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
    <Label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 tracking-wider">
      {label} <Lock className="w-3 h-3 text-slate-300" />
    </Label>
    <p className="text-sm font-semibold text-slate-700">{value || "-"}</p>
  </div>
);