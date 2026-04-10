// LOKASI: src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { RoleDisplayMap } from "@/types/user";

// Import Widget & Views
import { LiveClock } from "@/components/dashboard/widgets/live-clock";
import { SuperAdminView } from "@/components/dashboard/views/super-admin-view";
import { AdminInstitutionView } from "@/components/dashboard/views/admin-institution-view";
import { TeacherView } from "@/components/dashboard/views/teacher-view";

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.institution_id],
    queryFn: dashboardService.getStats,
    refetchInterval: 60000, 
    refetchOnWindowFocus: true,
    staleTime: 30000,
    enabled: !!user,
  });

  if (!isMounted) return null;

  const profile: any = user?.profile || {};
  const fullName = profile.full_name || user?.username || "Pengguna";

  const renderDashboardView = () => {
    if (!user?.role) return null;
    switch (user.role) {
      case "SUPER_ADMIN":
        return <SuperAdminView stats={stats} user={user} isLoading={isLoading} />;
      case "ADMIN":
      case "ADMIN_ACADEMIC":
      case "ADMIN_FINANCE":
        return <AdminInstitutionView stats={stats} user={user} isLoading={isLoading} />;
      case "TEACHER":
        return <TeacherView stats={stats} user={user} isLoading={isLoading} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <ShieldCheck className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Akses Terhad</h2>
            <p className="text-slate-500 mt-2 font-medium">Paparan papan pemuka untuk peranan anda belum dikonfigurasi.</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto space-y-6 p-1"
    >
      {/* HEADER SECTION TUNGGAL (Tidak akan ada jam ganda lagi) */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="flex-1 flex flex-col sm:flex-row justify-between w-full">
           <div className="flex flex-col">
              <LiveClock userName={fullName} />
           </div>

           <div className="flex flex-col items-start sm:items-end justify-center relative z-10 mt-4 sm:mt-0">
             <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm">
               <ShieldCheck className="w-4 h-4 mr-1.5 inline-block" />
               {RoleDisplayMap[user?.role as keyof typeof RoleDisplayMap] || "Akses Sistem"}
             </Badge>
             <span className="text-[10px] text-slate-400 font-medium mt-2 flex items-center">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
               Sesi Aktif Terverifikasi
             </span>
           </div>
        </div>
      </div>

      {/* RENDER VIEW BERDASARKAN ROLE */}
      <div className="w-full">
         {renderDashboardView()}
      </div>
    </motion.div>
  );
}