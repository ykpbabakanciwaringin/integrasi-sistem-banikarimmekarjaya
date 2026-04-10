// LOKASI: src/components/dashboard/widgets/dashboard-widgets.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; //  TAMBAHAN: Untuk efek loading
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// --- KOMPONEN KARTU STATISTIK ---
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "orange" | "yellow" | "purple";
  isLoading?: boolean; //  PERBAIKAN: Menambahkan izin untuk menerima status loading
}

export function StatCard({ title, value, icon, color, isLoading }: StatCardProps) {
  const colors = {
    emerald: "border-emerald-100/60 bg-gradient-to-br from-emerald-50/50 to-white",
    blue: "border-blue-100/60 bg-gradient-to-br from-blue-50/50 to-white",
    orange: "border-orange-100/60 bg-gradient-to-br from-orange-50/50 to-white",
    yellow: "border-amber-100/60 bg-gradient-to-br from-amber-50/50 to-white",
    purple: "border-purple-100/60 bg-gradient-to-br from-purple-50/50 to-white",
  };

  const iconColors = {
    emerald: "bg-emerald-100/80 text-emerald-600",
    blue: "bg-blue-100/80 text-blue-600",
    orange: "bg-orange-100/80 text-orange-600",
    yellow: "bg-amber-100/80 text-amber-600",
    purple: "bg-purple-100/80 text-purple-600",
  };

  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl group", colors[color])}>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{title}</p>
          
          {/*  PERBAIKAN: Jika sedang loading, tampilkan Skeleton. Jika selesai, tampilkan angka */}
          {isLoading ? (
            <Skeleton className="h-9 w-16 rounded-md bg-slate-200/50 mt-1" />
          ) : (
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
          )}
          
        </div>
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shrink-0", iconColors[color])}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

// --- KOMPONEN TOMBOL AKSES CEPAT ---
interface QuickLinkCardProps {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  bgIcon: string;
}

export function QuickLinkCard({ title, desc, href, icon, bgIcon }: QuickLinkCardProps) {
  return (
    <Link href={href} className="block h-full outline-none focus-visible:ring-2 ring-emerald-500 rounded-xl">
      <Card className="border-slate-200 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 group cursor-pointer h-full rounded-xl bg-white">
        <CardContent className="p-5 flex items-start gap-4">
          <div className={cn("p-3 rounded-xl shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm", bgIcon)}>
            {icon}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors flex items-center justify-between">
              {title}
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// --- KOMPONEN ITEM AKTIVITAS ---
interface ActivityItemProps {
  title: string;
  time: string;
  status: "success" | "warning" | "info";
}

export function ActivityItem({ title, time, status }: ActivityItemProps) {
  const statusColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };

  return (
    <div className="flex items-start gap-4 group">
      <div className="relative mt-1">
        <div className={cn("w-2.5 h-2.5 rounded-full ring-4 ring-white z-10 relative", statusColors[status])}></div>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-10 bg-slate-100 group-last:hidden"></div>
      </div>
      <div className="flex flex-col pb-4 group-last:pb-0">
        <p className="text-sm font-bold text-slate-700">{title}</p>
        <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{time}</span>
      </div>
    </div>
  );
}