// LOKASI: src/components/dashboard/views/super-admin-view.tsx
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/types/dashboard";
import { User } from "@/types/user";
import { institutionService } from "@/services/institution.service";
import { dashboardService } from "@/services/dashboard.service";
import { StatCard, QuickLinkCard } from "../widgets/dashboard-widgets";
import { Building2, GraduationCap, Users, CalendarDays, Settings, School, Activity, ShieldCheck, Server, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ViewProps {
  stats?: DashboardStats;
  user?: User | null;
  isLoading?: boolean;
}

export function SuperAdminView({ stats, user, isLoading }: ViewProps) {
  // REAL-TIME HEALTH CHECK (60 Saat)
  const { data: health } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => dashboardService.checkHealth(),
    refetchInterval: 60000, 
    refetchOnWindowFocus: true,
  });

  // FETCH LEMBAGA TERBARU (120 Saat)
  const { data: recentInstitutionsData, isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ["recent-institutions"],
    queryFn: () => institutionService.getAllPaginated({ page: 1, limit: 5 }),
    refetchInterval: 120000, 
    refetchOnWindowFocus: true,
  });

  const recentInstitutions = recentInstitutionsData?.data || [];

  return (
    <div className="space-y-6">
      {/* GRID STATISTIK GLOBAL (SELARAS 5 KOLOM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Unit Lembaga"
          value={stats?.total_institutions || 0}
          icon={<Building2 className="h-6 w-6" />}
          color="purple"
          isLoading={isLoading}
        />
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
          color="yellow"
          isLoading={isLoading}
        />
        <StatCard
          title="Akun Menunggu"
          value={stats?.pending_accounts || 0}
          icon={<UserCheck className="h-6 w-6" />}
          color="orange"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (LEBAR 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 px-1">
              <Settings className="h-5 w-5 text-emerald-600" /> Manajemen Pusat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickLinkCard
                title="Kelola Unit Lembaga"
                desc="Manajemen Lembaga, dan Pendaftaran Unit Baru"
                href="/dashboard/institutions"
                icon={<School className="h-5 w-5 text-purple-600" />}
                bgIcon="bg-purple-50"
              />
              <QuickLinkCard
                title="Manajemen Akun"
                desc="Verifikasi Pendaftar Baru dan Atur Hak Akses Pengguna"
                href="/dashboard/accounts"
                icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
                bgIcon="bg-emerald-50"
              />
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">Lembaga Terdaftar</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Data unit pendidikan di sistem</CardDescription>
                </div>
                <Link href="/dashboard/institutions" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                  Lihat Semua
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] text-slate-500 uppercase bg-white border-b border-slate-100 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Nama Lembaga</th>
                      <th className="px-5 py-3.5">Kategori</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingInstitutions ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-5 py-4 flex justify-center"><Skeleton className="h-5 w-16 rounded-full" /></td>
                        </tr>
                      ))
                    ) : recentInstitutions.length > 0 ? (
                      recentInstitutions.map((inst: any) => (
                        <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800">{inst.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inst.code}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                              {inst.category || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none text-[10px] uppercase font-bold tracking-wider shadow-sm">
                              Aktif
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-slate-500 text-sm">
                          Belum ada data lembaga terdaftar.
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
                Server Pusat
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
                    <span className="text-sm font-semibold text-slate-700">Koneksi Database</span>
                  </div>
                  <Badge className={cn(
                    "border-none shadow-none text-[10px] font-bold uppercase tracking-wider",
                    health?.status === "stable" 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-rose-100 text-rose-700 animate-pulse"
                  )}>
                    {health?.status === "stable" ? "Stabil" : "Terputus"}
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
                  Hak akses Super Admin. Data statistik ditarik secara <strong className="text-slate-700">Real-time</strong> dari Database.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}