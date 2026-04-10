// LOKASI: src/components/dashboard/views/admin-institution-view.tsx
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/types/dashboard";
import { User } from "@/types/user";
import { studentService } from "@/services/student.service";
import { dashboardService } from "@/services/dashboard.service";
import { StatCard, QuickLinkCard } from "../widgets/dashboard-widgets";
import { GraduationCap, Users, School, CalendarDays, Activity, ShieldCheck, UserCheck, Server } from "lucide-react";
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

export function AdminInstitutionView({ stats, user, isLoading }: ViewProps) {
  // REAL-TIME HEALTH CHECK (60 Saat)
  const { data: health } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => dashboardService.checkHealth(),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // FETCH SISWA TERBARU (120 Saat)
  const { data: recentStudentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["recent-students", user?.institution_id],
    queryFn: () => studentService.getAll({ 
      limit: 5, 
      institution_id: user?.institution_id || "ALL" 
    }),
    enabled: !!user?.institution_id,
    refetchInterval: 120000, 
    refetchOnWindowFocus: true,
  });

  const recentStudents = recentStudentsData?.data || [];

  return (
    <div className="space-y-6">
      {/* GRID STATISTIK LEMBAGA (SELARAS 5 KOLOM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Siswa"
          value={stats?.total_students || 0}
          icon={<GraduationCap className="h-6 w-6" />}
          color="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="Pendidik (Guru)"
          value={stats?.total_teachers || 0}
          icon={<Users className="h-6 w-6" />}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Staf & Admin"
          value={stats?.total_staff || 0}
          icon={<ShieldCheck className="h-6 w-6" />}
          color="purple"
          isLoading={isLoading}
        />
        <StatCard
          title="Akun Menunggu"
          value={stats?.pending_accounts || 0}
          icon={<UserCheck className="h-6 w-6" />}
          color="orange"
          isLoading={isLoading}
        />
        <StatCard
          title="Sesi Ujian Aktif"
          value={stats?.active_exams || 0}
          icon={<CalendarDays className="h-6 w-6" />}
          color="yellow"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (LEBAR 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 px-1">
              <School className="h-5 w-5 text-emerald-600" /> Operasional Lembaga
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickLinkCard
                title="Pangkalan Data Siswa"
                desc="Kelola data siswa, mutasi, dan kartu pelajar."
                href="/dashboard/students"
                icon={<GraduationCap className="h-5 w-5 text-emerald-600" />}
                bgIcon="bg-emerald-50"
              />
              <QuickLinkCard
                title="Manajemen Akun"
                desc="Verifikasi pendaftar baru khusus di lembaga ini."
                href="/dashboard/accounts"
                icon={<UserCheck className="h-5 w-5 text-blue-600" />}
                bgIcon="bg-blue-50"
              />
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">Siswa Baru Berdaftar</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Data peserta didik terbaru di lembaga anda</CardDescription>
                </div>
                <Link href="/dashboard/students" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                  Lihat Semua
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] text-slate-500 uppercase bg-white border-b border-slate-100 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Profil Siswa</th>
                      <th className="px-5 py-3.5">NISN</th>
                      <th className="px-5 py-3.5 text-center">Jenis Kelamin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingStudents ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-5 py-4 flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-5 py-4 flex justify-center"><Skeleton className="h-5 w-8 rounded-md" /></td>
                        </tr>
                      ))
                    ) : recentStudents.length > 0 ? (
                      recentStudents.map((student: any) => {
                        const avatarUrl = getUniversalImageUrl(student.profile?.image);
                        const initials = (student.profile?.full_name || "S").substring(0, 2).toUpperCase();
                        
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-5 py-3 flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-slate-200">
                                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-slate-800 text-xs">{student.profile?.full_name || "Tanpa Nama"}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">@{student.username}</p>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                {student.profile?.nisn || "-"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <Badge variant="outline" className={cn(
                                "border-none shadow-none text-[10px] font-bold uppercase tracking-wider",
                                student.profile?.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                              )}>
                                {student.profile?.gender === 'L' ? 'Laki-laki' : student.profile?.gender === 'P' ? 'Perempuan' : '-'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-slate-500 text-sm">
                          Belum ada data siswa di lembaga ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN (LEBAR 1/3): MONITOR KESIHATAN */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 px-1">
            <Activity className="h-5 w-5 text-emerald-600" /> Kondisi Sistem
          </h3>
          <Card className="h-[calc(100%-2.5rem)] border-slate-200 shadow-sm bg-white overflow-hidden relative flex flex-col rounded-2xl">
            <div className={cn(
              "absolute top-0 left-0 w-full h-1 transition-colors duration-500",
              health?.status === "stable" ? "bg-emerald-500" : "bg-rose-500"
            )}></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center justify-between">
                {user?.institution_name || "Lembaga"}
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    health?.status === "stable" ? "bg-emerald-400" : "bg-rose-400"
                  )}></span>
                  <span className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5",
                    health?.status === "stable" ? "bg-emerald-500" : "bg-rose-500"
                  )}></span>
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Status Koneksi Ke Database Pusat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Server className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Database</span>
                  </div>
                  <Badge className={cn(
                    "border-none shadow-none text-[10px] font-bold uppercase tracking-wider",
                    health?.status === "stable" 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-rose-100 text-rose-700 animate-pulse"
                  )}>
                    {health?.status === "stable" ? "Stabil" : "Gangguan"}
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
                  Akses Admin Terverifikasi. Kelola data siswa dan akademik lembaga anda secara <strong className="text-slate-700">Mandiri</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}