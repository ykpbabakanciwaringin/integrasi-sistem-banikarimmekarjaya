// LOKASI: src/components/dashboard/header.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Menu,
  LogOut,
  User,
  Bell,
  Settings,
  Building2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { toast } from "sonner";
import { getUniversalImageUrl } from "@/lib/axios";
import { RoleDisplayMap } from "@/types/user";

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { user, logout, switchInstitution } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Berhasil logout dari Dashboard");
    router.push("/login");
  };

  const handleSwitchInstitution = async (instId: string) => {
    if (user?.institution_id === instId) return;
    setIsSwitching(true);
    try {
      await switchInstitution(instId);
      toast.success("Berhasil pindah lembaga");
      router.refresh();
    } catch (error: any) {
      toast.error("Gagal pindah lembaga");
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isMounted) return <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm" />;

  //  KUNCI REAKTIVITAS: Memanggil data secara presisi dari objek profile
  const profile: any = user?.profile || {};
  const fullName = profile.full_name || user?.username || "Admin";
  const avatarUrl = getUniversalImageUrl(profile.image || profile.photo);
  const userInitials = fullName.substring(0, 2).toUpperCase();

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] bg-emerald-950 border-r-0">
            <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
            <SheetDescription className="sr-only">Navigasi aplikasi untuk versi mobile</SheetDescription>
            <Sidebar />
          </SheetContent>
        </Sheet>

        <div className="hidden lg:flex flex-col">
          <h1 className="text-sm font-bold text-slate-800 tracking-tight">
            {user?.institution_name || "Sistem Administrasi Terpadu"}
          </h1>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {pathname.includes("/dashboard/exams") ? "Mode Ujian Aktif" : "Dashboard Manajemen Akademik"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border border-white"></span>
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-2 pr-3 h-10 gap-3 hover:bg-slate-50 rounded-full border border-transparent hover:border-slate-200 transition-all outline-none">
              
              {/*  KUNCI REAKTIVITAS: key={avatarUrl} memaksa React merender ulang jika gambar diupdate */}
              <Avatar key={avatarUrl} className="h-8 w-8 border border-slate-200 shadow-sm">
                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-sm font-bold text-slate-700 leading-none mb-1">
                  {fullName}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 leading-none uppercase">
                  {RoleDisplayMap[user?.role as keyof typeof RoleDisplayMap] || user?.role}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl border-slate-100 shadow-xl">
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-slate-800">{fullName}</p>
                <p className="text-xs text-slate-500 font-mono">@{user?.username}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator className="bg-slate-100" />
            
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer py-2.5 px-3 rounded-lg hover:bg-slate-50 focus:bg-slate-50 transition-colors">
              <User className="mr-3 h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Profil Saya</span>
            </DropdownMenuItem>

            {user?.role === "SUPER_ADMIN" && (
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="cursor-pointer py-2.5 px-3 rounded-lg hover:bg-slate-50 focus:bg-slate-50 transition-colors">
                <Settings className="mr-3 h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Pengaturan Sistem</span>
              </DropdownMenuItem>
            )}

            {user?.enrollments && user.enrollments.length > 1 && (
              <>
                <DropdownMenuSeparator className="bg-slate-100 my-2" />
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" /> Ganti Lembaga
                  </p>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                    {user.enrollments.map((en: any) => {
                      const isActive = user.institution_id === en.institution_id;
                      return (
                        <div 
                          key={en.institution_id} 
                          onClick={() => !isActive && !isSwitching && handleSwitchInstitution(en.institution_id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-xs font-semibold ${
                            isActive 
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                              : "text-slate-600 hover:bg-slate-100"
                          } ${isSwitching && !isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span className="truncate pr-2">{en.institution?.name || "Pusat"}</span>
                          {isActive && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <DropdownMenuSeparator className="bg-slate-100 mt-2 mb-1" />
            
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-2.5 px-3 rounded-lg focus:bg-rose-50 group transition-colors mt-1">
              <LogOut className="mr-3 h-4 w-4 text-rose-500 group-hover:text-rose-600" />
              <span className="text-sm font-bold text-rose-600">Keluar Sistem</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}