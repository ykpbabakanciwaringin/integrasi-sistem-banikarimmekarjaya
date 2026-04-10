// LOKASI: src/components/pages/master-academic/weekly-day-off-board.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings2, Search, School } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { institutionService } from "@/services/institution.service";
import { Institution } from "@/types/master-academic";

interface WeeklyDayOffBoardProps {
  currentFilterId: string;
  institutions: Institution[];
  isSuperAdmin: boolean;
  userInstId: string;
}

export function WeeklyDayOffBoard({ currentFilterId, institutions, isSuperAdmin, userInstId }: WeeklyDayOffBoardProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingInstId, setUpdatingInstId] = useState<string | null>(null);

  //  LOGIKA FILTER OTOMATIS:
  // Jika "ALL" (Semua Lembaga), tampilkan semua dan filter berdasarkan kotak pencarian.
  // Jika bukan "ALL", tampilkan HANYA lembaga yang sedang aktif/difilter (berlaku untuk Admin Lembaga).
  const displayedInstitutions = currentFilterId === "ALL"
    ? institutions.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : institutions.filter((i) => i.id === currentFilterId);

  //  Sembunyikan kotak pencarian jika data yang ditampilkan hanya 1 lembaga
  const showSearch = currentFilterId === "ALL" && institutions.length > 1;

  // MUTASI AUTO-SAVE INLINE (Tetap dipertahankan karena sudah berjalan mulus)
  const mutation = useMutation({
    mutationFn: (data: { instId: string; day: string }) => institutionService.updateWeeklyDayOff(data.day, data.instId),
    onMutate: (variables) => {
      setUpdatingInstId(variables.instId);
    },
    onSettled: () => {
      setUpdatingInstId(null);
      queryClient.invalidateQueries({ queryKey: ["institutions_list_all", userInstId] });
    },
    onSuccess: (_, variables) => {
      toast.success(variables.day === "" ? "Libur rutinan dihapus" : `Libur rutin disetel ke hari ${variables.day}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Gagal menyimpan perubahan");
    }
  });

  const handleDayChange = (instId: string, value: string) => {
    mutation.mutate({ instId, day: value === "NONE" ? "" : value });
  };

  // Jika tidak ada data yang cocok, tidak perlu render apa-apa
  if (displayedInstitutions.length === 0) return null;

  return (
    <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-emerald-600"/> Papan Kontrol Libur Rutin
          </h4>
          <p className="text-[11px] font-medium text-slate-500 mt-1">
            Ubah jadwal libur lembaga secara instan.
          </p>
        </div>

        {/* Kotak pencarian hanya dirender jika showSearch = true */}
        {showSearch && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari lembaga..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-9 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-emerald-500 text-xs font-semibold" 
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {displayedInstitutions.map((inst) => (
          <div key={inst.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:border-emerald-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1.5 bg-slate-100 rounded-md shrink-0"><School className="h-4 w-4 text-slate-500"/></div>
              <div>
                <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{inst.name}</p>
                {inst.weekly_day_off ? (
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase rounded-md">
                    LIBUR: {inst.weekly_day_off}
                  </span>
                ) : (
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase rounded-md border border-slate-200">
                    Belum Diatur
                  </span>
                )}
              </div>
            </div>
            
            <div className="relative w-full">
               <Select value={inst.weekly_day_off || "NONE"} onValueChange={(val) => handleDayChange(inst.id, val)} disabled={updatingInstId === inst.id}>
                <SelectTrigger className={`w-full h-9 text-xs font-bold rounded-lg shadow-sm transition-colors ${updatingInstId === inst.id ? 'opacity-50 bg-slate-100' : 'bg-slate-50 border-slate-200 focus:ring-emerald-500 hover:bg-slate-100'}`}>
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs font-semibold">
                  <SelectItem value="NONE" className="text-rose-600 font-bold">Tanpa Libur</SelectItem>
                  <SelectItem value="JUMAT">Jumat</SelectItem>
                  <SelectItem value="SABTU">Sabtu</SelectItem>
                  <SelectItem value="AHAD">Minggu / Ahad</SelectItem>
                </SelectContent>
              </Select>
              {updatingInstId === inst.id && <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}