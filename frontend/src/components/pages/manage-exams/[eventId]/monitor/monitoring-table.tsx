// LOKASI: src/components/pages/manage-exams/[eventId]/monitor/monitoring-table.tsx
"use client";

import React, { useMemo } from "react";
import { format, differenceInSeconds } from "date-fns";
import { getUniversalImageUrl } from "@/lib/axios";

// --- ICONS ---
import { Loader2, Activity, CheckCircle2, Users, PowerOff, Ban, Unlock, RefreshCcw, Camera, Eye, AlertTriangle, Wifi, WifiOff, ChevronLeft, ChevronRight } from "lucide-react";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MonitoringTableProps {
  role?: string;
  controller: any; // Menerima data dan state dari useMonitorController
}

export function MonitoringTable({ role, controller }: MonitoringTableProps) {
  const { state, modals, data } = controller;
  const { participants, totalItems, totalPages, participantsLoading, participantsFetching } = data;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const renderTime = useMemo(() => Date.now(), [participants]);

  const isOnline = (lastHeartbeat: string | null) => {
    if (!lastHeartbeat) return false;
    return differenceInSeconds(new Date(), new Date(lastHeartbeat)) < 45; 
  };

  const getStatusBadge = (status: string, lastHb: string | null) => {
    const online = isOnline(lastHb);
    switch (status?.toUpperCase()) {
      case "WORKING":
        return (
          <div className="flex flex-col items-center gap-1">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 shadow-none text-[10px] px-2 py-0.5 font-bold">
              <Activity className="w-3 h-3 mr-1 animate-pulse" /> MENGERJAKAN
            </Badge>
            {online ? (
              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5"><Wifi className="w-2.5 h-2.5" /> ONLINE</span>
            ) : (
              <span className="text-[9px] text-rose-500 font-bold flex items-center gap-0.5"><WifiOff className="w-2.5 h-2.5" /> DISCONNECT</span>
            )}
          </div>
        );
      case "FINISHED": return <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-none text-[10px] font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> SELESAI</Badge>;
      case "BLOCKED": return <Badge className="bg-rose-100 text-rose-700 border-0 shadow-none text-[10px] font-bold"><Ban className="w-3 h-3 mr-1" /> TERBLOKIR</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-500 border-0 shadow-none text-[10px] font-bold">TERDAFTAR</Badge>;
    }
  };

  //  SKELETON LOADING IDENTIK DENGAN DATA SISWA
  const TableSkeleton = () => (
    <>
      {[...Array(state.limit > 5 ? 5 : state.limit)].map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="bg-white hover:bg-white">
          <TableCell className="pl-6 text-center"><div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto"></div></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse shrink-0"></div>
              <div className="flex flex-col gap-2 w-full"><div className="h-3 w-32 bg-slate-200 rounded animate-pulse"></div><div className="h-2 w-20 bg-slate-100 rounded animate-pulse"></div></div>
            </div>
          </TableCell>
          <TableCell><div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse mx-auto"></div></TableCell>
          <TableCell><div className="flex flex-col gap-2"><div className="h-3 w-24 bg-slate-200 rounded animate-pulse"></div><div className="h-2 w-28 bg-slate-100 rounded animate-pulse"></div></div></TableCell>
          <TableCell><div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse mx-auto"></div></TableCell>
          <TableCell className="text-right pr-6"><div className="flex justify-end gap-2"><div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div><div className="h-8 w-8 bg-slate-200 rounded-md animate-pulse"></div></div></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="bg-white rounded-b-xl border border-t-0 border-slate-100 shadow-sm overflow-hidden w-full">
      <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Monitoring Active</span>
          </div>
          {participantsFetching && !participantsLoading && <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />}
      </div>

      <div className="overflow-x-auto min-h-[430px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-[60px] pl-6 text-center text-[11px] uppercase font-bold text-slate-500">No</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Identitas Peserta</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500 text-center">Keamanan (SEB)</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500">Log Waktu</TableHead>
              <TableHead className="text-[11px] uppercase font-bold text-slate-500 text-center">Status</TableHead>
              {isAdmin && <TableHead className="text-right pr-6 w-[180px] text-[11px] uppercase font-bold text-slate-500">Kontrol</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {participantsLoading ? (
              <TableSkeleton />
            ) : participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="px-6 py-20 text-center text-slate-500 hover:bg-white">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium">Data peserta tidak ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              participants.map((p: any, index: number) => {
                const student = p.student || {};
                const profile = student.profile || {};
                const name = profile.full_name || student.username || "Siswa";
                const photoUrl = (profile?.image || profile?.photo_url || student?.image) ? `${getUniversalImageUrl(profile?.image || profile?.photo_url || student?.image)}?t=${renderTime}` : undefined;
                
                const isFinished = p.status === "FINISHED";
                const isBlocked = p.status === "BLOCKED";

                return (
                  <TableRow key={p.student_id} className="hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="pl-6 text-center text-slate-400 text-xs font-medium">
                      {(state.page - 1) * state.limit + index + 1}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200 shadow-sm rounded-lg">
                          <AvatarImage src={photoUrl} className="object-cover" />
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg">
                            {name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{name}</span>
                          <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{student.username} • {profile.class?.name || 'Umum'}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {p.violation_count > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="destructive" className="bg-rose-500 hover:bg-rose-600 animate-pulse cursor-pointer flex items-center gap-1 text-[9px] font-black px-2 py-0.5" onClick={() => modals.setGalleryState({ isOpen: true, participant: p })}>
                            <AlertTriangle className="w-3 h-3" /> {p.violation_count} PELANGGARAN
                          </Badge>
                          <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-blue-600 font-bold" onClick={() => modals.setGalleryState({ isOpen: true, participant: p })}>
                            <Eye className="w-3 h-3 mr-1" /> Lihat Bukti
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center opacity-30">
                           <Camera className="w-4 h-4 text-slate-400" />
                           <span className="text-[8px] font-bold mt-1 uppercase text-slate-500">Clear</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-[10px] font-medium text-slate-500 space-y-0.5 font-mono">
                        {p.started_at && <p className="text-slate-700">MULAI: {format(new Date(p.started_at), "HH:mm:ss")}</p>}
                        {p.last_heartbeat_at && p.status === "WORKING" && (
                          <p className={isOnline(p.last_heartbeat_at) ? "text-emerald-600" : "text-rose-500"}>PING: {format(new Date(p.last_heartbeat_at), "HH:mm:ss")}</p>
                        )}
                        {p.finished_at && <p className="text-emerald-600 font-bold">FINISH: {format(new Date(p.finished_at), "HH:mm:ss")}</p>}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">{getStatusBadge(p.status, p.last_heartbeat_at)}</TableCell>

                    {isAdmin && (
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="icon" className="h-8 w-8 border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-sm" title="Reset Login" onClick={() => modals.setActionState({ isOpen: true, type: "RESET", participant: p })}>
                            <RefreshCcw className="h-3.5 w-3.5" />
                          </Button>
                          {!isFinished && (
                            <Button variant="outline" size="icon" className={`h-8 w-8 shadow-sm ${isBlocked ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'}`} title={isBlocked ? "Buka Blokir" : "Blokir Akses"} onClick={() => modals.setActionState({ isOpen: true, type: "BLOCK", participant: p })}>
                              {isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          {!isFinished && (
                            <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-sm" title="Paksa Selesai" onClick={() => modals.setActionState({ isOpen: true, type: "FINISH", participant: p })}>
                              <PowerOff className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      {/*  PAGINASI IDENTIK DENGAN DATA SISWA */}
      {!participantsLoading && participants.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{participants.length}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> peserta
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-500 font-medium">Baris per halaman:</span>
              <Select value={state.limit.toString()} onValueChange={(v) => { state.setLimit(Number(v)); state.setPage(1); }}>
                <SelectTrigger className="h-7 w-16 text-xs bg-white border-slate-200 shadow-sm focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => state.setPage((p: number) => p - 1)} disabled={state.page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 shadow-sm">
              Hal {state.page} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white shadow-sm" onClick={() => state.setPage((p: number) => p + 1)} disabled={state.page >= totalPages}>
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}