// LOKASI: src/components/pages/finance/finance-pagination.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FinancePaginationProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function FinancePagination({ page, limit, totalItems, totalPages, onPageChange, onLimitChange }: FinancePaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="text-sm text-slate-500 font-medium">
        Menampilkan <span className="font-bold text-slate-700">{(page - 1) * limit + 1}</span> - <span className="font-bold text-slate-700">{Math.min(page * limit, totalItems)}</span> dari <span className="font-bold text-slate-700">{totalItems}</span> tagihan
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Tampilkan:</span>
          <Select value={limit.toString()} onValueChange={(val) => onLimitChange(Number(val))}>
            <SelectTrigger className="h-8 w-[70px] text-xs bg-white border-slate-200 shadow-sm focus:ring-emerald-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-sm text-slate-600 hover:text-emerald-600 hover:border-emerald-200" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-emerald-700 shadow-sm min-w-[80px] text-center">
            Hal {page} / {totalPages || 1}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-sm text-slate-600 hover:text-emerald-600 hover:border-emerald-200" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}