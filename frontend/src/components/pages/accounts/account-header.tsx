// LOKASI: src/components/pages/accounts/account-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ShieldCheck, Plus } from "lucide-react";

interface AccountHeaderProps {
  currentUserRole?: string;
  onOpenCreate: () => void;
}

export function AccountHeader({ currentUserRole, onOpenCreate }: AccountHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <ShieldCheck className="h-6 w-6 text-emerald-600" /> Manajemen Akun 
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kontrol akses pengguna, verifikasi pendaftar, dan manajemen hak akses multi-lembaga.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {currentUserRole === "SUPER_ADMIN" && (
          <Button 
            onClick={onOpenCreate} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Akun Baru
          </Button>
        )}
      </div>
    </div>
  );
}