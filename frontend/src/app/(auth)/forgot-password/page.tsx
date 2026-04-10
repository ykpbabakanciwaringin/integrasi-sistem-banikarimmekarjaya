// src/app/forgot-password/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { LogoHeader } from "@/components/shared/logo-header";
import { authService } from "@/services/auth.service";
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ForgotPasswordContent() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      await authService.forgotPassword({ identifier, method });
      setIsSuccess(true);
      toast.success("Instruksi pemulihan berhasil dikirim!");
    } catch (err: any) {
      // [PERBAIKAN]
      const backendError =
        err.response?.data?.error || err.response?.data?.message;
      const errMsg =
        backendError ||
        "Gagal memproses permintaan. Pastikan NISN/NIP/Username Anda benar.";

      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 py-10">
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
              <ShieldCheck className="w-3.5 h-3.5" /> Pemulihan Akun
            </div>
          </div>

          {/* CONTENT SECTION */}
          <div className="p-8">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Terkirim!</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Instruksi dan kata sandi sementara telah dikirimkan ke{" "}
                  {method === "whatsapp" ? "nomor WhatsApp" : "alamat Email"}{" "}
                  Anda. Silakan cek dan segera login.
                </p>
                <Button
                  onClick={() => router.push("/login")}
                  className="mt-8 w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Kembali ke Login
                </Button>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-800">
                    Lupa Kata Sandi?
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    Pilih metode pengiriman. Kami akan mengirimkan kata sandi
                    sementara ke kontak yang terdaftar di sistem.
                  </p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">
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

                  {/* Identifier Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">
                      NISN / NIP / Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        name="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        placeholder="Masukkan nomor induk"
                        className="pl-10 h-12 bg-slate-50/50 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Method Selection */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500 uppercase">
                      Metode Pemulihan
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`cursor-pointer flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all ${method === "whatsapp" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold" : "border-slate-100 hover:bg-slate-50 text-slate-500 font-medium"}`}
                      >
                        <input
                          type="radio"
                          name="method"
                          value="whatsapp"
                          checked={method === "whatsapp"}
                          onChange={() => setMethod("whatsapp")}
                          className="hidden"
                        />
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </label>
                      <label
                        className={`cursor-pointer flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all ${method === "email" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold" : "border-slate-100 hover:bg-slate-50 text-slate-500 font-medium"}`}
                      >
                        <input
                          type="radio"
                          name="method"
                          value="email"
                          checked={method === "email"}
                          onChange={() => setMethod("email")}
                          className="hidden"
                        />
                        <Mail className="w-4 h-4" /> Email
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !identifier}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 disabled:hover:translate-y-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Memproses...
                      </>
                    ) : (
                      <>
                        Kirim Sandi Baru <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </motion.div>

        {/* Back Link */}
        {!isSuccess && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-emerald-200/60 hover:text-white text-xs font-medium flex items-center justify-center gap-2 mx-auto transition-colors outline-none"
            >
              ← Ingat Kata Sandi? Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-emerald-950">
          <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
