// LOKASI: src/components/pages/finance/finance-table-empty.tsx
"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { FolderSearch, Receipt } from "lucide-react";

interface FinanceTableEmptyProps {
  colSpan: number;
  searchQuery?: string;
}

export function FinanceTableEmpty({ colSpan, searchQuery }: FinanceTableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-[400px] text-center">
        <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-50 rounded-full blur-xl opacity-50"></div>
            {searchQuery ? <FolderSearch className="h-16 w-16 text-slate-300 relative" /> : <Receipt className="h-16 w-16 text-slate-300 relative" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-700">
              {searchQuery ? "Tagihan Tidak Ditemukan" : "Belum Ada Data Tagihan"}
            </h3>
            <p className="text-sm text-slate-500 max-w-[400px] mx-auto">
              {searchQuery 
                ? `Sistem tidak menemukan tagihan yang cocok dengan kata kunci "${searchQuery}" atau filter yang Anda terapkan.` 
                : "Rekapitulasi Pembayaran saat ini kosong. Silakan gunakan tab Import Excel untuk mulai memasukkan data tagihan."}
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}