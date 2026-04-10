// LOKASI: src/components/pages/results/subjects/score-table.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Edit3, User, ChevronLeft, ChevronRight, Loader2, ClipboardCheck } from "lucide-react";

export function ScoreTable({ tableState, kkmState, data }: any) {
  
  //  SKELETON LOADER STANDAR KITA
  const TableSkeleton = () => (
    <>
      {[...Array(tableState.limit > 5 ? 5 : tableState.limit)].map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white border-b border-slate-100">
          <TableCell className="text-center"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell>
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </TableCell>
          <TableCell className="text-center"><div className="h-4 w-8 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell className="text-center"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell className="text-center"><div className="h-6 w-10 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell className="text-center"><div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse mx-auto"></div></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden no-print">
      
      {/* TOOLBAR: PENCARIAN & FILTER */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Cari Nama / Username..."
              className="pl-9 h-10 bg-white border-slate-200 focus-visible:ring-emerald-500 rounded-lg text-sm shadow-sm transition-all"
              value={tableState.search}
              onChange={(e) => tableState.setSearch(e.target.value)}
            />
          </div>
          <Select value={tableState.statusFilter} onValueChange={tableState.setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-10 bg-white border-slate-200 rounded-lg text-xs font-bold text-emerald-700 shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="DONE">Sudah Selesai</SelectItem>
              <SelectItem value="PENDING">Belum Ujian</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          className="w-full lg:w-auto h-10 px-4 text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg font-bold shadow-sm transition-colors"
          onClick={() => {
            kkmState.setTempKKM(data.kkm);
            kkmState.setIsKKMDialogOpen(true);
          }}
          disabled={data.isLoading}
        >
          <Edit3 className="w-4 h-4 mr-2" /> Edit KKM ({data.kkm})
        </Button>
      </div>

      {/* TABEL DATA */}
      <div className="overflow-x-auto min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-[60px] text-center text-[11px] uppercase font-bold text-slate-500">No</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Identitas Siswa</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-500">L / P</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-500">B / S</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-800">Nilai Akhir</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-500">Keterangan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {data.isLoading ? (
              <TableSkeleton />
            ) : data.paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-24 text-center hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                      <ClipboardCheck className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Data nilai siswa tidak ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.paginatedData.map((student: any, index: number) => {
                const realIndex = (tableState.page - 1) * tableState.limit + index + 1;
                const isDone = student.exam_status !== "BELUM UJIAN";
                const isPassed = student.final_score >= data.kkm;
                
                return (
                  <TableRow key={index} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 group">
                    <TableCell className="text-center text-slate-400 text-xs font-medium">
                      {realIndex}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-800 text-sm">
                        {student.student_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> @{student.student_username}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-600 text-xs">
                      {student.student_gender || "L"}
                    </TableCell>
                    <TableCell className="text-center">
                      {isDone ? (
                        <span className="text-[11px] font-bold px-2 py-1 bg-slate-50 rounded text-slate-700 border border-slate-200">
                          <span className="text-emerald-600">{student.correct_count}</span> / <span className="text-rose-500">{student.wrong_count}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-black text-xl tracking-tight ${!isDone ? "text-slate-300" : isPassed ? "text-emerald-600" : "text-amber-600"}`}>
                        {student.final_score}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isDone ? (
                        <Badge className={`shadow-sm border font-bold uppercase text-[9px] px-2 py-0.5 tracking-wider ${isPassed ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                          {isPassed ? "Tuntas" : "Remedial"}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic text-[10px] font-bold">Belum Ujian</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/*  PAGINASI STANDAR: Diperbarui persis seperti halaman Siswa */}
      {!data.isLoading && data.paginatedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 mt-auto rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{(tableState.page - 1) * tableState.limit + 1}</span> - <span className="font-bold text-slate-800">{Math.min(tableState.page * tableState.limit, data.totalItems)}</span> dari <span className="font-bold text-slate-800">{data.totalItems}</span> data
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={tableState.limit.toString()} onValueChange={(v) => tableState.setLimit(Number(v))}>
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
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => tableState.setPage(tableState.page - 1)} disabled={tableState.page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {tableState.page} / {data.totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => tableState.setPage(tableState.page + 1)} disabled={tableState.page >= data.totalPages}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* DIALOG EDIT KKM */}
      <Dialog open={kkmState.isKKMDialogOpen} onOpenChange={kkmState.setIsKKMDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 border-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="p-6 bg-[#043425] text-white">
            <DialogTitle className="text-lg font-bold tracking-tight">Ubah Standard KKM</DialogTitle>
            <DialogDescription className="text-emerald-100/70 text-xs">
              Tentukan nilai batas minimum kelulusan untuk mata pelajaran ini.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 flex flex-col items-center gap-4 bg-slate-50/50">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Nilai KKM Baru (0 - 100)
            </Label>
            <Input
              type="number"
              value={kkmState.tempKKM}
              onChange={(e) => kkmState.setTempKKM(Number(e.target.value))}
              className="h-20 text-center text-5xl font-black border-emerald-200 focus-visible:ring-emerald-500 rounded-xl bg-white shadow-sm"
              min={0}
              max={100}
            />
          </div>
          <DialogFooter className="p-4 bg-white border-t border-slate-100 flex gap-2 sm:justify-between">
            <Button variant="outline" className="flex-1 font-bold rounded-lg text-slate-600" onClick={() => kkmState.setIsKKMDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md active:scale-95 transition-all"
              onClick={() => kkmState.updateKKMMutation.mutate(kkmState.tempKKM)}
              disabled={kkmState.updateKKMMutation.isPending}
            >
              {kkmState.updateKKMMutation.isPending ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Menyimpan...</> : "Simpan KKM"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}