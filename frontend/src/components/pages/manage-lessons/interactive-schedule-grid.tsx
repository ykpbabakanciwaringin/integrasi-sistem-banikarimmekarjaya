// LOKASI: src/components/pages/manage-lessons/interactive-schedule-grid.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MapPin, Loader2, Clock, Server, Info } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { scheduleService } from "@/services/schedule.service";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

interface InteractiveScheduleGridProps {
  allocations: any[];
  institutionId: string;
  academicYearId: string;
  classId: string;
  isPqActive?: boolean; //  PROPERTI: Deteksi status integrasi lembaga
}

export function InteractiveScheduleGrid({ allocations, institutionId, academicYearId, classId, isPqActive = false }: InteractiveScheduleGridProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Senin");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  
  // Field pesantrenqu_event_id di formData tetap ada, tapi diset 0 saat submit jika integrasi mati
  const [formData, setFormData] = useState({ 
    allocation_id: "", 
    start_time: "", 
    end_time: "", 
    room_name: "",
    pesantrenqu_event_id: 0 
  });

  //  UX: Query dikembalikan agar SELALU mengambil master sesi untuk kemudahan Admin
  const { data: masterSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["class_sessions", institutionId],
    queryFn: () => scheduleService.getSessions(institutionId),
    enabled: !!institutionId, 
  });

  // 2. PEMETAAN JADWAL KE DALAM GRID
  const scheduleMap: Record<string, any[]> = {};
  allocations.forEach((alloc) => {
    alloc.schedules?.forEach((s: any) => {
      if (!scheduleMap[s.day_of_week]) scheduleMap[s.day_of_week] = [];
      scheduleMap[s.day_of_week].push({ ...s, allocation: alloc });
    });
  });

  Object.keys(scheduleMap).forEach(day => {
    scheduleMap[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  // 3. MUTASI SIMPAN & HAPUS
  const addMutation = useMutation({
    mutationFn: () => scheduleService.addScheduleDetail(formData.allocation_id, {
      ...formData,
      day_of_week: selectedDay, 
      // Jika integrasi mati, pastikan event ID selalu dikirim sebagai 0 ke database
      pesantrenqu_event_id: isPqActive ? formData.pesantrenqu_event_id : 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations", institutionId, academicYearId, classId] });
      queryClient.invalidateQueries({ queryKey: ["allocations_master", institutionId, academicYearId] });
      toast.success("Sesi jadwal berhasil ditambahkan!");
      setFormOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Gagal menambah sesi"),
  });

  const deleteMutation = useMutation({
    mutationFn: scheduleService.deleteScheduleDetail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations", institutionId, academicYearId, classId] });
      queryClient.invalidateQueries({ queryKey: ["allocations_master", institutionId, academicYearId] });
      toast.success("Sesi jadwal dihapus!");
    },
    onError: (err: any) => toast.error(err.message || "Gagal menghapus sesi"),
  });

  const handleOpenAdd = (day: string) => {
    setSelectedDay(day);
    setSelectedSessionId("");
    setFormData({ allocation_id: "", start_time: "", end_time: "", room_name: "", pesantrenqu_event_id: 0 });
    setFormOpen(true);
  };

  // 4. FUNGSI CERDAS SAAT DROPDOWN SESI DIPILIH
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const session = masterSessions.find((s: any) => s.id === sessionId);
    if (session) {
      setFormData({ 
        ...formData, 
        start_time: session.start_time, 
        end_time: session.end_time,
        pesantrenqu_event_id: session.pesantrenqu_event_id || 0
      });
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[600px] flex flex-col">
        <div className="overflow-auto flex-1 p-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 min-w-[800px]">
            {DAYS.map((day) => (
              <div key={day} className="flex flex-col bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-200 text-slate-700 font-bold text-center py-2 text-sm uppercase tracking-wider flex justify-between items-center px-3 border-b border-slate-300">
                  {day}
                  <button onClick={() => handleOpenAdd(day)} className="h-6 w-6 flex items-center justify-center bg-white rounded-md text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors shadow-sm">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  {scheduleMap[day] ? scheduleMap[day].map((s) => (
                    <div key={s.id} className="bg-white border-l-4 border-emerald-500 rounded-md p-2 shadow-sm relative group text-xs hover:border-emerald-400 transition-colors">
                      <div className="font-bold text-slate-800 line-clamp-1">{s.allocation?.subject?.name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{s.allocation?.teacher?.profile?.full_name || s.allocation?.teacher?.full_name || s.allocation?.teacher?.name || "Guru"}</div>
                      <div className="mt-1.5 flex items-center justify-between font-mono font-medium text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                        {s.start_time} - {s.end_time}
                      </div>
                      
                      {s.room_name && <div className="text-[9px] mt-1 text-slate-400 flex items-center font-medium uppercase"><MapPin className="h-2.5 w-2.5 mr-1"/> {s.room_name}</div>}
                      
                      {/*  UX: INDIKATOR EVENT ID (Hanya muncul jika isPqActive dan ada ID-nya) */}
                      {isPqActive && s.pesantrenqu_event_id ? (
                        <div className="text-[9px] mt-1 text-amber-600 flex items-center font-medium">
                          <Server className="h-2.5 w-2.5 mr-1" /> PQ: {s.pesantrenqu_event_id}
                        </div>
                      ) : null}
                      
                      <button onClick={() => deleteMutation.mutate(s.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-rose-500 bg-white rounded p-1 hover:bg-rose-50 transition-opacity border border-rose-100">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )) : (
                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-md text-[10px] text-slate-400 font-medium bg-slate-50/50">Tidak ada jadwal</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[400px] bg-white rounded-xl border-0 shadow-2xl p-0 overflow-hidden">
          <VisuallyHidden.Root><DialogTitle>Tambah Sesi ({selectedDay})</DialogTitle></VisuallyHidden.Root>
          <DialogHeader className="p-5 bg-emerald-600 text-white shrink-0">
            <h2 className="text-lg font-bold text-white tracking-tight">Tambah Sesi ({selectedDay})</h2>
            <DialogDescription className="text-emerald-100/80 text-xs">Pilih pengampu dan tentukan jam mengajar.</DialogDescription>
          </DialogHeader>
          
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Mapel & Guru (Dari Alokasi) <span className="text-rose-500">*</span></Label>
              <Select value={formData.allocation_id} onValueChange={(v) => setFormData({ ...formData, allocation_id: v })}>
                <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Alokasi..." /></SelectTrigger>
                <SelectContent>
                  {allocations.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.subject?.name} - {a.teacher?.profile?.full_name || a.teacher?.full_name || a.teacher?.name || "Guru"}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/*  UX ENHANCEMENT: Dropdown Dipertahankan, Gaya Dinamis Berdasarkan isPqActive */}
            <div className={`space-y-2 p-3 rounded-lg border ${isPqActive ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
              <Label className={`text-xs font-bold flex items-center gap-1 uppercase ${isPqActive ? 'text-amber-700' : 'text-emerald-700'}`}>
                <Clock className="h-3 w-3" /> {isPqActive ? "Pilih Sesi PesantrenQu" : "Pilih Master Sesi"}
              </Label>
              <Select value={selectedSessionId} onValueChange={handleSessionChange} disabled={isLoadingSessions}>
                <SelectTrigger className={`bg-white shadow-sm ${isPqActive ? 'border-amber-200 focus:ring-amber-500' : 'border-slate-200 focus:ring-emerald-500'}`}>
                  <SelectValue placeholder={isLoadingSessions ? "Memuat Sesi..." : "Pilih Sesi Jam..."} />
                </SelectTrigger>
                <SelectContent>
                  {masterSessions.length === 0 ? (
                    <SelectItem value="empty" disabled>Belum ada master sesi</SelectItem>
                  ) : (
                    masterSessions.map((session: any) => (
                      <SelectItem key={session.id} value={session.id} className="font-medium text-slate-700">
                        {session.name} ({session.start_time} - {session.end_time})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className={`text-[9px] font-medium ${isPqActive ? 'text-amber-600' : 'text-slate-500'}`}>
                {isPqActive ? "Jam dan Event ID akan terisi otomatis." : "Jam pelajaran akan terisi otomatis berdasarkan sesi."}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Ruangan (Opsional)</Label>
              <Input placeholder="Cth: Lab Komputer 1" className="bg-slate-50 border-slate-200" value={formData.room_name} onChange={(e) => setFormData({...formData, room_name: e.target.value})} />
            </div>
          </div>
          
          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !formData.allocation_id || !formData.start_time || !formData.end_time}>
              {addMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Simpan Sesi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}