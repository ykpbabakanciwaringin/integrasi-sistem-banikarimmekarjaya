// LOKASI: src/components/ui/info-box-small.tsx
"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoBoxSmallProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
  className?: string;
}

export function InfoBoxSmall({ 
  icon: Icon, 
  iconColor, 
  iconBg, 
  label, 
  value,
  className 
}: InfoBoxSmallProps) {
  // UX: Deteksi jika data kosong / tidak relevan
  const isEmpty = value === "-" || value === "" || value === "Belum diisi" || value === "Tidak Mukim" || value === "Tidak Ikut Program" || value === "Alamat belum dilengkapi";

  return (
    <div className={cn(
      "flex items-start gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-100 transition-colors group w-full",
      className
    )}>
      <div className={cn(
        "w-9 h-9 mt-0.5 rounded-xl flex items-center justify-center shrink-0 border border-white shadow-inner group-hover:scale-105 transition-transform",
        iconBg,
        isEmpty && "opacity-60 grayscale"
      )}>
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
      <div className="flex flex-col items-start text-left w-full">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </span>
        <span 
          className={cn(
            //  FIX FINAL: Menambahkan kelas 'uppercase' dan 'tracking-wider' agar seluruh data menjadi huruf kapital
            "text-xs leading-relaxed break-words whitespace-normal w-full uppercase tracking-wider",
            isEmpty ? "text-slate-400 italic font-medium" : "text-slate-800 font-bold"
          )} 
        >
          {value}
        </span>
      </div>
    </div>
  );
}