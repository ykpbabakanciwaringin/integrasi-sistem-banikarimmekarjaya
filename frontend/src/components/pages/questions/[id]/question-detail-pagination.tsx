"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuestionDetailPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export function QuestionDetailPagination({
  currentPage, totalPages, totalItems, itemsPerPage, setCurrentPage,
}: QuestionDetailPaginationProps) {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        Menampilkan <span className="font-bold text-slate-800">{startItem}</span> - <span className="font-bold text-slate-800">{endItem}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> soal
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs bg-white shadow-sm border-slate-200 hover:text-emerald-700 hover:border-emerald-200"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
        </Button>
        
        <div className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm min-w-[70px] text-center">
          Hal {currentPage} / {totalPages || 1}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs bg-white shadow-sm border-slate-200 hover:text-emerald-700 hover:border-emerald-200"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}