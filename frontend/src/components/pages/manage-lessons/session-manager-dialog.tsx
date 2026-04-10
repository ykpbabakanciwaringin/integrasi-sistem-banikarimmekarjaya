// LOKASI: src/components/pages/manage-lessons/session-manager-dialog.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Clock, Server } from "lucide-react";
import { toast } from "sonner";
import { scheduleService } from "@/services/schedule.service";

interface SessionManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId: string;
  isPqActive?: boolean; //  PROPERTI BARU: Penanda status integrasi
}

export function SessionManagerDialog({ open, onOpenChange, institutionId, isPqActive = false }: SessionManagerDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    pesantrenqu_event_id: ""
  });

  // 1. Ambil Daftar Sesi dari Database
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["class_sessions", institutionId],
    queryFn: () => scheduleService.getSessions(institutionId),
    enabled: open && !!institutionId,
  });

  // 2. Mutasi Simpan Sesi
  const createMutation = useMutation({
    mutationFn: async (data: any) => await scheduleService.createSession(data),
    onSuccess: () => {
      toast.success("Sesi berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["class_sessions", institutionId] });
      setFormData({ name: "", start_time: "", end_time: "", pesantrenqu_event_id: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Gagal menambahkan sesi");
    }
  });

  // 3. Mutasi Hapus Sesi
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await scheduleService.deleteSession(id),
    onSuccess: () => {
      toast.success("Sesi berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["class_sessions", institutionId] });
    },
    onError: () => toast.error("Gagal menghapus sesi")
  });

  const handleSubmit = () => {
    //  VALIDASI CERDAS: Sesuaikan dengan status integrasi
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast.error("Harap lengkapi Nama Sesi dan Jam!");
      return;
    }

    if (isPqActive && !formData.pesantrenqu_event_id) {
      toast.error("Event ID PesantrenQu wajib diisi karena integrasi aktif!");
      return;
    }

    createMutation.mutate({
      ...formData,
      // Jika PQ mati, set ID ke 0 agar database tidak error
      pesantrenqu_event_id: isPqActive ? parseInt(formData.pesantrenqu_event_id) : 0,
      institution_id: institutionId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Clock className="w-5 h-5 text-indigo-600" />
            Kelola Master Sesi KBM
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Atur jam pelajaran baku {isPqActive && "dan integrasikan ID Event dari PesantrenQu"} untuk lembaga ini.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* KOLOM KIRI: FORM TAMBAH SESI */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Tambah Sesi Baru
            </h4>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase">Nama Sesi <span className="text-rose-500">*</span></Label>
              <Input 
                placeholder="Cth: Sesi 1 (07:00 - 08:30)" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-white border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase">Jam Mulai <span className="text-rose-500">*</span></Label>
                <Input 
                  type="time" 
                  value={formData.start_time} 
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase">Jam Selesai <span className="text-rose-500">*</span></Label>
                <Input 
                  type="time" 
                  value={formData.end_time} 
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="bg-white border-slate-200"
                />
              </div>
            </div>

            {/*  UX: Sembunyikan input Event ID jika PQ mati */}
            {isPqActive && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-400" /> Event ID PesantrenQu <span className="text-rose-500">*</span>
                </Label>
                <Input 
                  type="number" 
                  placeholder="Cth: 2585" 
                  value={formData.pesantrenqu_event_id} 
                  onChange={(e) => setFormData({...formData, pesantrenqu_event_id: e.target.value})}
                  className="bg-white border-slate-200"
                />
              </div>
            )}

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm mt-2" 
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan Sesi
            </Button>
          </div>

          {/* KOLOM KANAN: DAFTAR SESI */}
          <div className="flex flex-col max-h-[400px]">
            <h4 className="font-bold text-sm text-slate-700 mb-3 px-1 border-b border-slate-100 pb-2">Daftar Sesi Tersimpan</h4>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin">
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Clock className="w-8 h-8 text-slate-300 mb-2" />
                  <span className="text-slate-500 text-sm font-medium">Belum ada data sesi.</span>
                  <span className="text-slate-400 text-xs mt-1">Silakan tambah di samping.</span>
                </div>
              ) : (
                sessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm group hover:border-indigo-300 transition-all hover:shadow-md">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{session.name}</div>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> {session.start_time} - {session.end_time}
                      </div>
                      
                      {/*  UX: Sembunyikan badge Event ID jika PQ mati */}
                      {isPqActive && session.pesantrenqu_event_id ? (
                        <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-bold w-max mt-1.5 flex items-center gap-1">
                          <Server className="w-3 h-3" /> Event ID: {session.pesantrenqu_event_id}
                        </div>
                      ) : null}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(session.id)}
                      disabled={deleteMutation.isPending}
                      title="Hapus Sesi"
                      className="text-rose-400 hover:bg-rose-50 hover:text-rose-600 h-8 w-8 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}