// LOKASI: src/components/pages/finance/finance-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Wallet, FileSpreadsheet, FileDown, FileText } from "lucide-react";

interface FinanceHeaderProps {
  onImportClick: () => void;
  onExportExcelClick: () => void;
  onRukhsohClick: () => void;
}

export function FinanceHeader({ onImportClick, onExportExcelClick, onRukhsohClick }: FinanceHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <Wallet className="h-6 w-6 text-emerald-600" /> Kebendaharaan
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manajemen tagihan, penerimaan pembayaran, dan pelaporan keuangan.
        </p>
      </div>
    </div>
  );
}