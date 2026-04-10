// LOKASI: src/components/pages/questions/question-card.tsx
// Sesuaikan path import jika berbeda di proyek Anda

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle2, FileText } from "lucide-react";
import { getUniversalImageUrl } from "@/lib/axios";
import { QuestionContent } from "@/types/question";

interface QuestionCardProps {
  item: any;
  absoluteIndex: number;
  optionLabels: string[];
  onOpenEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export function QuestionCard({
  item,
  absoluteIndex,
  optionLabels,
  onOpenEdit,
  onDelete,
}: QuestionCardProps) {
  const content = (item.content || {}) as QuestionContent;
  const isItemPG = item.type === "PG";
  const imageUrl = getUniversalImageUrl(content.image_url);

  return (
    <Card className="overflow-hidden border-slate-200 shadow-md hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group bg-white">
      <CardContent className="p-0">
        {/* HEADER BAR */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center bg-[#043425] text-white rounded-lg px-3 py-1 shadow-sm shrink-0">
              <span className="text-[10px] uppercase font-bold opacity-70 leading-none mb-1">No</span>
              <span className="text-sm font-black leading-none">{absoluteIndex}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`shadow-none border-0 font-bold text-[10px] px-2.5 py-1 uppercase tracking-wider ${isItemPG ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {isItemPG ? "Pilihan Ganda" : "Essay / Uraian"}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200 bg-white shadow-none">
                BOBOT: {item.score_weight} POIN
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" onClick={() => onOpenEdit(item)} className="h-9 px-3 border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95">
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(item.id)} className="h-9 px-3 border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95">
              <Trash2 className="h-4 w-4 mr-2" /> Hapus
            </Button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="p-6 md:p-8 bg-white flex flex-col sm:flex-row gap-6 items-start">
          
          {/* 1. Gambar (Jika ada) */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 w-full sm:w-[200px] shadow-sm">
                <img src={imageUrl} alt="Lampiran" className="w-full h-auto object-contain max-h-[500px] p-2 mx-auto" />
            </div>
          )}

          {/* 2. Kontainer Redaksi + Jawaban */}
          <div className="flex-1 space-y-6 w-full">
            
            {/* Redaksi Pertanyaan */}
            <div className="flex items-start gap-3">
               <div className="mt-1 h-5 w-5 rounded bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-600 shadow-inner">
                 <FileText className="h-3 w-3" />
               </div>
               <div className="prose prose-slate max-w-none text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap text-[15px] flex-1">
                 {content.question || <span className="text-slate-400 italic font-normal">Pertanyaan belum diisi...</span>}
               </div>
            </div>

            {/* Susunan Jawaban */}
            <div className="bg-slate-50/50 rounded-2xl p-4 md:p-5 border border-slate-100">
                {isItemPG ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {optionLabels.map((opt) => {
                      const isCorrect = item.answer_key === opt;
                      const optionText = content.options?.[opt];
                      
                      // [PENYEMPURNAAN UX]: Validasi ketat untuk menyembunyikan opsi kosong atau hanya berisi spasi
                      if (!optionText || optionText.trim() === "") return null;

                      return (
                        <div key={opt} className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 h-full ${isCorrect ? "bg-white border-emerald-400 shadow-md ring-1 ring-emerald-400/20" : "bg-white border-slate-100 hover:border-slate-200"}`}>
                          <div className={`flex shrink-0 items-center justify-center h-8 w-8 rounded-lg font-black text-sm border-2 ${isCorrect ? "bg-emerald-500 border-emerald-500 text-white shadow-md" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                            {opt}
                          </div>
                          <span className={`text-[13px] mt-2 leading-tight flex-1 ${isCorrect ? "text-emerald-900 font-bold" : "text-slate-600 font-medium"} break-words`}>
                            {optionText}
                          </span>
                          {isCorrect && (
                            <div className="bg-emerald-500 rounded-full p-1 shadow-sm shrink-0 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 flex items-center gap-2">
                       <CheckCircle2 className="h-3.5 w-3.5" /> Panduan Jawaban Benar
                    </p>
                    <div className="text-sm text-slate-700 font-bold leading-relaxed whitespace-pre-wrap relative z-10 p-1 bg-emerald-50/50 rounded-md">
                      {item.answer_key || "-"}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}