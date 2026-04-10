// LOKASI: src/components/pages/questions/question-editor-tab.tsx
"use client";

import { LayoutList } from "lucide-react";
import { QuestionDetailPagination } from "./question-detail-pagination";
import { QuestionCard } from "./question-card";

interface QuestionEditorTabProps {
  currentItems: any[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  optionLabels: string[];
  setItemsPerPage: (val: number) => void;
  setCurrentPage: (val: number | ((prev: number) => number)) => void;
  onOpenEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onOpenAdd: () => void;
}

export function QuestionEditorTab({
  currentItems,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  optionLabels,
  setCurrentPage,
  onOpenEdit,
  onDelete,
  onOpenAdd,
}: QuestionEditorTabProps) {
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {currentItems.length > 0 ? (
        <div className="space-y-6">
          {/* Looping Kartu Soal yang sudah diekstrak */}
          {currentItems.map((item, index) => {
            const absoluteIndex = (currentPage - 1) * itemsPerPage + index + 1;
            
            return (
              <QuestionCard
                key={item.id}
                item={item}
                absoluteIndex={absoluteIndex}
                optionLabels={optionLabels}
                onOpenEdit={onOpenEdit}
                onDelete={onDelete}
              />
            );
          })}
          
          {/* Paginasi Tetap Berada di Bawah */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-4">
            <QuestionDetailPagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              totalItems={totalItems} 
              itemsPerPage={itemsPerPage} 
              setCurrentPage={setCurrentPage} 
            />
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-32 bg-white border border-dashed border-slate-300 rounded-3xl shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
            <LayoutList className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Paket Soal Masih Kosong</h3>
          <p className="text-slate-500 text-sm mt-1 mb-8 text-center max-w-xs leading-relaxed">
            Belum ada butir soal. Klik tombol <strong>Tambah Soal</strong> di bagian atas untuk memulai.
          </p>
        </div>
      )}
    </div>
  );
}