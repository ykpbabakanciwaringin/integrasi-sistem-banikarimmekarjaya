"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { BookOpenText } from "lucide-react";

interface QuestionRendererProps {
  question: any;
  currentAnswer: any;
  onAnswerChange: (answer: string) => void;
  isSaving: boolean;
}

export function QuestionRenderer({ question, currentAnswer, onAnswerChange, isSaving }: QuestionRendererProps) {
  const [localText, setLocalText] = useState(currentAnswer || "");

  // Sinkronisasi teks esai saat pindah soal
  useEffect(() => {
    setLocalText(currentAnswer || "");
  }, [question?.id, currentAnswer]);

  // Auto-save untuk ESSAY dengan Debounce
  useEffect(() => {
    if (question?.type === "ESSAY") {
      const timer = setTimeout(() => {
        if (localText !== currentAnswer) onAnswerChange(localText);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [localText, question?.type, currentAnswer, onAnswerChange]);

  if (!question) return null;

  //  FIX: Menyesuaikan struktur JSON dari Backend
  const questionHtml = question.content?.question || "";
  const optionsObject = question.content?.options || {};
  const isEssay = question.type === "ESSAY";

  // Konversi opsi object { A: "text", B: "text" } menjadi array
  const optionEntries = Object.entries(optionsObject);

  const optionVariants = {
    initial: { opacity: 0, y: 10 },
    animate: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }),
    tap: { scale: 0.98 },
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault(); // Blokir Paste untuk keamanan
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-6 md:gap-8 pb-10"
      >
        {/* AREA SOAL */}
        <Card className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner">
                <BookOpenText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <Badge variant="outline" className="w-fit bg-emerald-50/50 text-emerald-700 border-emerald-200 font-bold uppercase tracking-widest text-[9px] mb-1">
                  Soal Nomor {question.order_num || "-"}
                </Badge>
                <h2 className="text-sm font-bold text-slate-500 tracking-tight">Teks Pertanyaan Utama</h2>
              </div>
            </div>

            {/* Render HTML Soal */}
            <div className="prose prose-slate prose-lg max-w-none text-slate-800 leading-loose font-medium">
              {questionHtml ? (
                <div dangerouslySetInnerHTML={{ __html: questionHtml }} />
              ) : (
                <p className="text-rose-500 italic">Teks soal tidak tersedia.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AREA PILIHAN JAWABAN / ESAI */}
        <div className="flex flex-col gap-2 relative z-10">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3 mb-2 flex items-center gap-2">
            {isEssay ? "Ketik Jawaban Anda" : "Pilih Satu Jawaban Terbaik"}
            {isSaving && <span className="text-emerald-500 text-[9px] animate-pulse">(Menyimpan...)</span>}
          </label>
          
          {isEssay ? (
            <Textarea
              placeholder="Ketik jawaban uraian Anda di sini..."
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onPaste={handlePaste}
              className="min-h-[250px] bg-white border-2 border-slate-200 focus:border-emerald-500 text-slate-800 text-lg rounded-[1.5rem] p-6 focus:ring-4 focus:ring-emerald-500/10 resize-none shadow-sm"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {optionEntries.map(([label, textValue]: [string, any], index: number) => {
                const isSelected = currentAnswer === label;
                return (
                  <motion.button
                    key={label}
                    custom={index}
                    variants={optionVariants}
                    initial="initial"
                    animate="animate"
                    whileTap="tap"
                    onClick={() => onAnswerChange(label)} // Simpan huruf kuncinya (A, B, C...)
                    className="w-full text-left outline-none"
                  >
                    <Card className={cn(
                      "rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden group",
                      isSelected 
                        ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-300 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400" 
                        : "bg-white/95 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30"
                    )}>
                      <CardContent className="p-4 md:p-5 flex items-start gap-4">
                        <div className={cn(
                          "w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center font-black text-lg border shadow-inner shrink-0 transition-colors",
                          isSelected ? "bg-emerald-600 text-white border-emerald-700" : "bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                        )}>
                          {label}
                        </div>
                        <div className="flex-1 pt-1.5">
                          <div className={cn(
                            "prose prose-sm md:prose-base leading-snug font-medium transition-colors",
                            isSelected ? "text-emerald-950 font-semibold" : "text-slate-700 group-hover:text-slate-900"
                          )} dangerouslySetInnerHTML={{ __html: textValue }} />
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0 mt-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}