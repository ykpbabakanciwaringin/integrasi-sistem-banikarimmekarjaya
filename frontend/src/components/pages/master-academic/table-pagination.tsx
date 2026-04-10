// LOKASI: src/components/ui/table-pagination.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function TablePagination({
  page,
  limit,
  totalItems,
  totalPages,
  onPageChange,
  onLimitChange,
}: TablePaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
      <div className="flex items-center gap-3">
        <div className="text-xs text-slate-500">
          Total <span className="font-bold text-slate-800">{totalItems}</span> data
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <span className="text-[11px] text-slate-500 font-medium">
            Baris per halaman:
          </span>
          <Select
            value={limit.toString()}
            onValueChange={(v) => onLimitChange(Number(v))}
          >
            <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0">
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
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs bg-white shadow-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
        </Button>
        <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
          Hal {page} / {totalPages > 0 ? totalPages : 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs bg-white shadow-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}