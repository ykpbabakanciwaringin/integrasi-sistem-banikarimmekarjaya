"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { LogoHeader } from "@/components/shared/logo-header";
import {
  Loader2,
  ShieldCheck,
  AlertCircle,
  User,
  LockKeyhole,
  Eye,
  EyeOff,
  IdCard,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    password: "",
  });

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simulasi network delay agar animasi terasa
      await new Promise((r) => setTimeout(r, 1000));

      // Eksekusi Service
      await authService.setupFirstAdmin(formData);

      toast.success("Super Admin Berhasil Dibuat!", {
        description: "Silakan login menggunakan akun baru Anda.",
      });

      router.push("/login");
    } catch (err: any) {
      const errMsg = err.message || "Gagal melakukan setup awal.";
      setError(errMsg);
      toast.error("Terjadi Kesalahan", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. BACKGROUND: Consistent Emerald Gradient
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900">
      {/* Pattern & Glow */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* 2. MAIN CONTAINER */}
      <div className="z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20"
        >
          {/* HEADER: Initialization Mode */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-6 flex flex-col items-center text-center">
            <LogoHeader size="md" />
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-100 shadow-sm uppercase tracking-wider">
              <Cpu className="w-3 h-3 animate-pulse" />
              System Initialization
            </div>
          </div>

          {/* FORM CONTENT */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold text-slate-800">
                Setup Super Admin
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Buat akun pemegang akses penuh (Root User) pertama untuk
                yayasan.
              </p>
            </div>

            <form onSubmit={handleSetup} className="space-y-5">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 border border-red-100 mb-4"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input: Nama Lengkap */}
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Nama Lengkap
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Contoh: Administrator Utama"
                    className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Input: Username */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Username Admin
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="Buat username unik"
                    className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Input: Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Kata Sandi
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <LockKeyhole className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimal 6 karakter"
                    className="pl-10 pr-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl transition-all"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menginstall System...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Buat Akun & Mulai
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Footer Info */}
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <span className="font-bold text-red-400">
                Peringatan Keamanan:
              </span>
              <br />
              Akun ini memiliki hak akses level tertinggi (Super Admin).
              <br />
              Harap simpan kredensial dengan aman.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
