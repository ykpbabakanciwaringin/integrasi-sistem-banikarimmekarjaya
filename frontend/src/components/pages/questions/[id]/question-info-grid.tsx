"use client";

import { BookOpen, Layers, FileText, LayoutList, CheckCircle2 } from "lucide-react";

interface QuestionInfoGridProps {
  subjectName: string;
  gradeLevel: string;
  questionType: string;
  totalItems: number;
  totalScore: number;
}

const InfoBox = ({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2">
      {icon && (
        <div className="h-6 w-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
          {icon}
        </div>
      )}
      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</p>
    </div>
    <p className="font-bold text-slate-800 text-sm">{value || "-"}</p>
  </div>
);

export function QuestionInfoGrid({
  subjectName, gradeLevel, questionType, totalItems, totalScore,
}: QuestionInfoGridProps) {
  
  //  FIX: Deteksi teks tipe soal yang mendukung "MIXED"
  const getTypeText = (type: string) => {
    if (type === "PG") return "Pilihan Ganda";
    if (type === "ESSAY") return "Essay / Uraian";
    return "Campuran (PG & Essay)";
  };

  return (
    <div className="bg-slate-50/50 p-6 grid grid-cols-2 md:grid-cols-5 gap-4 rounded-b-2xl border-x border-b border-slate-200 shadow-sm">
      <InfoBox icon={<BookOpen className="h-4 w-4" />} label="Mata Pelajaran" value={subjectName} />
      <InfoBox icon={<Layers className="h-4 w-4" />} label="Kelas" value={`Kelas ${gradeLevel}`} />
      <InfoBox icon={<FileText className="h-4 w-4" />} label="Tipe Soal" value={getTypeText(questionType)} />
      <InfoBox icon={<LayoutList className="h-4 w-4" />} label="Jumlah Soal" value={`${totalItems} Butir`} />
      
      {/* INDIKATOR SKOR DINAMIS */}
      <div className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-2 hover:shadow-md transition-all ${totalScore !== 100 ? "border-amber-200/60" : "border-slate-200"}`}>
        <div className="flex items-center gap-2">
          <div className={`h-6 w-6 rounded-md flex items-center justify-center border ${totalScore !== 100 ? "bg-amber-50 border-amber-100 text-amber-500" : "bg-emerald-50 border-emerald-100 text-emerald-500"}`}>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Bobot</p>
        </div>
        <p className={`font-black text-lg ${totalScore !== 100 ? "text-amber-600" : "text-emerald-600"}`}>
          {totalScore} <span className="text-sm font-semibold">Poin</span>
        </p>
      </div>
    </div>
  );
}