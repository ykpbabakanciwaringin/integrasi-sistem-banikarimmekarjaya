"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, Edit, Trash2, Building2, ChevronLeft, ChevronRight, Users, CheckCircle } from "lucide-react";
import { User, getRoleLabel } from "@/types/user";
import { getUniversalImageUrl } from "@/lib/axios";

interface AccountTableProps {
  accounts: User[];
  isLoading: boolean;
  meta: { page: number; limit: number; total: number; total_pages: number; };
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onOpenDetail: (account: User) => void;
  onOpenEdit: (account: User) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  activatingId: string | null;
}

export function AccountTable({
  accounts, isLoading, meta, onPageChange, onLimitChange,
  onOpenDetail, onOpenEdit, onDelete, onActivate, activatingId
}: AccountTableProps) {
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-rose-100 text-rose-700 border-rose-200";
      case "ADMIN": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "ADMIN_ACADEMIC": return "bg-blue-100 text-blue-700 border-blue-200";
      case "ADMIN_FINANCE": return "bg-amber-100 text-amber-700 border-amber-200";
      case "TEACHER": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  //  EFEK VISUAL BARU: Skeleton Loader untuk Tabel
  const TableSkeleton = () => (
    <>
      {[...Array(meta.limit > 5 ? 5 : meta.limit)].map((_, i) => (
        <tr key={`skeleton-${i}`} className="bg-white hover:bg-white border-b border-slate-50">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse shrink-0"></div>
              <div className="flex flex-col gap-2 w-full">
                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-2 w-20 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse"></div></td>
          <td className="px-6 py-4">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-40 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-2 w-32 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex justify-end gap-2">
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
              <th className="px-6 py-4 font-bold">Profil Pengguna</th>
              <th className="px-6 py-4 font-bold">Role Utama</th>
              <th className="px-6 py-4 font-bold">Penugasan Lembaga & Jabatan</th>
              <th className="px-6 py-4 font-bold text-right w-[200px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <TableSkeleton />
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data akun ditemukan.</p>
                  </div>
                </td>
              </tr>
            ) : (
              accounts.map((acc: User) => (
                <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-200 shadow-sm relative">
                        <AvatarImage src={getUniversalImageUrl(acc.profile?.image) || undefined} className="object-cover" />
                        <AvatarFallback className="font-bold text-emerald-700 bg-emerald-50 text-xs">
                          {(acc.profile?.full_name || acc.username || "U").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                        {!acc.is_active && (
                           <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white animate-pulse" title="Belum Aktif"></span>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-bold text-slate-800 text-sm line-clamp-1 cursor-pointer hover:text-emerald-700 transition-colors" onClick={() => onOpenDetail(acc)}>
                          {acc.profile?.full_name || acc.username}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-tight">@{acc.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`${getRoleColor(acc.role)} font-semibold shadow-sm`}>
                      {getRoleLabel(acc.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {acc.enrollments && acc.enrollments.length > 0 ? (
                        acc.enrollments.map((en, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold line-clamp-1">{en.institution?.name}</span>
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100 shrink-0 uppercase tracking-wider">
                              {en.position || "Belum Diatur"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada penugasan</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!acc.is_active && (
                        <Button variant="outline" size="sm" onClick={() => onActivate(acc.id)} disabled={activatingId === acc.id} className="h-8 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold px-2" title="Verifikasi & Aktifkan">
                          {activatingId === acc.id ? <Loader2 className="h-4 w-4 animate-spin text-amber-600 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                          <span className="text-[10px]">Verifikasi</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => onOpenDetail(acc)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Detail"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onOpenEdit(acc)} className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Edit"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(acc.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && accounts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{accounts.length}</span> dari <span className="font-bold text-slate-800">{meta.total}</span> data
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={meta.limit.toString()} onValueChange={(v) => onLimitChange(Number(v))}>
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
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(meta.page - 1)} disabled={meta.page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {meta.page} / {meta.total_pages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(meta.page + 1)} disabled={meta.page >= meta.total_pages}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}