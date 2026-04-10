// LOKASI: src/components/pages/finance/finance-summary-cards.tsx
"use client";

import { Wallet, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface FinanceSummaryProps {
  totalBilled?: number;
  totalPaid?: number;
  totalUnpaid?: number;
  isLoading?: boolean;
}

export function FinanceSummaryCards({ 
  totalBilled = 0, 
  totalPaid = 0, 
  totalUnpaid = 0, 
  isLoading = false 
}: FinanceSummaryProps) {
  
  const formatRupiah = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  // Menghitung persentase kelancaran
  const paymentPercentage = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Kartu 1: Total Tagihan */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">Total Tagihan (Aktif)</p>
          <h3 className="text-xl font-bold text-slate-800">
            {isLoading ? "Memuat..." : formatRupiah(totalBilled)}
          </h3>
        </div>
      </div>

      {/* Kartu 2: Pemasukan / Lunas */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">Total Pemasukan</p>
          <h3 className="text-xl font-bold text-emerald-600">
            {isLoading ? "Memuat..." : formatRupiah(totalPaid)}
          </h3>
        </div>
      </div>

      {/* Kartu 3: Sisa Tunggakan */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
        <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">Sisa Tunggakan</p>
          <h3 className="text-xl font-bold text-rose-600">
            {isLoading ? "Memuat..." : formatRupiah(totalUnpaid)}
          </h3>
        </div>
      </div>

      {/* Kartu 4: Rasio Kelancaran */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
        <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">Rasio Pembayaran</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold text-slate-800">
              {isLoading ? "..." : `${paymentPercentage}%`}
            </h3>
            <span className="text-xs text-slate-400 font-medium">dari total</span>
          </div>
        </div>
      </div>
    </div>
  );
}