// LOKASI: src/components/pages/questions/[id]/question-preview-tab.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Pencil } from "lucide-react";
import { getUniversalImageUrl } from "@/lib/axios";
import { QuestionContent } from "@/types/question";
import { QuestionDetailPagination } from "./question-detail-pagination";

interface QuestionPreviewTabProps {
  packetTitle: string;
  currentItems: any[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  // isEssay dihapus
  optionLabels: string[];
  setCurrentPage: (val: number | ((prev: number) => number)) => void;
}

export function QuestionPreviewTab({
  packetTitle, currentItems, currentPage, itemsPerPage,
  totalItems, totalPages, optionLabels, setCurrentPage,
}: QuestionPreviewTabProps) {
  return (
    <div className="bg-slate-100 p-6 md:p-10 rounded-2xl border border-slate-200 min-h-[600px] shadow-inner">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 font-bold px-3 py-1 shadow-sm uppercase tracking-wider text-[10px]">Mode Pratinjau Ujian</Badge>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{packetTitle}</h2>
          <p className="text-slate-500 text-sm">Tampilan ini mensimulasikan layar pengerjaan ujian siswa sesungguhnya.</p>
        </div>

        <div className="space-y-8">
          {currentItems.map((item, index) => {
            const absoluteIndex = (currentPage - 1) * itemsPerPage + index + 1;
            const content = (item.content || {}) as QuestionContent;
            const isItemPG = item.type === "PG"; //  FIX: Baca tipe per soal
            const imageUrl = getUniversalImageUrl(content.image_url);

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex">
                  <div className="bg-slate-50 w-12 md:w-16 flex flex-col items-center pt-6 border-r border-slate-100 shrink-0">
                    <span className="font-bold text-lg text-slate-400">{absoluteIndex}.</span>
                  </div>
                  <div className="p-6 md:p-8 w-full">
                    {/* Render Gambar (Otomatis bekerja karena proses upload sudah diperbaiki) */}
                    {imageUrl && (
                      <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 inline-block">
                        <img src={imageUrl} alt="Lampiran" className="w-full h-auto max-h-[300px] object-contain" />
                      </div>
                    )}
                    
                    <div className="prose prose-slate max-w-none font-medium text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                      {content.question}
                    </div>

                    {isItemPG ? (
                      <RadioGroup className="mt-8 space-y-3">
                        {optionLabels.map((opt) => {
                           const optionText = content.options?.[opt];
                           
                           // [PENYEMPURNAAN UX]: Sembunyikan jika opsi kosong atau hanya berisi spasi
                           if (!optionText || optionText.trim() === "") return null;
                           
                           return (
                             <div key={opt} className="flex items-start space-x-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-colors cursor-pointer">
                               <RadioGroupItem value={opt} id={`preview-${item.id}-${opt}`} className="mt-1 border-slate-300 text-emerald-600" />
                               <Label htmlFor={`preview-${item.id}-${opt}`} className="text-[14px] leading-snug cursor-pointer font-normal text-slate-700 select-none w-full">
                                 <span className="font-bold mr-2 text-slate-400">{opt}.</span> 
                                 {optionText}
                               </Label>
                             </div>
                           );
                        })}
                      </RadioGroup>
                    ) : (
                      <div className="mt-6">
                        <Label className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-wider"><Pencil className="h-4 w-4" /> Lembar Jawaban:</Label>
                        <Textarea placeholder="Siswa akan mengetik jawaban di sini..." className="bg-slate-50 border-2 border-slate-200 rounded-xl min-h-[120px] text-sm resize-none focus:bg-white focus:border-emerald-500 transition-colors shadow-inner p-4" disabled />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
          <QuestionDetailPagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}