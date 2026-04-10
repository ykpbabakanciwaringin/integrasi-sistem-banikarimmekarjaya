"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { AccountFilter, RoleDisplayMap } from "@/types/user";

interface AccountFiltersProps {
  filter: AccountFilter;
  setFilter: (filter: AccountFilter) => void;
  searchInput: string;
  setSearchInput: (val: string) => void;
  institutionsData: { id: string; name: string }[];
  pendingCount: number;
}

export function AccountFilters({
  filter, setFilter, searchInput, setSearchInput, institutionsData, pendingCount,
}: AccountFiltersProps) {
  
  const handleFilterChange = (key: keyof AccountFilter, value: any) => {
    setFilter({ ...filter, [key]: value, page: 1 });
  };

  return (
    <div className="space-y-0">
      {/*  TABS STATUS (Terintegrasi Lencana Merah Berkedip) */}
      <div className="border-b border-slate-100 px-6 pt-4 bg-white rounded-t-xl">
        <Tabs value={filter.status} onValueChange={(v) => handleFilterChange("status", v)}>
          <TabsList className="bg-transparent h-12 p-0 gap-6">
            <TabsTrigger 
              value="ACTIVE" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-semibold text-slate-500 transition-colors"
            >
              Akun Aktif
            </TabsTrigger>
            <TabsTrigger 
              value="PENDING" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 rounded-none px-2 font-semibold text-slate-500 flex items-center gap-2 transition-colors"
            >
              Menunggu Verifikasi 
              {pendingCount > 0 && (
                <Badge className="bg-rose-500 text-white px-1.5 py-0 h-5 text-[10px] animate-pulse">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/*  SEARCH & DINAMIC DROPDOWN FILTERS (Layout 12 Kolom) */}
      <div className="bg-slate-50/50 border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          
          {/* 1. Pencarian (4 Kolom) */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari Username, Nama, NISN, atau NIP..." 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
              className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm" 
            />
          </div>
          
          {/* 2. Filter Role (2 Kolom) */}
          <div className="lg:col-span-2">
            <Select value={filter.role} onValueChange={(v) => handleFilterChange("role", v)}>
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Role</SelectItem>
                {Object.entries(RoleDisplayMap).map(([key, val]) => (<SelectItem key={key} value={key}>{val}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Filter Lembaga (2 Kolom) */}
          <div className="lg:col-span-2">
            <Select value={filter.institution_id} onValueChange={(v) => handleFilterChange("institution_id", v)}>
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
                <SelectValue placeholder="Semua Lembaga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Lembaga</SelectItem>
                <SelectItem value="GLOBAL">Pusat / Global</SelectItem>
                {institutionsData?.map((inst) => (<SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Filter Jenis Kelamin (2 Kolom) */}
          <div className="lg:col-span-2">
            <Select value={filter.gender || "ALL"} onValueChange={(v) => handleFilterChange("gender", v)}>
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
                <SelectValue placeholder="Semua Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Gender</SelectItem>
                <SelectItem value="L">Laki-laki (L)</SelectItem>
                <SelectItem value="P">Perempuan (P)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. Filter Jabatan (2 Kolom) */}
          <div className="lg:col-span-2">
            <Select value={filter.position || "ALL"} onValueChange={(v) => handleFilterChange("position", v)}>
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
                <SelectValue placeholder="Semua Jabatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Jabatan</SelectItem>
                <SelectItem value="GURU MAPEL">Guru Mapel</SelectItem>
                <SelectItem value="WALI KELAS">Wali Kelas</SelectItem>
                <SelectItem value="KEPALA MADRASAH">Kepala Madrasah</SelectItem>
                <SelectItem value="WAKA KURIKULUM">Waka Bid Kurikulum</SelectItem>
                <SelectItem value="KEPALA STAFF TU">Kepala Staff TU</SelectItem>
                <SelectItem value="TATA USAHA">Tata Usaha</SelectItem>
                <SelectItem value="BENDAHARA">Bendahara</SelectItem>
                <SelectItem value="GURU PIKET">Guru Piket</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>
    </div>
  );
}