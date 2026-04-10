"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/use-auth-store";
import { useStudentExamStore } from "@/stores/use-student-exam-store";
import { useExamSecurity } from "@/hooks/use-exam-security";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

// --- HOOKS CUSTOM ---
import { useStudentParser } from "@/components/student-exam/dashboard/use-student-parser";

// --- KOMPONEN UI DASHBOARD ---
import { StudentLiveClock } from "@/components/student-exam/dashboard/student-live-clock";
import { DeviceHealthStatus } from "@/components/student-exam/dashboard/device-health-status";
import { StudentStatCards } from "@/components/student-exam/dashboard/student-stat-cards";
import { StudentProfileCard } from "@/components/student-exam/dashboard/student-profile-card";
import { TokenEntryCard } from "@/components/student-exam/dashboard/token-entry-card";
import { NavigationMenuCards } from "@/components/student-exam/dashboard/navigation-menu-cards";
import { UpcomingExamsWidget } from "@/components/student-exam/dashboard/upcoming-exams-widget";
import { SEBBlocker } from "@/components/student-exam/execute/seb-blocker";

// --- KOMPONEN UI ALERT & MODAL ---
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function StudentDashboardPage() {
  const router = useRouter();
  
  // 1. STORES & STATES
  const { user } = useAuthStore();
  const { examData, startExam } = useStudentExamStore();
  const [isStarting, setIsStarting] = useState(false);
  
  // STATE UNTUK MENAMPUNG PESAN PENOLAKAN DENGAN LEBIH DETAIL
  const [accessDeniedError, setAccessDeniedError] = useState<{ title: string; message: string; type: 'blocked' | 'warning' } | null>(null);
  
  // STATE BARU: Pemicu SEB Blocker dari respons Backend
  const [showSebBlocker, setShowSebBlocker] = useState(false);

  // 2. LOGIKA SEB DINAMIS DARI FRONTEND
  const { isSafeBrowser } = useExamSecurity({
    isActive: !!examData?.is_seb_required,
    onViolation: () => {} 
  });

  // 3. BACKGROUND FETCHING: Data Siswa Realtime
  const { data: realtimeUser } = useQuery({
    queryKey: ["current-student-user", user?.id],
    queryFn: async () => {
      const response = await apiClient.get("/auth/me");
      return response.data?.data || response.data;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true, 
    staleTime: 10000, 
  });

  // 4. PENGGABUNGAN DATA SISWA
  const activeUser = useMemo(() => {
    if (!user) return null;
    if (!realtimeUser) return user; 

    return {
      ...user, 
      ...realtimeUser, 
      profile: {
        ...(user.profile || {}),
        ...(realtimeUser.profile || {}), 
      },
      enrollments: (realtimeUser.enrollments && realtimeUser.enrollments.length > 0) 
        ? realtimeUser.enrollments 
        : user.enrollments,
    };
  }, [user, realtimeUser]);

  // 5. PARSER DATA SISWA
  const { className, institutionName } = useStudentParser(activeUser);

  // 6.  HANDLER START EXAM YANG TELAH DISEMPURNAKAN
  const handleStartExam = async (token: string) => {
    try {
      setIsStarting(true);
      setAccessDeniedError(null); 
      setShowSebBlocker(false);
      
      await startExam(token);
      
      toast.success("Token valid! Mengarahkan ke ruang ujian...");
      router.push("/student-exam/execute");
    } catch (error: any) {
      setIsStarting(false);
      
      // Menangkap pesan error dari Golang secara akurat
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        "Gagal terhubung ke server ujian.";

      const errLower = errorMessage.toLowerCase();

      // PRIORITAS 1: Deteksi Pelanggaran SEB
      if (errLower.includes("seb") || errLower.includes("safe exam") || errLower.includes("peramban") || errLower.includes("hash")) {
        setShowSebBlocker(true);
        return;
      }

      // PRIORITAS 2: Deteksi Pemblokiran & Selesai (Modal Merah/Warning)
      if (errLower.includes("akses ditolak") || errLower.includes("selesai") || errLower.includes("diblokir") || errLower.includes("blocked")) {
        setAccessDeniedError({
          title: "Akses Ujian Ditolak",
          message: errorMessage.replace(/Akses Ditolak:\s*/i, ""),
          type: 'blocked'
        });
      } 
      // PRIORITAS 3: Deteksi Waktu Belum Mulai / Kadaluarsa (Modal Kuning/Info)
      else if (errLower.includes("belum dimulai") || errLower.includes("waktu") || errLower.includes("berakhir")) {
        setAccessDeniedError({
          title: "Informasi Jadwal Ujian",
          message: errorMessage,
          type: 'warning'
        });
      } 
      // LAINNYA: Token salah, dll (Toast biasa)
      else {
        toast.error(errorMessage);
      }
    }
  };

  // 7. BLOKIR LAYAR JIKA SEB DILANGGAR
  if (showSebBlocker || (examData && examData.is_seb_required && !isSafeBrowser && !isStarting)) {
    return <SEBBlocker />;
  }

  if (!activeUser) return null;

  return (
    <div className="w-full flex flex-col pt-2 pb-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* KOLOM KIRI (PROFIL & WIDGET JADWAL) */}
        <div className="order-2 lg:order-1 lg:col-span-5 xl:col-span-4 flex flex-col gap-6 h-full">
          <StudentProfileCard 
            user={activeUser} 
            classNameLabel={className}
            institutionName={institutionName} 
          />
          <NavigationMenuCards />
        </div>

        {/* KOLOM KANAN (UTAMA) */}
        <div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <StudentLiveClock userName={activeUser.profile?.full_name || activeUser.username} />
            <DeviceHealthStatus 
              isSafeBrowser={isSafeBrowser} 
              isSebRequired={false} 
            />
          </div>

          <StudentStatCards />
          
          <div className="grid grid-cols-1 gap-6 relative z-10">
            <UpcomingExamsWidget exams={[]} /> 
            <TokenEntryCard onStartExam={handleStartExam} />
            
          </div>
        </div>

      </div>

      {/*  MODAL PEMBERITAHUAN DINAMIS (BLOKIR / PERINGATAN WAKTU) */}
      <Dialog open={!!accessDeniedError} onOpenChange={() => setAccessDeniedError(null)}>
        <DialogContent className="sm:max-w-md p-0 border border-slate-100 shadow-2xl rounded-[2.5rem] bg-white/95 backdrop-blur-xl overflow-hidden [&>button]:hidden z-[999]">
          <DialogTitle className="sr-only">Peringatan Akses Ujian</DialogTitle>
          
          {/* Header Modal Dinamis Berdasarkan Tipe Error */}
          <div className={`p-8 text-center relative border-b ${accessDeniedError?.type === 'blocked' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
             <div className={`mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border relative z-10 ${accessDeniedError?.type === 'blocked' ? 'border-rose-100' : 'border-amber-100'}`}>
               {accessDeniedError?.type === 'blocked' ? (
                 <ShieldAlert className="w-10 h-10 text-rose-500" />
               ) : (
                 <AlertCircle className="w-10 h-10 text-amber-500" />
               )}
             </div>
             <h2 className={`text-xl font-black tracking-tight relative z-10 ${accessDeniedError?.type === 'blocked' ? 'text-rose-950' : 'text-amber-950'}`}>
               {accessDeniedError?.title}
             </h2>
          </div>

          <div className="p-8 pb-6 text-center">
             <p className="text-sm font-medium text-slate-600 leading-relaxed">
               {accessDeniedError?.message}
             </p>
          </div>

          <div className="p-8 pt-0 flex justify-center">
             <Button 
               onClick={() => setAccessDeniedError(null)} 
               className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-widest uppercase text-xs transition-all active:scale-95 shadow-lg border-0"
             >
               Saya Mengerti
             </Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}