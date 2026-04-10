// LOKASI: src/components/pages/finance/finance-table.tsx
"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, UserCircle, CheckCircle2 } from "lucide-react";
import { FinanceBilling } from "@/types/finance";
import { FinancePagination } from "./finance-pagination";
import { FinanceTableEmpty } from "./finance-table-empty";

interface FinanceTableProps {
  billings: FinanceBilling[];
  isLoading: boolean;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onPaymentClick: (billing: FinanceBilling) => void;
}

export function FinanceTable({
  billings, isLoading, page, limit, totalItems, totalPages,
  onPageChange, onLimitChange, onPaymentClick
}: FinanceTableProps) {
  
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shadow-none px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1"/>Lunas</Badge>;
      case "partial": return <Badge className="bg-amber-100 text-amber-700 border-amber-200 shadow-none px-2 py-0.5">Cicilan</Badge>;
      default: return <Badge className="bg-rose-100 text-rose-700 border-rose-200 shadow-none px-2 py-0.5">Belum Lunas</Badge>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto relative min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50/80 sticky top-0 z-10 shadow-sm backdrop-blur-sm border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[11px] font-black uppercase text-slate-500 w-[50px] text-center">No</TableHead>
              <TableHead className="text-[11px] font-black uppercase text-slate-500 min-w-[250px]">Nama Lengkap</TableHead>
              <TableHead className="text-[11px] font-black uppercase text-slate-500">Rincian Tagihan</TableHead>
              <TableHead className="text-[11px] font-black uppercase text-slate-500 text-right">Nominal</TableHead>
              <TableHead className="text-[11px] font-black uppercase text-slate-500 text-right">Sisa Tagihan</TableHead>
              <TableHead className="text-[11px] font-black uppercase text-slate-500 text-center">Status</TableHead>
              <TableHead className="text-[11px] font-black uppercase text-slate-500 text-center w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="h-[400px] text-center"><Loader2 className="animate-spin h-8 w-8 text-emerald-500 mx-auto" /></TableCell></TableRow>
            ) : billings.length === 0 ? (
              <FinanceTableEmpty colSpan={7} />
            ) : (
              billings.map((bill, idx) => {
                const isPaid = bill.status === "paid";
                const studentName = bill.student?.profile?.full_name || bill.student?.username || "Tanpa Nama";
                const studentUnit = bill.student?.profile?.program || bill.student?.profile?.sekolah || "-";
                
                return (
                  <TableRow key={bill.id} className="hover:bg-slate-50/50 group transition-colors">
                    <TableCell className="text-center text-xs font-medium text-slate-500">
                      {(page - 1) * limit + idx + 1}
                    </TableCell>
                    
                    {/* IDENTITAS TERPADU */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0 ring-2 ring-white shadow-sm">
                          {studentName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{studentName}</span>
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <span className="text-slate-400 border border-slate-200 px-1 rounded uppercase tracking-wider text-[9px]">{bill.student?.username}</span>
                            {studentUnit}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* RINCIAN TAGIHAN */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{bill.category?.name || "Lainnya"}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{bill.period_name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold text-slate-700 text-sm">
                      {formatRupiah(bill.billed_amount)}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <span className={`font-black text-sm ${isPaid ? 'text-slate-300' : 'text-rose-600'}`}>
                        {formatRupiah(bill.remaining_amount)}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      {getStatusBadge(bill.status)}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button 
                        size="sm" 
                        variant={isPaid ? "ghost" : "default"}
                        className={`w-full h-8 text-xs font-bold transition-all ${isPaid ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200'}`}
                        onClick={() => onPaymentClick(bill)}
                        disabled={isPaid}
                      >
                        {isPaid ? "Selesai" : <><Wallet className="w-3 h-3 mr-1.5" /> Bayar</>}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <FinancePagination 
        page={page} limit={limit} 
        totalItems={totalItems} totalPages={totalPages}
        onPageChange={onPageChange} onLimitChange={onLimitChange} 
      />
    </div>
  );
}