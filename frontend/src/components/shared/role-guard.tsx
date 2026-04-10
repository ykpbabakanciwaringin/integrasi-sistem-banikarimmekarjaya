// LOKASI: src/components/shared/role-guard.tsx
"use client";

import { useAuthStore } from "@/stores/use-auth-store";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Jika belum login atau role tidak diizinkan
  const hasAccess = isAuthenticated && user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 p-8 rounded-[32px] border border-red-500/20 bg-slate-900/50 backdrop-blur-xl shadow-2xl"
        >
          <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tighter">
              AKSES DIBATASI
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Maaf, akun Anda tidak memiliki izin untuk mengakses modul ini.
              Silakan hubungi administrator jika ini adalah kesalahan.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => router.back()}
              className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali Sekarang
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-red-500/40 uppercase tracking-widest">
            <Lock className="w-3 h-3" /> Secure Isolation Active
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
