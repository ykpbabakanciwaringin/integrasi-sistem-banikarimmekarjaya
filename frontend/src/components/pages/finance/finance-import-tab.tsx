// LOKASI: src/components/pages/finance/finance-import-tab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
//  FIX: Tambahkan SelectGroup dan SelectLabel
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileSpreadsheet, CheckCircle2, Settings2, Trash2, Info, RefreshCw } from "lucide-react";
import { financeService } from "@/services/finance.service";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FinanceImportTabProps {
  onSuccess: () => void;
  //  FIX: Menangkap props filterOptions
  filterOptions: { pondoks: string[]; sekolahs: string[]; programs: string[] };
}

interface MappingData {
  category_type: string;
  alias: string;
  target_unit: string;
}

export function FinanceImportTab({ onSuccess, filterOptions }: FinanceImportTabProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [newCategoriesFromExcel, setNewCategoriesFromExcel] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, MappingData>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: existingCategories = [], isLoading: isListLoading } = useQuery({
    queryKey: ["financeCategories"],
    queryFn: () => financeService.getCategories(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => financeService.updateCategory(id, payload),
    onSuccess: () => {
      toast.success("Kategori berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["financeCategories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeService.deleteCategory(id),
    onSuccess: () => {
      toast.success("Kategori berhasil dihapus dari sistem");
      queryClient.invalidateQueries({ queryKey: ["financeCategories"] });
    },
  });

  const handlePreview = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const uniqueCats = await financeService.previewExcel(file);
      
      const existingNames = existingCategories.map((c: any) => c.name);
      const trulyNew = uniqueCats.filter((cat: string) => !existingNames.includes(cat));

      setNewCategoriesFromExcel(trulyNew);

      const initialMappings: Record<string, MappingData> = {};
      uniqueCats.forEach((cat: string) => {
        const match = existingCategories.find((ec: any) => ec.name === cat);
        initialMappings[cat] = {
          category_type: match ? match.category_type : "Bulanan",
          alias: match && match.alias ? match.alias : "",
          //  Kosongkan jika baru agar Admin WAJIB memilih Tujuan Dana
          target_unit: match && match.target_unit ? match.target_unit : "" 
        };
      });
      
      setMappings(initialMappings);
      setStep(2);
      toast.success("Excel berhasil dianalisis");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menganalisis file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecute = async () => {
    if (!file) return;
    
    //  VALIDASI FRONTEND: Pastikan semua Tujuan Dana sudah dipilih
    const invalidTarget = Object.values(mappings).find(m => !m.target_unit || m.target_unit === "");
    if (invalidTarget) {
      toast.error("Mohon lengkapi Tujuan Dana untuk semua kategori baru!");
      return;
    }

    setIsProcessing(true);
    try {
      const formattedMappings = Object.entries(mappings).map(([original_name, data]) => ({
        original_name,
        category_type: data.category_type,
        alias: data.alias,
        target_unit: data.target_unit
      }));

      await financeService.executeImport(file, formattedMappings);
      toast.success("Data berhasil disimpan ke Rekapitulasi Pembayaran");
      
      setFile(null);
      setStep(1);
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      queryClient.invalidateQueries({ queryKey: ["financeCategories"] });
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal mengeksekusi import");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SEKSI 1: DAFTAR KATEGORI SISTEM (MASTER DATA) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-emerald-600" />
              Kategori Terdaftar di Sistem
            </h3>
            <p className="text-xs text-slate-500">Kelola singkatan *header* dan tujuan dana untuk laporan.</p>
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">
            {existingCategories.length} Kategori
          </Badge>
        </div>
        
        <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-wider">Nama Asli (Excel)</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider w-[180px]">Singkatan (Header)</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider w-[220px]">Pusat Tujuan Dana</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider w-[160px]">Sifat Tagihan</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-center w-[60px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isListLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-5 w-5 text-slate-400" /></TableCell></TableRow>
              ) : existingCategories.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400 text-sm italic">Belum ada kategori. Gunakan fitur import di bawah.</TableCell></TableRow>
              ) : (
                existingCategories.map((cat: any) => (
                  <TableRow key={cat.id} className="group hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-700 text-[11px] uppercase">{cat.name}</TableCell>
                    
                    <TableCell>
                      <Input 
                        defaultValue={cat.alias || ""}
                        placeholder="Cth: Uang Makan"
                        className="h-8 text-xs bg-white focus-visible:ring-emerald-500"
                        onBlur={(e) => {
                          if (e.target.value !== cat.alias) {
                            updateMutation.mutate({ id: cat.id, payload: { ...cat, alias: e.target.value } });
                          }
                        }}
                      />
                    </TableCell>

                    {/*  FIX: Dropdown Tujuan Dana Dinamis Mengelompok (Grouped) */}
                    <TableCell>
                      <Select 
                        defaultValue={cat.target_unit || ""} 
                        onValueChange={(val) => updateMutation.mutate({ id: cat.id, payload: { ...cat, target_unit: val } })}
                      >
                        <SelectTrigger className="h-8 text-[11px] font-bold border-slate-200 bg-white">
                          <SelectValue placeholder="Pilih Tujuan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filterOptions.sekolahs.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lembaga (Sekolah)</SelectLabel>
                              {filterOptions.sekolahs.map(s => <SelectItem key={s} value={s} className="text-[11px] font-bold text-slate-700">{s}</SelectItem>)}
                            </SelectGroup>
                          )}
                          {filterOptions.programs.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Program (Madrasah)</SelectLabel>
                              {filterOptions.programs.map(p => <SelectItem key={p} value={p} className="text-[11px] font-bold text-slate-700">{p}</SelectItem>)}
                            </SelectGroup>
                          )}
                          {filterOptions.pondoks.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Pondok Asrama</SelectLabel>
                              {filterOptions.pondoks.map(p => <SelectItem key={p} value={p} className="text-[11px] font-bold text-slate-700">{p}</SelectItem>)}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Select 
                        defaultValue={cat.category_type} 
                        onValueChange={(val) => updateMutation.mutate({ id: cat.id, payload: { ...cat, category_type: val } })}
                      >
                        <SelectTrigger className="h-8 text-[11px] font-bold border-slate-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bulanan" className="text-xs font-bold text-blue-600">BULANAN</SelectItem>
                          <SelectItem value="Tahunan" className="text-xs font-bold text-amber-600">TAHUNAN</SelectItem>
                          <SelectItem value="Lainnya" className="text-xs font-bold text-purple-600">LAINNYA</SelectItem>
                          <SelectItem value="Tunggakan" className="text-xs font-bold text-rose-600">TUNGGAKAN LALU</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                        onClick={() => { if(confirm(`Hapus kategori "${cat.name}"?`)) deleteMutation.mutate(cat.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SEKSI 2: AREA IMPORT EXCEL */}
      <div className="bg-white p-6 rounded-xl border-2 border-emerald-50 shadow-sm relative overflow-hidden">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Alur Import Tagihan Baru
          </h2>
          <p className="text-sm text-slate-500">Sistem akan otomatis mendeteksi kategori baru dari file Excel Anda.</p>
        </div>

        {step === 1 ? (
          <div 
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 transition-all cursor-pointer group"
            onClick={() => !file && document.getElementById("file-upload")?.click()}
          >
            <input type="file" accept=".xlsx, .xls" className="hidden" id="file-upload" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            
            {file ? (
              <div className="text-center animate-in zoom-in duration-300">
                <div className="bg-emerald-500 text-white p-3 rounded-full w-fit mx-auto mb-4 shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="font-bold text-slate-800 text-lg">{file.name}</p>
                <p className="text-[11px] text-slate-400 mb-6 uppercase tracking-widest font-bold">{(file.size / 1024).toFixed(1)} KB • Siap Dianalisis</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="bg-white">Batal</Button>
                  <Button onClick={(e) => { e.stopPropagation(); handlePreview(); }} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                    {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Mulai Analisis File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-white text-slate-400 p-4 rounded-full w-fit mx-auto mb-4 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-10 w-10 text-emerald-500/50" />
                </div>
                <p className="text-base font-bold text-slate-700">Klik atau Seret File Excel ke Sini</p>
                <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-tighter">Pastikan NIS di Kolom B & Tipe Tagihan di Kolom O</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 shadow-sm">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-[13px]">
                <p className="font-bold mb-1">Hasil Analisis Excel</p>
                {newCategoriesFromExcel.length > 0 ? (
                  <p>Ditemukan <b>{newCategoriesFromExcel.length}</b> kategori baru. Tentukan singkatan dan tujuan dananya secara presisi!</p>
                ) : (
                  <p>Semua kategori dalam file ini sudah dikenali oleh sistem. Anda bisa langsung menekan tombol simpan.</p>
                )}
              </div>
            </div>

            {newCategoriesFromExcel.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/30 shadow-inner">
                <Table>
                  <TableHeader className="bg-white">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase text-slate-500">Nama Asli</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-500 w-[180px]">Singkatan</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-500 w-[220px]">Pusat Tujuan Dana</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-500 w-[160px]">Sifat Tagihan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newCategoriesFromExcel.map((cat, idx) => (
                      <TableRow key={idx} className="bg-white/40">
                        <TableCell className="font-bold text-slate-800 text-[11px] uppercase">{cat}</TableCell>
                        
                        <TableCell>
                          <Input 
                            placeholder="Cth: SPP" 
                            className="h-9 text-xs bg-white"
                            value={mappings[cat]?.alias || ""}
                            onChange={(e) => setMappings({ ...mappings, [cat]: { ...mappings[cat], alias: e.target.value } })}
                          />
                        </TableCell>

                        {/*  FIX: Dropdown Tujuan Dana Dinamis Mengelompok untuk Import Baru */}
                        <TableCell>
                          <Select 
                            value={mappings[cat]?.target_unit} 
                            onValueChange={(val) => setMappings({ ...mappings, [cat]: { ...mappings[cat], target_unit: val } })}
                          >
                            <SelectTrigger className={`bg-white h-9 text-xs font-bold ${!mappings[cat]?.target_unit ? 'border-rose-400 focus:ring-rose-500' : 'border-emerald-100 focus:ring-emerald-500'}`}>
                              <SelectValue placeholder="Wajib Dipilih..." />
                            </SelectTrigger>
                            <SelectContent>
                              {filterOptions.sekolahs.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lembaga (Sekolah)</SelectLabel>
                                  {filterOptions.sekolahs.map(s => <SelectItem key={s} value={s} className="text-[11px] font-bold text-slate-700">{s}</SelectItem>)}
                                </SelectGroup>
                              )}
                              {filterOptions.programs.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Program (Madrasah)</SelectLabel>
                                  {filterOptions.programs.map(p => <SelectItem key={p} value={p} className="text-[11px] font-bold text-slate-700">{p}</SelectItem>)}
                                </SelectGroup>
                              )}
                              {filterOptions.pondoks.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Pondok Asrama</SelectLabel>
                                  {filterOptions.pondoks.map(p => <SelectItem key={p} value={p} className="text-[11px] font-bold text-slate-700">{p}</SelectItem>)}
                                </SelectGroup>
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Select 
                            value={mappings[cat]?.category_type} 
                            onValueChange={(val) => setMappings({ ...mappings, [cat]: { ...mappings[cat], category_type: val } })}
                          >
                            <SelectTrigger className="bg-white h-9 text-xs border-emerald-100 font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bulanan" className="text-xs font-bold text-blue-600">BULANAN</SelectItem>
                              <SelectItem value="Tahunan" className="text-xs font-bold text-amber-600">TAHUNAN</SelectItem>
                              <SelectItem value="Lainnya" className="text-xs font-bold text-purple-600">LAINNYA</SelectItem>
                              <SelectItem value="Tunggakan" className="text-xs font-bold text-rose-600">TUNGGAKAN LALU</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={isProcessing} className="text-slate-400 font-bold uppercase text-[11px]">Batal</Button>
              <Button onClick={handleExecute} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 shadow-lg shadow-emerald-100 font-bold uppercase text-xs tracking-wider">
                {isProcessing ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Memproses Data...</> : "Konfirmasi & Simpan ke Database"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}