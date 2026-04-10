// LOKASI: src/app/(auth)/register/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { LogoHeader } from "@/components/shared/logo-header";
import { ROLES } from "@/lib/constants";
import { authService } from "@/services/auth.service";
import {
  Loader2, AlertCircle, User, LockKeyhole, Eye, EyeOff,
  Building2, Mail, Phone, Hash, Users, CreditCard, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RegisterContent() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    role: ROLES.STUDENT as string,
    institution_id: "",
    full_name: "",
    gender: "L",
    nisn: "",
    nip: "",
    email: "",
    phone_number: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const data = await authService.getPublicInstitutions();
        setInstitutions(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, institution_id: data[0].id }));
        }
      } catch (err) {
        console.error("Gagal mengambil data lembaga", err);
      }
    };
    fetchInstitutions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setFormData({
      ...formData,
      role: newRole,
      nisn: newRole === ROLES.TEACHER ? "" : formData.nisn,
      nip: newRole === ROLES.STUDENT ? "" : formData.nip,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      if (formData.role === ROLES.STUDENT && !formData.nisn) throw new Error("NISN wajib diisi untuk Pendaftar Siswa");
      if (formData.role === ROLES.TEACHER && !formData.nip) throw new Error("NIP / NIY wajib diisi untuk Pendaftar Guru");

      await authService.registerPublic(formData);
      
      // [PENYEMPURNAAN UX] Toast durasi lebih lama
      toast.success("Pendaftaran berhasil!", {
        description: "Akun Anda sedang ditinjau. Silakan tunggu Admin mengesahkan akun Anda sebelum login.",
        duration: 5000,
      });

      // [PENYEMPURNAAN UX] Jeda 2 detik sebelum pindah halaman agar user bisa baca pesan
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      const backendError = err.response?.data?.error || err.response?.data?.message;
      const errMsg = backendError || "Gagal mendaftar. Periksa kembali kelengkapan data Anda.";
      setError(errMsg);
      toast.error(errMsg);
      setIsLoading(false); // Hanya matikan loading jika error
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 py-10">
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-2xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20 flex flex-col max-h-[90vh]">
          
          {/* HEADER SECTION */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-6 flex flex-col items-center text-center shrink-0">
            <LogoHeader size="md" />
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-100 shadow-sm uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" /> Registrasi Akun Portal Terpadu Yayasan
            </div>
          </div>

          {/* FORM CONTENT */}
          <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/30">
            <div className="bg-sky-50 border border-sky-100 text-sky-700 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-sm">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-medium">
                Silakan isi <b>Identitas Dasar</b> dan <b>Kredensial Login</b> Anda di bawah ini. Kelengkapan data lanjutan dapat diperbarui setelah akun diverifikasi.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 border border-red-100 overflow-hidden mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="leading-tight font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SEGMEN 1: PERUNTUKAN */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Mendaftar Sebagai</Label>
                    <SelectWrapper name="role" value={formData.role} onChange={handleRoleChange}>
                      <option value={ROLES.STUDENT}>Siswa</option>
                      <option value={ROLES.TEACHER}>Guru / Pendidik</option>
                    </SelectWrapper>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Pilih Lembaga</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <SelectWrapper name="institution_id" value={formData.institution_id} onChange={handleChange} required className="pl-9">
                        {institutions.map((inst) => (<option key={inst.id} value={inst.id}>{inst.name}</option>))}
                      </SelectWrapper>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEGMEN 2: IDENTITAS DIRI */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Nama Lengkap Sesuai Ijazah</Label>
                    <Input name="full_name" value={formData.full_name} onChange={handleChange} required placeholder="Contoh: Ahmad Fulan" className="h-11 bg-slate-50/50" disabled={isLoading} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Jenis Kelamin</Label>
                    <SelectWrapper name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </SelectWrapper>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {formData.role === ROLES.STUDENT ? (
                      <motion.div key="nisn" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600 uppercase">Nomor Induk Siswa Nasional (NISN)</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input name="nisn" value={formData.nisn} onChange={handleChange} required placeholder="Masukkan NISN" className="pl-9 h-11 bg-slate-50/50" disabled={isLoading} />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="nip" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600 uppercase">Nomor Induk Pegawai (NIP / NIY)</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input name="nip" value={formData.nip} onChange={handleChange} required placeholder="Masukkan NIP/NIY" className="pl-9 h-11 bg-slate-50/50" disabled={isLoading} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 uppercase">No. WhatsApp Aktif</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input name="phone_number" value={formData.phone_number} onChange={handleChange} required placeholder="08123456789" className="pl-9 h-11 bg-slate-50/50" disabled={isLoading} type="number" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Email Aktif (Pemulihan Sandi)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="contoh@email.com" className="pl-9 h-11 bg-slate-50/50" disabled={isLoading} />
                  </div>
                </div>
              </div>

              {/* SEGMEN 3: KREDENSIAL AKUN */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input name="username" value={formData.username} onChange={handleChange} required placeholder="Karakter unik (tanpa spasi)" className="pl-9 h-11 bg-slate-50/50" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Kata Sandi</Label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required minLength={6} placeholder="Minimal 6 karakter" className="pl-9 pr-9 h-11 bg-slate-50/50" disabled={isLoading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 disabled:hover:translate-y-0">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses Data...</> : "Kirim Pendaftaran"}
              </Button>
            </form>
          </div>

          <div className="bg-slate-50 p-5 text-center border-t border-slate-100 shrink-0">
            <button onClick={() => router.push("/login")} className="text-emerald-700 font-bold hover:text-emerald-800 text-sm flex items-center justify-center gap-2 mx-auto transition-colors outline-none">
              Sudah Punya Akun? Masuk di sini &rarr;
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

const SelectWrapper = ({ name, value, onChange, children, className = "", required = false }: any) => (
  <select name={name} value={value} onChange={onChange} required={required} className={`w-full h-11 px-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl transition-all outline-none text-sm appearance-none ${className}`}>
    {children}
  </select>
);

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-emerald-950"><Loader2 className="h-10 w-10 text-emerald-400 animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}