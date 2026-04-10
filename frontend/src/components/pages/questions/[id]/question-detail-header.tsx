"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Plus, FileSpreadsheet } from "lucide-react";

interface QuestionDetailHeaderProps {
  title: string;
  subjectCode: string;
  onOpenImport: () => void;
  onOpenAdd: () => void;
}

export function QuestionDetailHeader({
  title, subjectCode, onOpenImport, onOpenAdd,
}: QuestionDetailHeaderProps) {
  return (
    <div className="bg-[#043425] p-8 relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6 shrink-0 rounded-t-2xl">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="text-white relative z-10">
        <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30 font-mono tracking-widest px-3 mb-3 text-[10px] shadow-none">
          KODE: {subjectCode || "MAPEL"}
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 leading-tight">
          {title}
        </h1>
        <p className="text-emerald-100/70 text-sm flex items-center gap-2">
          <Layers className="h-4 w-4" /> Kelola butir soal, kunci jawaban, dan distribusi bobot nilai.
        </p>
      </div>
      
      <div className="flex flex-wrap gap-3 relative z-10">
        <Button 
          onClick={onOpenImport} 
          variant="outline" 
          className="bg-white/5 border-white/20 text-white hover:bg-white/20 hover:text-white font-bold transition-all h-11 active:scale-95"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Impor Excel
        </Button>
        <Button 
          onClick={onOpenAdd} 
          className="bg-emerald-500 hover:bg-emerald-400 text-[#043425] shadow-lg font-bold transition-all h-11 active:scale-95 border-none"
        >
          <Plus className="mr-2 h-5 w-5" /> Tambah Soal
        </Button>
      </div>
    </div>
  );
}