// LOKASI: src/components/pages/manage-exams/[eventId]/sessions-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SessionsFiltersProps {
  activeTab: string; 
  onTabChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  filterSubject: string;
  onFilterSubjectChange: (val: string) => void;
  subjects: any[];
}

export function SessionsFilters({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  filterSubject,
  onFilterSubjectChange,
  subjects,
}: SessionsFiltersProps) {
  return (
    <div className="space-y-0">
      
      {/*  TABS FILTER STATUS SESI (Sesuai Standar Data Siswa) */}
      <div className="border-b border-slate-100 px-6 pt-4 bg-white rounded-t-xl overflow-x-auto scrollbar-none">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-max sm:w-full">
          <TabsList className="bg-transparent h-12 p-0 gap-6 w-full justify-start">
            <TabsTrigger 
              value="ALL" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-semibold text-slate-500 transition-colors h-full shadow-none"
            >
              Semua Sesi
            </TabsTrigger>
            <TabsTrigger 
              value="ACTIVE" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none px-2 font-semibold text-slate-500 transition-colors h-full shadow-none flex items-center gap-2"
            >
              Sedang Berjalan
            </TabsTrigger>
            <TabsTrigger 
              value="UPCOMING" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 rounded-none px-2 font-semibold text-slate-500 transition-colors h-full shadow-none"
            >
              Akan Datang
            </TabsTrigger>
            <TabsTrigger 
              value="FINISHED" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-semibold text-slate-500 transition-colors h-full shadow-none"
            >
              Selesai
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/*  SEARCH & DINAMIC DROPDOWN FILTERS (Layout 12 Kolom) */}
      <div className="bg-slate-50/50 border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          
          {/* 1. Pencarian */}
          <div className="lg:col-span-8 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Cari nama sesi ujian atau ketik 6 digit token sesi..."
              className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm placeholder:text-slate-400"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* 2. Filter Mata Pelajaran Dinamis */}
          <div className="lg:col-span-4 relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <BookOpen className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <Select value={filterSubject} onValueChange={onFilterSubjectChange}>
              <SelectTrigger className="pl-9 h-10 bg-white border-slate-200 text-sm focus:ring-emerald-500 shadow-sm w-full font-medium text-slate-700">
                <SelectValue placeholder="Semua Mata Pelajaran" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="ALL" className="font-bold text-indigo-700 bg-indigo-50/50 mb-1">
                  Semua Mata Pelajaran
                </SelectItem>
                {subjects?.length > 0 ? (
                  subjects.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.name} className="font-medium">
                      {sub.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-slate-500 text-center italic">
                    Data mapel kosong
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>
    </div>
  );
}