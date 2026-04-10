"use client";

import React from "react";
import Link from "next/link";

// --- UI COMPONENTS ---
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- CUSTOM COMPONENTS (RAKitan KITA) ---
import { useRaporController } from "@/components/pages/results/classes/rapor/useRaporController";
import { RaporHeader } from "@/components/pages/results/classes/rapor/rapor-header";
import { RaporStudentGrid } from "@/components/pages/results/classes/rapor/rapor-student-grid";
import { RaporPrintTemplate } from "@/components/pages/results/classes/rapor/rapor-print-template";

export default function CetakRaporPage() {
  const controller = useRaporController();

  if (!controller.isMounted) return null;

  const { data, state, handlers, refs, isAuthorized } = controller;

  // 1. LOADING STATE (Awal pemuatan data)
  if (data.isLoading && !data.classInfo) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
        <Skeleton className="h-20 w-1/3 rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  // 2. SECURITY GUARD (Akses Ditolak)
  if (!isAuthorized) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[80vh] bg-slate-50/50">
        <Card className="max-w-md w-full p-10 text-center shadow-2xl shadow-rose-100 border-rose-100 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
          <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
            <ShieldAlert className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tight">Privasi Dilindungi</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
            Halaman cetak rapor hanya dapat diakses oleh <span className="text-slate-800 font-bold">Wali Kelas</span> atau <span className="text-slate-800 font-bold">Administrator Lembaga</span>.
          </p>
          <Link href="/dashboard/results">
            <Button className="w-full bg-slate-800 hover:bg-black text-white font-bold h-12 rounded-xl transition-all">
              Kembali ke Beranda
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-6 font-sans flex flex-col h-full bg-slate-50/30 min-h-screen animate-in fade-in duration-700">
      
      {/* HEADER: Info Kelas & Tombol Cetak Massal */}
      <RaporHeader data={data} handlers={handlers} />

      {/* SEARCH BAR: Pencarian Siswa yang Sangat Cepat */}
      <div className="relative w-full max-w-lg no-print">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Cari nama siswa atau NISN..." 
          className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-emerald-500 text-base font-medium"
          value={state.search}
          onChange={(e) => state.setSearch(e.target.value)}
        />
      </div>

      {/* GRID: Daftar Kartu Siswa (Fase 2) */}
      <div className="flex-1">
        <RaporStudentGrid data={data} />
      </div>

      {/* FOOTER: Paginasi (Selaras dengan standar UI kita) */}
      {!data.isLoading && data.totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-slate-100 bg-white/50 backdrop-blur-sm gap-4 rounded-2xl no-print">
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Siswa <span className="text-slate-900 font-bold">{(state.page - 1) * state.limit + 1}</span> - <span className="text-slate-900 font-bold">{Math.min(state.page * state.limit, data.totalItems)}</span> dari <span className="text-slate-900 font-bold">{data.totalItems}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tampilkan:</span>
              <Select value={state.limit.toString()} onValueChange={(v) => state.setLimit(Number(v))}>
                <SelectTrigger className="h-8 w-18 text-xs bg-white border-slate-200 focus:ring-emerald-500 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl px-4 border-slate-200 bg-white shadow-sm font-bold text-xs" onClick={() => state.setPage(state.page - 1)} disabled={state.page <= 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <div className="text-xs font-black px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 shadow-inner">
              HAL {state.page} / {data.totalPages}
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-xl px-4 border-slate-200 bg-white shadow-sm font-bold text-xs" onClick={() => state.setPage(state.page + 1)} disabled={state.page >= data.totalPages}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* INVISIBLE PRINT TEMPLATE: Jantung dari proses Cetak PDF (Fase 3) */}
      <RaporPrintTemplate ref={refs.printRef} data={data} />

    </div>
  );
}