// LOKASI: src/components/pages/questions/question-table.tsx
"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionBank } from "@/types/question";
import { User } from "@/types/user";
import {
  BookOpen, Layers, LayoutList, Pencil, Trash2, UserCircle, 
  ChevronLeft, ChevronRight, BookDashed, Building2
} from "lucide-react";

interface QuestionTableProps {
  isLoading: boolean;
  packets: QuestionBank[];
  page: number;
  limit: number;
  totalData: number;
  totalPages: number;
  isSuperAdmin: boolean;
  currentUser: User | null;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onEdit: (packet: QuestionBank) => void;
  onDelete: (id: string) => void;
}

export function QuestionTable({
  isLoading, packets, page, limit, totalData, totalPages,
  isSuperAdmin, currentUser, onPageChange, onLimitChange, onEdit, onDelete,
}: QuestionTableProps) {
  const router = useRouter();

  // [PENYEMPURNAAN UX]: Kerangka pemuatan diselaraskan pas 6 kolom
  const TableSkeleton = () => (
    <>
      {[...Array(limit > 5 ? 5 : limit)].map((_, i) => (
        <tr key={`skeleton-${i}`} className="bg-white hover:bg-white border-b border-slate-50">
          <td className="px-6 py-4 text-center"><div className="h-4 w-6 bg-slate-200 rounded animate-pulse mx-auto"></div></td>
          <td className="px-6 py-4">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
              <div className="flex gap-2"><div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div><div className="h-3 w-16 bg-slate-100 rounded animate-pulse"></div></div>
            </div>
          </td>
          <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse"></div></td>
          <td className="px-6 py-4">
            <div className="flex flex-col gap-2">
              <div className="h-5 w-32 bg-slate-200 rounded-md animate-pulse"></div>
            </div>
          </td>
          <td className="px-6 py-4 text-center"><div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse mx-auto"></div></td>
          <td className="px-6 py-4 text-right">
            <div className="flex justify-end gap-2">
              <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto min-h-[430px]">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-bold tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-bold text-center w-[60px]">No</th>
              <th className="px-6 py-4 font-bold min-w-[250px]">Informasi Paket</th>
              <th className="px-6 py-4 font-bold w-[150px]">Tipe Soal</th>
              <th className="px-6 py-4 font-bold min-w-[200px]">Pembuat Bank Soal</th>
              <th className="px-6 py-4 font-bold text-center w-[150px]">Jumlah</th>
              <th className="px-6 py-4 font-bold text-right w-[200px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <TableSkeleton />
            ) : packets.length === 0 ? (
              // [PENYEMPURNAAN UX]: Ilustrasi Data Kosong yang Elegan
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner">
                      <BookDashed className="w-10 h-10 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">Tidak Ada Paket Soal</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                        Data yang Anda cari tidak ditemukan. Silakan buat paket baru atau sesuaikan filter pencarian di atas.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              packets.map((packet: QuestionBank, idx: number) => {
                const isOwner = currentUser?.id === packet.teacher_id;
                const authorName = packet.author_name || "Admin / Guru";

                return (
                  <tr key={packet.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-center font-medium text-slate-400 text-xs">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    
                    {/* KOLOM 1: INFORMASI PAKET */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-sm text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors line-clamp-2" onClick={() => router.push(`/dashboard/questions/${packet.id}`)}>
                          {packet.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <BookOpen className="h-3 w-3 mr-1.5 text-slate-400" /> {packet.subject_name}
                          </span>
                          <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Layers className="h-3 w-3 mr-1.5 text-slate-400" /> Kls {packet.grade_level}
                          </span>
                          <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Building2 className="h-3 w-3 mr-1.5 text-slate-400" />  {packet.institution_name}
                          </span>
                          
                        </div>
                      </div>
                    </td>
                    
                    {/* KOLOM 2: TIPE SOAL */}
                    <td className="px-6 py-4">
                      <Badge 
                        className={`shadow-none border font-semibold ${
                          packet.type === "PG" ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : 
                          packet.type === "ESSAY" ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" : 
                          "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                        }`}
                      >
                        {packet.type === "PG" ? "Pilihan Ganda" : packet.type === "ESSAY" ? "Essay" : "Campuran (PG & Essay)"}
                      </Badge>
                    </td>

                    {/* KOLOM 3: PEMBUAT & LEMBAGA */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <div 
                          className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1.5 rounded-md border max-w-[220px] transition-colors ${isOwner ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'}`} 
                          title={`Dibuat oleh: ${authorName}`}
                        >
                          <UserCircle className={`h-3.5 w-3.5 shrink-0 ${isOwner ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className="truncate">
                            {authorName} {isOwner && <span className="font-normal opacity-70 ml-1">(Anda)</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* KOLOM 4: JUMLAH SOAL */}
                    <td className="px-6 py-4 text-center">
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none font-bold text-[11px] border border-slate-200">
                        <LayoutList className="h-3 w-3 mr-1.5 text-slate-400" />
                        {packet.item_count} Butir
                      </Badge>
                    </td>
                    
                    {/* KOLOM 5: AKSI */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        
                        <Button variant="outline" size="sm" className="h-8 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-bold px-2.5 text-[10px] uppercase shadow-sm" onClick={() => router.push(`/dashboard/questions/${packet.id}`)}>
                          <LayoutList className="h-4 w-4" />Kelola Soal
                        </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Edit Paket Soal" onClick={() => onEdit(packet)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Hapus Paket Soal" onClick={() => onDelete(packet.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER PAGINASI */}
      {!isLoading && packets.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">
                {packets.length > 0 ? (page - 1) * limit + 1 : 0} - {packets.length > 0 ? (page - 1) * limit + packets.length : 0}
              </span> dari <span className="font-bold text-slate-800">{totalData > packets.length ? totalData : packets.length}</span> data
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v))}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm hover:text-emerald-700 hover:border-emerald-200" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Sebelumnya
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm min-w-[70px] text-center">
              Hal {page} / {Math.max(totalPages || 1, Math.ceil((totalData || packets.length) / limit))}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm hover:text-emerald-700 hover:border-emerald-200" onClick={() => onPageChange(page + 1)} disabled={page >= (totalPages || 1) || packets.length < limit}>
              Selanjutnya <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}