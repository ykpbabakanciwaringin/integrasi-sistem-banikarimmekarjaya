// LOKASI: src/components/pages/teachers/teacher-table.tsx
"use client";

import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CheckCircle,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Briefcase,
  Phone,
} from "lucide-react";
import { getUniversalImageUrl } from "@/lib/axios";

interface TeacherTableProps {
  teachers: any[];
  isLoading: boolean;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  activeTab: "ACTIVE" | "PENDING";
  selectedIds: string[];
  activatingId: string | null;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onEditClick: (teacher: any) => void;
  onDeleteClick: (id: string) => void;
  onViewClick: (teacher: any) => void;
  onVerify?: (id: string) => void; //  Diselaraskan dengan fitur verifikasi inline siswa
  isSuperAdmin: boolean;
}

export function TeacherTable({
  teachers,
  isLoading,
  page,
  limit,
  totalItems,
  totalPages,
  activeTab,
  selectedIds,
  activatingId,
  onSelectAll,
  onSelectOne,
  onPageChange,
  onLimitChange,
  onEditClick,
  onDeleteClick,
  onViewClick,
  onVerify,
  isSuperAdmin,
}: TeacherTableProps) {
  
  // Mencegah cache browser menampilkan foto lama
  const renderTime = useMemo(() => Date.now(), [teachers]);

  const getInstNamesWithPosition = (item: any) => {
    if (!item) return "-";
    if (item.role === "SUPER_ADMIN") return "PUSAT / GLOBAL";
    return (
      item.enrollments
        ?.map((en: any) => `${en.institution?.name || "Lembaga"} (${en.position || "Guru"})`)
        .join(", ") || "Belum Terdaftar"
    );
  };

  //  EFEK VISUAL: Skeleton Loader Identik dengan Data Siswa
  const TableSkeleton = () => (
    <>
      {[...Array(limit > 5 ? 5 : limit)].map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white">
          <TableCell className="pl-6 text-center"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell><div className="h-4 w-6 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
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
              <div className="h-2 w-28 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-40 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-2 w-32 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="flex justify-end gap-2">
              <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto min-h-[430px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-[60px] pl-6 text-center">
                <Checkbox
                  checked={teachers?.length > 0 && selectedIds.length === teachers.length}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                  disabled={isLoading}
                />
              </TableHead>
              <TableHead className="w-[50px] text-center text-[11px] uppercase font-bold text-slate-500">No</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Profil Guru</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">NIP / NIK</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Penugasan & Kontak</TableHead>
              <TableHead className="text-right pr-6 w-[200px] text-[11px] uppercase font-bold text-slate-500">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {isLoading ? (
              <TableSkeleton />
            ) : teachers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-20 text-center text-slate-500 hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data guru yang ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((item: any, idx: number) => {
                const profile = item.profile || {};
                const isPending = item.account_status === "PENDING" || item.account_status === "NON AKTIF";
                const nip = profile.n_ip || profile.nip || "-";
                const rawPhotoPath = profile.image;
                const photoUrl = rawPhotoPath ? `${getUniversalImageUrl(rawPhotoPath)}?t=${renderTime}` : undefined;

                return (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="pl-6 text-center">
                      <Checkbox 
                        checked={selectedIds.includes(item.id)} 
                        onCheckedChange={(c) => onSelectOne(item.id, !!c)} 
                      />
                    </TableCell>
                    <TableCell className="text-center text-slate-400 text-xs font-medium">
                      {(page - 1) * limit + idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200 shadow-sm relative">
                          <AvatarImage src={photoUrl} className="object-cover" />
                          <AvatarFallback className="text-xs bg-emerald-50 text-emerald-700 font-bold">
                            {(profile.full_name || item.username || "G").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                          {isPending && (
                             <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white animate-pulse" title="Belum Diverifikasi"></span>
                          )}
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors line-clamp-1" onClick={() => onViewClick(item)}>
                            {profile.full_name || item.username}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5">
                            @{item.username}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-[11px] font-mono">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 w-fit font-semibold">
                          NIP: {nip}
                        </span>
                        <span className="text-slate-500 pl-1">NIK: {profile.nik || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold line-clamp-1" title={getInstNamesWithPosition(item)}>
                            {item.enrollments?.[0]?.institution?.name || "Lembaga Pendidikan"}
                          </span>
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100 shrink-0 uppercase tracking-wider">
                            {item.enrollments?.[0]?.position || "GURU MAPEL"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 ml-5">
                           <Phone className="h-3 w-3 shrink-0" />
                           <span className="truncate">{profile.phone_number || "Tidak ada kontak"}</span>
                        </div>
                        {/* Jika ada password plain untuk mempermudah admin */}
                        {(item as any).plain_password && (
                           <div className="ml-5 text-[10px] font-mono text-emerald-600 font-bold mt-0.5">
                             Sandi: {(item as any).plain_password}
                           </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {isPending && onVerify && (
                          <Button variant="outline" size="sm" onClick={() => onVerify(item.id)} disabled={activatingId === item.id} className="h-8 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold px-2" title="Verifikasi">
                            {activatingId === item.id ? <Loader2 className="h-4 w-4 animate-spin text-amber-600" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                            <span className="text-[10px]">Verifikasi</span>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onViewClick(item)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Detail"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onEditClick(item)} className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteClick(item.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && teachers?.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{teachers.length}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> data
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v))}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0"><SelectValue /></SelectTrigger>
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
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {page} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}