// LOKASI: src/app/dashboard/manage-exams/[eventId]/monitor/[sessionId]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/use-auth-store";
import { useMonitorController } from "@/components/pages/manage-exams/[eventId]/monitor/useMonitorController";

// --- CUSTOM COMPONENTS ---
import { MonitorDetailHeader } from "@/components/pages/manage-exams/[eventId]/monitor/monitor-detail-header";
import { MonitoringTable } from "@/components/pages/manage-exams/[eventId]/monitor/monitoring-table";
import { MonitoringFilters } from "@/components/pages/manage-exams/[eventId]/monitor/monitoring-filters";
import { MonitoringActionDialog } from "@/components/pages/manage-exams/[eventId]/monitor/monitoring-action-dialog";
import { ViolationGalleryModal } from "@/components/pages/manage-exams/[eventId]/monitor/violation-gallery-modal";

import { PauseCircle, PlayCircle, RefreshCcw, Ban, Unlock, PowerOff } from "lucide-react";

export default function MonitorSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const userRole = user?.role || "";

  const eventId = params.eventId as string;
  const sessionId = params.sessionId as string;

  // Memanggil Otak Utama Halaman
  const controller = useMonitorController(sessionId);

  if (!controller.isMounted) return null;

  const { state, modals, data, mutations } = controller;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <MonitorDetailHeader 
        sessionData={data.sessionData} 
        onBack={() => router.push(`/dashboard/manage-exams/${eventId}`)} 
        isLoading={data.sessionLoading}
        onToggleStatus={() => modals.setIsToggleDialogOpen(true)} 
        role={userRole}
      />

      <div className="mt-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-[#043425] rounded-full" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Live Traffic Peserta</h2>
        </div>
        
        <div className="space-y-0">
          <MonitoringFilters 
            search={state.search} 
            onSearchChange={state.setSearch}
            filterStatus={state.filterStatus} 
            onFilterStatusChange={state.setFilterStatus}
          />

          {/* Mengirim controller ke tabel agar tabel hanya bertugas merender UI */}
          <MonitoringTable role={userRole} controller={controller} />
        </div>
      </div>

      {/* --- SEMUA MODAL DISENTRALISASI DI SINI --- */}
      
      {data.sessionData && (
         <MonitoringActionDialog
           open={modals.isToggleDialogOpen} onOpenChange={modals.setIsToggleDialogOpen}
           title={data.sessionData.is_active ? "Jeda Ujian Sekarang?" : "Lanjutkan Ujian?"}
           description={data.sessionData.is_active 
             ? <>Aksi ini akan memblokir seketika akses seluruh peserta di sesi ini. <b className="text-rose-600">Gunakan hanya untuk insiden darurat.</b></>
             : <>Aksi ini akan membuka kembali akses peserta. Waktu hitung mundur ujian akan dilanjutkan kembali.</>
           }
           icon={data.sessionData.is_active ? <PauseCircle /> : <PlayCircle />}
           actionText={data.sessionData.is_active ? "Ya, Jeda Ujian" : "Ya, Lanjutkan"}
           actionClass={data.sessionData.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}
           onConfirm={() => mutations.toggleSessionMutation.mutate()}
           isLoading={mutations.toggleSessionMutation.isPending}
         />
      )}

      <MonitoringActionDialog
        open={modals.actionState.isOpen && modals.actionState.type === "RESET"}
        onOpenChange={modals.closeActionModal}
        title="Reset Login Peserta?"
        description={<>Apakah Anda ingin mereset sesi <b>{modals.actionState.participant?.student?.profile?.full_name}</b>? Gunakan jika siswa pindah perangkat.</>}
        icon={<RefreshCcw className="w-6 h-6" />}
        actionText="Ya, Reset Login" actionClass="bg-amber-500 hover:bg-amber-600"
        onConfirm={() => mutations.resetMutation.mutate(modals.actionState.participant?.student_id)}
        isLoading={mutations.resetMutation.isPending}
      />

      <MonitoringActionDialog
        open={modals.actionState.isOpen && modals.actionState.type === "BLOCK"}
        onOpenChange={modals.closeActionModal}
        title={modals.actionState.participant?.status === "BLOCKED" ? "Buka Blokir?" : "Blokir Peserta?"}
        description={modals.actionState.participant?.status === "BLOCKED" 
          ? <>Izinkan <b>{modals.actionState.participant?.student?.profile?.full_name}</b> melanjutkan ujian kembali?</>
          : <>Blokir akses <b>{modals.actionState.participant?.student?.profile?.full_name}</b> seketika?</>}
        icon={modals.actionState.participant?.status === "BLOCKED" ? <Unlock className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
        actionText={modals.actionState.participant?.status === "BLOCKED" ? "Ya, Buka Blokir" : "Ya, Blokir"}
        actionClass={modals.actionState.participant?.status === "BLOCKED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
        onConfirm={() => mutations.toggleBlockMutation.mutate(modals.actionState.participant?.student_id)}
        isLoading={mutations.toggleBlockMutation.isPending}
      />

      <MonitoringActionDialog
        open={modals.actionState.isOpen && modals.actionState.type === "FINISH"}
        onOpenChange={modals.closeActionModal}
        title="Paksa Selesai?"
        description={<>Tutup ujian <b>{modals.actionState.participant?.student?.profile?.full_name}</b> sekarang? Jawaban akan disimpan.</>}
        icon={<PowerOff className="w-6 h-6" />}
        actionText="Ya, Paksa Selesai" actionClass="bg-slate-800 hover:bg-slate-900"
        onConfirm={() => mutations.forceFinishMutation.mutate(modals.actionState.participant?.student_id)}
        isLoading={mutations.forceFinishMutation.isPending}
      />

      <ViolationGalleryModal 
        isOpen={modals.galleryState.isOpen}
        onClose={() => modals.setGalleryState({ isOpen: false, participant: null })}
        participant={modals.galleryState.participant}
      />
    </div>
  );
}