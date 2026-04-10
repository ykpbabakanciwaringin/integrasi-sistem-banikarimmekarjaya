// LOKASI: src/components/pages/manage-exams/[eventId]/sessions/participant-table.tsx
"use client";

import React, { useMemo } from "react";
import { 
  ChevronLeft, ChevronRight, 
  Trash2, Edit3, KeyRound, Camera, Users, 
  Activity, CheckCircle2, Ban, Clock, BookOpen
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getUniversalImageUrl } from "@/lib/axios";

export interface ParticipantTableProps {
  sessionId: string;
  isActive: boolean;
  participants: any[];
  isLoading: boolean;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (val: number) => void;
  onLimitChange: (val: number) => void;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  onEditParticipant: (participant: any) => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
  role?: string; 
}

export function ParticipantTable({
  participants, isLoading, page, limit, totalItems, totalPages,
  onPageChange, onLimitChange, selectedIds, onSelectAll, onSelect,
  onEditParticipant, onDelete, onResetPassword, role
}: ParticipantTableProps) {
  
  const isTeacher = role === "TEACHER";
  const renderTime = useMemo(() => Date.now(), [participants]);
  
  const allSelected = participants.length > 0 && selectedIds.length === participants.length;

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "WORKING": 
      case "ONGOING":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 shadow-none text-[10px] px-2 py-0.5 font-bold"><Activity className="w-3 h-3 mr-1 animate-pulse" /> Sedang Ujian</Badge>;
      case "FINISHED": 
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-none text-[10px] font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> Selesai</Badge>;
      case "BLOCKED": 
        return <Badge className="bg-rose-100 text-rose-700 border-0 shadow-none text-[10px] font-bold"><Ban className="w-3 h-3 mr-1" /> Terblokir</Badge>;
      case "WAITING":
        // [FITUR BARU]: Mendukung status jeda antar mata pelajaran
        return <Badge className="bg-amber-100 text-amber-700 border-0 shadow-none text-[10px] font-bold"><Clock className="w-3 h-3 mr-1 animate-bounce" /> Jeda Istirahat</Badge>;
      default: 
        return <Badge className="bg-slate-100 text-slate-500 border-0 shadow-none text-[10px] font-bold"><Clock className="w-3 h-3 mr-1" /> Belum Login</Badge>;
    }
  };

  const TableSkeleton = () => (
    <>
      {[...Array(limit > 5 ? 5 : limit)].map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white">
          <TableCell className="pl-6 text-center"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell><div className="h-4 w-6 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse shrink-0"></div>
              <div className="flex flex-col gap-2 w-full">
                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-2 w-20 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col gap-1">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </TableCell>
          <TableCell className="text-center"><div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse mx-auto"></div></TableCell>
          {!isTeacher && (
            <TableCell className="text-right pr-6">
              <div className="flex justify-end gap-2">
                <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div>
              </div>
            </TableCell>
          )}
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
                <Checkbox checked={allSelected} onCheckedChange={(checked) => onSelectAll(!!checked)} disabled={isLoading} />
              </TableHead>
              <TableHead className="w-[50px] text-center text-[11px] uppercase font-bold text-slate-500">No</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Identitas Peserta</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Daftar Paket Soal (Multi-Mapel)</TableHead>
              <TableHead className="text-center text-[11px] uppercase font-bold text-slate-500">Status</TableHead>
              {!isTeacher && <TableHead className="text-right pr-6 w-[160px] text-[11px] uppercase font-bold text-slate-500">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {isLoading ? (
              <TableSkeleton />
            ) : participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isTeacher ? 5 : 6} className="px-6 py-20 text-center text-slate-500 hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data peserta yang ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              participants.map((p: any, index: number) => {
                const student = p.student || {};
                const profile = student.profile || {};
                const name = profile.full_name || student.username || "Tanpa Nama";
                
                const rawPhotoPath = profile?.image || profile?.photo_url || student?.image;
                const photoUrl = rawPhotoPath ? `${getUniversalImageUrl(rawPhotoPath)}?t=${renderTime}` : undefined;

                return (
                  <TableRow key={p.student_id} className="hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="pl-6 text-center">
                      <Checkbox checked={selectedIds.includes(p.student_id)} onCheckedChange={(c) => onSelect(p.student_id, !!c)} />
                    </TableCell>
                    <TableCell className="text-center text-slate-400 text-xs font-medium">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 py-1">
                        <Avatar className="h-10 w-10 border border-slate-200 shadow-sm rounded-lg">
                          <AvatarImage src={photoUrl} className="object-cover" />
                          <AvatarFallback className="bg-slate-100 rounded-lg text-slate-400"><Camera className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col max-w-[220px]">
                          <span className="font-bold text-slate-800 text-sm truncate" title={name}>{name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-mono">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">{p.exam_number || "NO-NUMBER"}</span>
                            <span>•</span>
                            <span className="truncate">{profile.class?.name || "Umum"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* [PERBAIKAN KRITIS]: Render seluruh mata pelajaran dari Array Subtests */}
                    <TableCell>
                      {p.subtests && p.subtests.length > 0 ? (
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {p.subtests.map((st: any) => (
                            <Badge 
                              key={st.id} 
                              variant="outline" 
                              className="bg-emerald-50/50 text-emerald-700 border-emerald-100 text-[9px] py-0 h-4.5 w-fit font-bold tracking-tight"
                            >
                              <BookOpen className="w-2.5 h-2.5 mr-1 text-emerald-500" />
                              {st.order_num}. {st.question_bank?.subject?.name || st.question_bank?.title || "Paket Soal"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                           <span className="text-[10px] italic text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit">
                             Belum Diatur
                           </span>
                           <p className="text-[9px] text-slate-400 mt-1">Klik edit untuk memilih mapel</p>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {getStatusBadge(p.status)}
                    </TableCell>
                    
                    {!isTeacher && (
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onResetPassword(p.student_id)} title="Reset Login Perangkat"><KeyRound className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEditParticipant(p)} title="Edit Paket Ujian Siswa"><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => onDelete(p.student_id)} title="Hapus Peserta dari Sesi"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && participants.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{participants.length}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> peserta
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={limit.toString()} onValueChange={(v) => { onLimitChange(Number(v)); onPageChange(1); }}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Sebelumnya
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Halaman {page} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              Selanjutnya <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}