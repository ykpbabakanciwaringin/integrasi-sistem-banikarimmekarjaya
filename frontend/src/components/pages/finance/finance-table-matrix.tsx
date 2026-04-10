// LOKASI: src/components/pages/finance/finance-table-matrix.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; 
import { 
  Loader2, Minus, CheckCircle2, Clock, XCircle, LayoutGrid, 
  List, CreditCard, Wallet, FileText, FileDown, Printer 
} from "lucide-react"; 
import { FinanceBilling } from "@/types/finance";
import { FinanceTableEmpty } from "./finance-table-empty";

interface FinanceTableMatrixProps {
  billings: FinanceBilling[];
  isLoading: boolean;
  onExportExcelClick: () => void;
  onRukhsohClick: () => void;
  onPrintPDFClick: () => void; //  Tambahkan props baru untuk PDF
}

export function FinanceTableMatrix({ 
  billings, 
  isLoading, 
  onExportExcelClick, 
  onRukhsohClick,
  onPrintPDFClick 
}: FinanceTableMatrixProps) {
  const [viewMode, setViewMode] = useState<"simple" | "detail">("simple");

  const formatRupiah = (amount: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  const { columns, matrixData } = useMemo(() => {
    if (!billings || billings.length === 0) return { columns: [], matrixData: [] };

    const uniqueColumnsMap = new Map<string, { id: string, name: string, alias: string, target_unit: string }>();
    
    billings.forEach(b => {
      if (!uniqueColumnsMap.has(b.category_id)) {
        uniqueColumnsMap.set(b.category_id, {
          id: b.category_id,
          name: b.category?.name || "Belum Tervalidasi",
          alias: b.category?.alias || b.category?.name || "Lainnya",
          target_unit: b.category?.target_unit || "Umum",
        });
      }
    });

    const columns = Array.from(uniqueColumnsMap.values()).sort((a, b) => a.alias.localeCompare(b.alias));

    const studentMap = new Map<string, any>();

    billings.forEach((billing) => {
      const studentId = billing.student_id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student_id: billing.student_id,
          nis: billing.student?.username || "-",
          name: billing.student?.profile?.full_name || billing.student?.username || "Tanpa Nama",
          unit: billing.student?.profile?.program || billing.student?.profile?.sekolah || "-",
          bills: {}, 
          totalDebt: 0,
        });
      }

      const studentData = studentMap.get(studentId);
      studentData.bills[billing.category_id] = billing;
      studentData.totalDebt += billing.remaining_amount;
    });

    return { columns, matrixData: Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name)) };
  }, [billings]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
        <p className="text-sm text-slate-500 font-medium">Memuat Buku Besar Keuangan...</p>
      </div>
    );
  }

  if (matrixData.length === 0) {
    return <FinanceTableEmpty colSpan={10} />;
  }

  return (
    <div className="space-y-4 print:space-y-0">
      {/*  HEADER CONTROLLER (Sembunyikan saat cetak) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm print:hidden">
        
        <p className="text-sm text-slate-500 font-medium">
          Ditemukan <span className="font-bold text-slate-800">{matrixData.length}</span> Santri.
        </p>
        
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
            <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-amber-50 text-amber-600 border-amber-200" onClick={onRukhsohClick}>
              <FileText className="mr-2 h-3.5 w-3.5" /> Rukhsoh
            </Button>
            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={onExportExcelClick}>
              <FileDown className="mr-2 h-3.5 w-3.5" /> Unduh Excel
            </Button>
            <Button size="sm" variant="outline" className="h-8 border-slate-200 shadow-sm hover:bg-slate-50" onClick={onPrintPDFClick}>
              <Printer className="mr-2 h-3.5 w-3.5" /> Unduh PDF
            </Button>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
            <button
              onClick={() => setViewMode("simple")}
              className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                viewMode === "simple" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> 
            </button>
            <button
              onClick={() => setViewMode("detail")}
              className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                viewMode === "detail" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/*  JUDUL LAPORAN (Hanya muncul saat cetak PDF) */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold uppercase tracking-tight">Laporan Rekapitulasi Pembayaran Santri</h1>
        <p className="text-sm text-slate-500">Yayasan Kebajikan Pesantren Babakan Ciwaringin • {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      {/* TABEL MATRIKS */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto max-h-[600px] relative scrollbar-thin print:overflow-visible print:max-h-none">
          <Table className="whitespace-nowrap border-collapse">
            <TableHeader className="bg-slate-100 border-b-2 border-slate-200 sticky top-0 z-20 print:static">
              <TableRow>
                <TableHead className="w-[50px] text-center font-bold text-slate-700 sticky left-0 bg-slate-100 z-30 border-r border-slate-200 print:static print:border-slate-300">No</TableHead>
                <TableHead className="font-bold text-slate-700 min-w-[250px] sticky left-[50px] bg-slate-100 z-30 border-r-2 border-slate-200 print:static print:border-slate-300">Nama Santri / NIS</TableHead>
                
                {/*  HEADER 2 BARIS: [ALIAS] & [PUSAT TUJUAN DANA] */}
                {columns.map((col) => (
                  <TableHead key={col.id} className="text-center min-w-[200px] border-r border-slate-200/60 bg-slate-50/80 p-2 align-middle print:border-slate-300">
                    <div className="flex flex-col items-center justify-center space-y-0.5">
                      <span className="font-bold text-slate-700 text-xs uppercase tracking-tight">{col.alias}</span>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none">{col.target_unit}</span>
                    </div>
                  </TableHead>
                ))}
                
                <TableHead className="font-black text-[11px] uppercase text-rose-700 text-right min-w-[150px] sticky right-0 bg-rose-50 z-30 border-l-2 border-rose-200 print:static print:border-slate-300">
                  Total Tunggakan
                </TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {matrixData.map((row, index) => {
                return (
                  <TableRow key={row.student_id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group print:border-slate-300">
                    <TableCell className="text-center font-medium text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 print:static print:border-slate-300">
                      {index + 1}
                    </TableCell>
                    <TableCell className="sticky left-[50px] bg-white group-hover:bg-slate-50 z-10 border-r-2 border-slate-200 print:static print:border-slate-300">
                      <p className="font-bold text-slate-800 uppercase text-[13px]">{row.name}</p>
                      <p className="text-[11px] font-medium text-slate-500">{row.nis} • {row.unit}</p>
                    </TableCell>

                    {columns.map((col) => {
                      const bill: FinanceBilling = row.bills[col.id];
                      
                      if (!bill) {
                        return (
                          <TableCell key={col.id} className="text-center align-middle border-r border-slate-100/60 bg-slate-50/30 p-2 print:bg-white print:border-slate-300">
                            <Minus className="h-4 w-4 mx-auto text-slate-300" />
                          </TableCell>
                        );
                      }

                      const isPaid = bill.status === "paid";
                      const isPartial = bill.status === "partial";
                      const isUnpaid = bill.status === "unpaid";

                      //  MODE SIMPEL
                      if (viewMode === "simple") {
                        return (
                          <TableCell key={col.id} className={`text-center align-middle border-r border-slate-100/60 p-2 print:border-slate-300 ${isPaid ? 'bg-emerald-50/30' : isPartial ? 'bg-amber-50/30' : 'bg-white'}`}>
                            <div className="flex flex-col items-center justify-center space-y-1">
                              {isPaid && <><CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-sm" /><span className="font-bold text-emerald-600 text-[10px] uppercase">Lunas</span></>}
                              {isPartial && <><Clock className="h-5 w-5 text-amber-500 drop-shadow-sm" /><span className="font-bold text-rose-500 text-[10px] bg-rose-50 px-1 rounded uppercase">Sisa {formatRupiah(bill.remaining_amount)}</span></>}
                              {isUnpaid && <><XCircle className="h-4 w-4 text-rose-300 opacity-50" /><span className="font-bold text-rose-500 text-[11px]">{formatRupiah(bill.remaining_amount)}</span></>}
                            </div>
                          </TableCell>
                        );
                      }

                      //  MODE DETAIL
                      let paymentDateStr = "-";
                      let channel = "-";
                      if (bill.payments && bill.payments.length > 0) {
                        const lastPayment = bill.payments[bill.payments.length - 1];
                        channel = lastPayment.channel;
                        paymentDateStr = new Intl.DateTimeFormat('id-ID', { 
                          day: '2-digit', month: 'long', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        }).format(new Date(lastPayment.payment_date));
                      }

                      return (
                        <TableCell key={col.id} className={`text-center align-middle border-r border-slate-100/60 p-2 print:border-slate-300 ${isPaid ? 'bg-emerald-50/30' : isPartial ? 'bg-amber-50/30' : 'bg-white'}`}>
                          {isUnpaid ? (
                            <div className="flex flex-col items-center justify-center space-y-1 opacity-75">
                              <span className="font-bold text-rose-500 text-xs">{formatRupiah(bill.remaining_amount)}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded print:bg-transparent">Belum Bayar</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-0.5">
                              <span className="font-bold text-emerald-600 text-[13px]">{formatRupiah(bill.billed_amount - bill.remaining_amount)}</span>
                              <span className="text-[10px] text-slate-500 font-medium tracking-tight flex items-center gap-1">
                                {channel === 'cashless' ? <CreditCard className="h-3 w-3 text-blue-500"/> : <Wallet className="h-3 w-3 text-emerald-500"/>} 
                                {paymentDateStr}
                              </span>
                              {isPartial && <span className="text-[9px] font-bold text-rose-500 bg-rose-100 px-1.5 rounded uppercase mt-1 print:bg-transparent">Sisa {formatRupiah(bill.remaining_amount)}</span>}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}

                    <TableCell className="text-right align-middle font-black text-rose-700 bg-rose-50/80 sticky right-0 z-10 border-l-2 border-rose-200 print:static print:border-slate-300">
                      {formatRupiah(row.totalDebt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}