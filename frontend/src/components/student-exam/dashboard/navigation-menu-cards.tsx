"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, BarChart3, ChevronRight } from "lucide-react";

export function NavigationMenuCards() {
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", staggerChildren: 0.1 } },
  };

  const menuItems = [
    { 
      href: "/student-exam/history",
      icon: BookOpen, 
      title: "Riwayat Ujian", 
      desc: "Tinjau kembali hasil dan nilai.", 
    },
    { 
      href: "/student-exam/statistics",
      icon: BarChart3, 
      title: "Statistik Akademik", 
      desc: "Pantau grafik performa Anda.", 
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-2"
    >
      {menuItems.map((item, index) => (
        <motion.div key={index} variants={containerVariants}>
          <Link href={item.href} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-[1.5rem]">
            <Card className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-lg hover:border-emerald-200/50 hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all duration-300 shrink-0 shadow-inner">
                  <item.icon className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                
                <div className="flex flex-col text-left flex-1">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{item.title}</h4>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{item.desc}</p>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 border border-slate-100 shadow-sm">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </div>

              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}