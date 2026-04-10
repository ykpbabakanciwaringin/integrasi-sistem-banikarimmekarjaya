"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, BarChart4, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";

export function StudentStatCards() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6"
    >
      <motion.div variants={itemVariants}>
        <StatCard 
          title="Ujian Selesai" 
          value="0" 
          desc="Total sesi yang dikerjakan" 
          icon={<CheckCircle2 className="w-5 h-5" />} 
          color="emerald" 
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard 
          title="Rata-rata Nilai" 
          value="-" 
          desc="Akumulasi seluruh ujian" 
          icon={<BarChart4 className="w-5 h-5" />} 
          color="blue" 
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard 
          title="Waktu Aktif" 
          value="0j 0m" 
          desc="Total waktu pengerjaan" 
          icon={<Clock className="w-5 h-5" />} 
          color="yellow" 
        />
      </motion.div>
    </motion.div>
  );
}

// --- SUB KOMPONENT ---
interface StatCardProps {
  title: string;
  value: number | string;
  desc: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "yellow";
}

function StatCard({ title, value, desc, icon, color }: StatCardProps) {
  const colors = {
    emerald: "border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white/95",
    blue: "border-blue-100 bg-gradient-to-br from-blue-50/50 to-white/95",
    yellow: "border-amber-100 bg-gradient-to-br from-amber-50/50 to-white/95",
  };

  const iconColors = {
    emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    yellow: "bg-amber-100 text-amber-600 border-amber-200",
  };

  return (
    <Card className={cn("backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 rounded-[1.5rem] group border", colors[color])}>
      <CardContent className="p-5 md:p-6 flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {value}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            {desc}
          </p>
        </div>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 duration-300 border", iconColors[color])}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}