// LOKASI: src/components/pages/institutions/institution-table.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Trash2,
  Eye,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  FileImage,
  School,
  Zap //  Tambahan ikon integrasi
} from "lucide-react";
import { getUniversalImageUrl } from "@/lib/axios";

interface InstitutionTableProps {
  data: any[];
  isLoading: boolean;
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onOpenDetail: (item: any) => void;
  onOpenEdit: (item: any) => void;
  onOpenPreview: (item: any) => void;
  onDelete: (id: string) => void;
}

export function InstitutionTable({
  data,
  isLoading,
  meta,
  onPageChange,
  onLimitChange,
  onOpenDetail,
  onOpenEdit,
  onOpenPreview,
  onDelete,
}: InstitutionTableProps) {
  
  // Helper untuk warna lencana jenjang pendidikan
  const getLevelBadge = (level: string) => {
    if (!level) return <Badge variant="outline" className="text-[10px]">-</Badge>;
    if (level.includes("SD") || level.includes("MI"))
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">{level}</Badge>;
    if (level.includes("SMP") || level.includes("MTs"))
      return <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px]">{level}</Badge>;
    if (level.includes("SMA") || level.includes("SMK") || level.includes("MA"))
      return <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">{level}</Badge>;
    if (level.includes("TINGGI"))
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{level}</Badge>;
    return <Badge variant="outline" className="bg-slate-100 text-[10px]">{level}</Badge>;
  };

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto min-h-[430px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px] font-bold text-slate-500 text-[11px] uppercase text-center tracking-wider">
                No
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                Identitas Lembaga
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                Jenjang & Kategori
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                Header Kop Surat
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                Lokasi & Kontak
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase text-right pr-6 tracking-wider">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              // EFEK VISUAL SKELETON SELARAS DENGAN HALAMAN SISWA
              [...Array(meta.limit > 5 ? 5 : meta.limit)].map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white">
                  <TableCell className="text-center"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse shrink-0"></div>
                      <div className="flex flex-col gap-2 w-full">
                        <div className="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-2 w-20 bg-slate-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-2 w-20 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-28 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-2 w-24 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-40 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-2 w-32 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-2">
                      <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
                      <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
                      <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
                      <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((item: any, idx: number) => {
                const cacheBuster = item.updated_at ? `?t=${new Date(item.updated_at).getTime()}` : "";
                const safeLogo = item.logo_url ? `${getUniversalImageUrl(item.logo_url)}${cacheBuster}` : undefined;

                return (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="text-center font-medium text-slate-400 text-xs">
                      {(meta.page - 1) * meta.limit + idx + 1}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200 shadow-sm bg-white p-0.5">
                          {safeLogo ? (
                            <AvatarImage src={safeLogo} className="object-contain rounded-full" />
                          ) : (
                            <AvatarFallback className="bg-emerald-50 text-emerald-700 font-bold text-xs">
                              {item.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col">
                          <span
                            className="font-bold text-sm text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors line-clamp-1"
                            onClick={() => onOpenDetail(item)}
                          >
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                              KODE: {item.code}
                            </span>
                            
                            {/* INDIKATOR INTEGRASI (FASE 3) */}
                            {item.is_pq_integration_enabled && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] h-4 px-1 gap-0.5 hover:bg-amber-100">
                                <Zap className="h-2 w-2 fill-amber-500 text-amber-500" /> Terintegrasi Pihak Ketiga
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col items-start gap-1.5">
                        {getLevelBadge(item.level_code)}
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {item.category}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-700 line-clamp-1">
                          {item.header1 || "-"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5 line-clamp-1">
                          {item.header2 || "-"}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col text-sm text-slate-600 max-w-[250px]">
                        <span className="flex items-start gap-1.5 text-xs leading-tight">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span className="truncate" title={item.address_detail || item.address_city}>
                            {item.address_detail || item.address_city || "Alamat belum diatur"}
                          </span>
                        </span>
                        {item.contact_phone && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                            <Phone className="h-3 w-3 text-slate-400" /> {item.contact_phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 rounded-full text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Preview Kop Surat"
                          onClick={() => onOpenPreview(item)}
                        >
                          <FileImage className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Detail Data"
                          onClick={() => onOpenDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit Lembaga"
                          onClick={() => onOpenEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Lembaga"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
                    <School className="h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium">Data lembaga tidak ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{data.length}</span> dari <span className="font-bold text-slate-800">{meta.total}</span> data
            </span>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Baris per halaman:</span>
              <Select value={String(meta.limit)} onValueChange={(v) => onLimitChange(Number(v))}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm"
              onClick={() => onPageChange(Math.max(1, meta.page - 1))}
              disabled={meta.page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {meta.page} / {meta.total_pages || 1}
            </div>
            <Button
              variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm"
              onClick={() => onPageChange(Math.min(meta.total_pages, meta.page + 1))}
              disabled={meta.page >= meta.total_pages}
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}