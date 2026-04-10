// LOKASI: src/components/pages/auth/login-form.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/use-auth-store";
import { LogoHeader } from "@/components/shared/logo-header";
import { ROLES } from "@/lib/constants";
import {
  Loader2,
  AlertCircle,
  User,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State Store & Local
  const loginToStore = useAuthStore((state) => state.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // LOGIC: SMART REDIRECT (Pre-fill Username dari QR Code)
  useEffect(() => {
    const userQ = searchParams.get("u");

    if (userQ) {
      setUsername(userQ);
      toast.success(
        "Sistem mendeteksi akun Anda. Silakan masukan kata sandi dari Kartu Ujian.",
      );

      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 300);

      window.history.replaceState({}, document.title, "/login");
    }
  }, [searchParams]);

  // LOGIC: MANUAL LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const user = await loginToStore({ username, password });
      toast.success(
        `Selamat datang, ${user.profile?.full_name || user.username}!`,
      );

      if (user.role === ROLES.STUDENT) {
        router.replace("/student-exam");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      //  PERBAIKAN: Menangkap pesan error murni, tanpa melemparkan ke console.error yang memicu Turbopack Error
      const errMsg = err instanceof Error ? err.message : "Gagal login. Periksa username dan kata sandi.";
      
      setError(errMsg);
      toast.error(errMsg);
      
      // Bersihkan password dan fokuskan kembali jika salah
      setPassword("");
      passwordInputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900">
      {/* Pattern & Glow */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* MAIN CARD CONTAINER */}
      <div className="z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20"
        >
          {/* HEADER SECTION */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-6 flex flex-col items-center text-center">
            <LogoHeader size="md" />

            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-100 shadow-sm uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Portal Akademik
            </div>
          </div>

          {/* FORM CONTENT */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-800">
                Login Aplikasi
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Masukan akun atau{" "}
                <span className="font-bold text-emerald-600 cursor-pointer hover:underline">
                  Scan Kartu Ujian
                </span>
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 border border-red-100 overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  NISN / NIP / Username
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukan nomor induk"
                    className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    Kata Sandi
                  </Label>
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <LockKeyhole className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    ref={passwordInputRef}
                    className="pl-10 pr-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl transition-all"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-emerald-600"
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
                disabled={isLoading || !username || !password}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk Aplikasi <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Link Lupa Password & Pendaftaran */}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="hover:text-emerald-600 hover:underline font-medium transition-colors outline-none"
              >
                Lupa Kata Sandi?
              </button>
              <div className="flex gap-1">
                <span>Belum punya akun?</span>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="text-emerald-600 font-bold hover:underline outline-none"
                >
                  Daftar di sini
                </button>
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Yayasan Kebajikan Pesantren.
              <br />
            </p>
          </div>
        </motion.div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-emerald-200/60 hover:text-white text-xs font-medium flex items-center justify-center gap-2 mx-auto transition-colors outline-none focus:text-white"
          >
            ← Kembali ke Portal Utama
          </button>
        </div>
      </div>
    </main>
  );
}