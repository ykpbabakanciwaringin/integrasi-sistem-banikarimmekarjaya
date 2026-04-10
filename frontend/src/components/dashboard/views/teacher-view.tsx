// LOKASI: src/components/dashboard/views/teacher-view.tsx
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/types/dashboard";
import { User } from "@/types/user";
import { scheduleService } from "@/services/schedule.service";
import { dashboardService } from "@/services/dashboard.service";
import { StatCard, QuickLinkCard } from "../widgets/dashboard-widgets";
import { BookOpen, CalendarDays, ClipboardList, Activity, ShieldCheck, Server, School } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getUniversalImageUrl } from "@/lib/axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ViewProps {
  stats?: DashboardStats;
  user?: User | null;
  isLoading?: boolean;
}

export function TeacherView({ stats, user, isLoading }: ViewProps) {
  // REAL-TIME HEALTH CHECK (60 Saat)
  const { data: health } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => dashboardService.checkHealth(),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // FETCH KELAS DIAMPU (Dicache 5 minit kerana jarang berubah)
  const { data: allocationsData, isLoading: isLoadingAllocations } = useQuery({
    queryKey: ["teacher-allocations", user?.id],
    queryFn: () => scheduleService.getAllocations({ teacher_id: user?.id }),
    enabled: !!user?.id,
    staleTime: 300000, 
    refetchOnWindowFocus: true,
  });

  const recentAllocations = Array.isArray(allocationsData) ? allocationsData.slice(0, 5) : [];

  return (
    <div className="space-y-6">
      {/* GRID STATISTIK GURU (SELARAS 4 KOLOM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Kelas Diampu"
          value={Array.isArray(allocationsData) ? allocationsData.length : 0}
          icon={<School className="h-6 w-6" />}
          color="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="Mata Pelajaran"
          value={Array.from(new Set(recentAllocations.map((a: any) => a.subject_id))).length}
          icon={<BookOpen className="h-6 w-6" />}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Sesi Ujian Aktif"
          value={stats?.active_exams || 0}
          icon={<CalendarDays className="h-6 w-6" />}
          color="orange"
          isLoading={isLoading}
        />
        <StatCard
          title="Tahun Ajaran"
          value={recentAllocations[0]?.academic_year?.name || "Aktif"}
          icon={<Activity className="h-6 w-6" />}
          color="purple"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (LEBAR 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 px-1">
              <ClipboardList className="h-5 w-5 text-emerald-600" /> Ruang Kerja Guru
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickLinkCard
                title="Jurnal Mengajar & Presensi"
                desc="Input kehadiran siswa dan ringkasan pembelajaran."
                href="/dashboard/journals"
                icon={<ClipboardList className="h-5 w-5 text-emerald-600" />}
                bgIcon="bg-emerald-50"
              />
              <QuickLinkCard
                title="Bank Soal Ujian"
                desc="Kelola soal ujian sesuai pelajaran yang anda ampu."
                href="/dashboard/questions"
                icon={<BookOpen className="h-5 w-5 text-blue-600" />}
                bgIcon="bg-blue-50"
              />
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">Kelas yang Diampu</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Daftar penugasan mata pelajaran anda</CardDescription>
                </div>
                <Link href="/dashboard/manage-lessons" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                  Lihat Jadual
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] text-slate-500 uppercase bg-white border-b border-slate-100 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Mata Pelajaran</th>
                      <th className="px-5 py-3.5">Kelas</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingAllocations ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-5 py-4 flex justify-center"><Skeleton className="h-5 w-12 rounded-full" /></td>
                        </tr>
                      ))
                    ) : recentAllocations.length > 0 ? (
                      recentAllocations.map((alloc: any) => (
                        <tr key={alloc.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800">{alloc.subject?.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{alloc.subject?.code}</p>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-semibold">
                              {alloc.class?.name}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-center">
                             <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] uppercase font-bold tracking-wider shadow-sm">Aktif</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-slate-500 text-sm">Belum ada penugasan mengajar.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN (LEBAR 1/3): PROFIL & KESIHATAN SISTEM */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 px-1">
            <Activity className="h-5 w-5 text-emerald-600" /> Profil & Sistem
          </h3>
          <Card className="h-[calc(100%-2.5rem)] border-slate-200 shadow-sm bg-white overflow-hidden relative flex flex-col rounded-2xl">
            <div className={cn(
              "absolute top-0 left-0 w-full h-1 transition-colors duration-500",
              health?.status === "stable" ? "bg-emerald-500" : "bg-rose-500"
            )}></div>
            <CardHeader className="pb-3 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-emerald-100 shadow-sm">
                  <AvatarImage src={getUniversalImageUrl(user?.profile?.image) || undefined} className="object-cover" />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-lg">
                    {(user?.profile?.full_name || user?.username || "G").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">{user?.profile?.full_name || user?.username}</CardTitle>
                  <CardDescription className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 mt-0.5">
                    {user?.institution_name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-2.5">
                     <Server className="h-4 w-4 text-slate-400" />
                     <span className="text-sm font-semibold text-slate-700">Status Server</span>
                   </div>
                   <Badge className={cn(
                    "border-none shadow-none text-[10px] font-bold uppercase tracking-wider",
                    health?.status === "stable" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700 animate-pulse"
                  )}>
                    {health?.status === "stable" ? "Normal" : "Gangguan"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-2.5">
                     <Activity className="h-4 w-4 text-slate-400" />
                     <span className="text-sm font-semibold text-slate-700">Latensi API</span>
                   </div>
                   <span className={cn(
                    "text-xs font-mono font-bold px-2.5 py-1 rounded-md border",
                    (health?.latency || 0) < 150 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                      : "text-amber-700 bg-amber-50 border-amber-100"
                  )}>
                     ~{health?.latency || 0}ms
                   </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 text-center">
                <ShieldCheck className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-50" />
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                   Akse pendidik anda terverifikasi sistem. Silahkan lanjutkan aktivitas akademik anda.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}