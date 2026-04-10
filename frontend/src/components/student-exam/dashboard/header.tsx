"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Terminal, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getUniversalImageUrl } from "@/lib/axios";
import { LogoutConfirmDialog } from "./logout-confirm-dialog";

export function StudentHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Berhasil logout dari Portal Siswa.");
      router.push("/login");
    } catch (error) {
      toast.error("Gagal melakukan logout.");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutOpen(false);
    }
  };

  const institution: any = user?.enrollments?.[0]?.institution;
  const institutionLogo = institution?.logo_url ? getUniversalImageUrl(institution.logo_url) : null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-emerald-950/80 backdrop-blur-xl border-b border-emerald-500/20 shadow-sm transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* IDENTITAS INSTITUSI */}
          <div className="flex items-center gap-3 sm:gap-4 group cursor-default">
            {institutionLogo ? (
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-emerald-500/30 shadow-inner bg-white/10 group-hover:bg-white/20 transition-colors">
                <AvatarImage src={institutionLogo} alt="Logo" className="object-contain p-1" />
                <AvatarFallback className="bg-emerald-800 text-white text-[10px] font-bold">INS</AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-800/50 flex items-center justify-center border border-emerald-400/30 shadow-inner rotate-3 transition-transform group-hover:rotate-0">
                <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-100" />
              </div>
            )}
            
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-black text-white tracking-tight drop-shadow-sm">
                PORTAL UJIAN SISWA
              </h1>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-widest mt-0.5 opacity-90">
                {institution?.name ? institution.name : "Portal Siswa"}
              </span>
            </div>
          </div>

          {/* AKSI & KONEKSI */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors rounded-full border border-emerald-400/20 shadow-inner">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-50 tracking-wide">Koneksi Aman</span>
            </div>
            
            <button 
              onClick={() => setIsLogoutOpen(true)} 
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-full border border-rose-500/30 transition-all group active:scale-95"
            >
              <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
              <span className="hidden sm:inline-block text-xs font-bold text-rose-100 group-hover:text-white transition-colors uppercase tracking-wider">
                Keluar
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* RENDER DIALOG */}
      <LogoutConfirmDialog 
        open={isLogoutOpen} 
        onOpenChange={setIsLogoutOpen} 
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}