// LOKASI: src/components/pages/master-academic/holiday-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarOff, Plus } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { institutionService } from "@/services/institution.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { Holiday, Institution } from "@/types/master-academic";

import { HolidayDataTable } from "./holiday-data-table";
import { HolidayFormSheet } from "./holiday-form-sheet";
import { WeeklyDayOffBoard } from "./weekly-day-off-board";

export function HolidayTab() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  //  PERBAIKAN MULTI-TENANT (SWITCH ACCOUNT):
  // Sistem akan mengecek ID lembaga secara berurutan mulai dari yang paling aktif di sesi saat ini.
  const userInstId = 
    (user as any)?.active_institution_id || 
    (user as any)?.institution_id || 
    (user as any)?.institution?.id || 
    user?.enrollments?.[0]?.institution_id || 
    "";

  const [localFilterInstId, setLocalFilterInstId] = useState<string>(isSuperAdmin ? "ALL" : userInstId);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  // State untuk Sheet Panel Kanan
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Partial<Holiday>>({});

  //  SINKRONISASI OTOMATIS SAAT SWITCH ACCOUNT
  useEffect(() => {
    if (!isSuperAdmin && userInstId) {
      setLocalFilterInstId(userInstId);
    }
  }, [isSuperAdmin, userInstId]);

  // QUERY UTAMA LEMBAGA (Dengan Polling Real-Time)
  const { data: instRes } = useQuery({
    queryKey: ["institutions_list_all", userInstId],
    queryFn: () => institutionService.getAllPaginated({ limit: 500 }),
    refetchOnWindowFocus: true,
    refetchInterval: 5000, 
  });

  const institutions: Institution[] = Array.isArray(instRes) ? instRes : (instRes?.data || []);

  const handleAddHoliday = () => {
    setSelectedHoliday({ 
      id: "", 
      date: "", 
      name: "", 
      is_global: false, 
      institution_id: isSuperAdmin ? (localFilterInstId !== "ALL" ? localFilterInstId : "") : userInstId 
    });
    setIsEditMode(false);
    setIsSheetOpen(true);
  };

  const handleEditHoliday = (item: Holiday) => {
    setSelectedHoliday({ 
      id: item.id, 
      date: item.date ? item.date.split("T")[0] : "", 
      name: item.name, 
      is_global: item.is_global || false, 
      institution_id: item.institution_id || "" 
    });
    setIsEditMode(true);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. HEADER KONTROL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-100 rounded-lg">
               <CalendarOff className="h-5 w-5 text-emerald-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Manajemen Hari Libur</h3>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-3 ml-0 lg:ml-4 border-l-0 lg:border-l lg:pl-4 border-slate-200">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lembaga:</Label>
              <Select value={localFilterInstId} onValueChange={setLocalFilterInstId}>
                <SelectTrigger className="h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold text-emerald-700 shadow-sm focus:ring-emerald-500 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL" className="font-bold">Semua Lembaga (Global)</SelectItem>
                  {institutions.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-3">
             <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan:</Label>
             <Input 
               type="month" 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(e.target.value)} 
               className="h-10 w-44 bg-slate-50 border-slate-200 text-sm font-semibold shadow-sm focus-visible:ring-emerald-500 rounded-xl cursor-pointer" 
             />
          </div>
        </div>
        
        <Button className="h-10 w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 rounded-xl font-bold px-6 active:scale-95 transition-all" onClick={handleAddHoliday}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Libur Insidental
        </Button>
      </div>

      {/* 2. PAPAN KONTROL LIBUR RUTIN (AUTO-SAVE) */}
      <WeeklyDayOffBoard 
        currentFilterId={localFilterInstId}
        institutions={institutions}
        isSuperAdmin={isSuperAdmin}
        userInstId={userInstId}
      />

      {/* 3. TABEL MANDIRI */}
      <HolidayDataTable 
        isSuperAdmin={isSuperAdmin} 
        userInstId={userInstId} 
        localFilterInstId={localFilterInstId} 
        selectedMonth={selectedMonth} 
        institutions={institutions} 
        onEdit={handleEditHoliday} 
      />

      {/* 4. SHEET PANEL SAMPING */}
      <HolidayFormSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
        isEditMode={isEditMode} 
        initialData={selectedHoliday} 
        institutions={institutions} 
        isSuperAdmin={isSuperAdmin} 
        userInstId={userInstId} 
      />
    </div>
  );
}