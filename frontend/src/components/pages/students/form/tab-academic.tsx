// LOKASI: src/components/pages/students/form/tab-academic.tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function TabAcademic({ formData, handleChange, handleInstitutionChange, institutions, formClasses, isLoading, isLoadingClasses, isSuperAdmin, isEditMode, userInstName }: any) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lembaga Pendidikan {!isEditMode && "*"}</Label>
          {isEditMode ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-500 flex flex-col gap-1 shadow-sm">
              <span className="font-semibold text-slate-700">Terkunci (Mode Edit)</span>
              <span className="text-[10px] italic text-amber-600">Pindah lembaga hanya bisa dilakukan melalui Menu Akun.</span>
            </div>
          ) : isSuperAdmin ? (
            <Select value={formData?.institution_id || ""} onValueChange={handleInstitutionChange} disabled={isLoading}>
              <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Pilih Lembaga Formal..." /></SelectTrigger>
              <SelectContent>{institutions?.map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}</SelectContent>
            </Select>
          ) : (
            <div className="h-10 px-3 flex items-center bg-slate-100 text-slate-600 rounded border border-slate-200 text-sm font-semibold shadow-sm">{userInstName}</div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            Kelas / Rombel Formal
            {isLoadingClasses && <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />}
          </Label>
          <Select value={formData?.class_id || "none"} onValueChange={(v) => handleChange("class_id", v)} disabled={isLoading || isLoadingClasses || !formData?.institution_id}>
            <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm">
              <SelectValue placeholder={isLoadingClasses ? "Memuat data kelas..." : "Pilih Kelas..."} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-amber-600 font-medium">Belum Ditentukan</SelectItem>
              {formClasses?.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name} {c.major && c.major !== "UMUM" ? `(${c.major})` : ""}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pondok Pesantren</Label>
          <Select value={formData?.pondok || "none"} onValueChange={(v) => handleChange("pondok", v === "none" ? "" : v)} disabled={isLoading}>
            <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Pilih Pondok" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-amber-600 font-medium">Belum Ditentukan</SelectItem>
              <SelectItem value="PESANTREN PUTRA ASSALAFIE">Pesantren Putra Assalafie</SelectItem>
              <SelectItem value="PESANTREN PUTRI ASSALAFIAT I">Pesantren Putri Assalafiat I</SelectItem>
              <SelectItem value="PESANTREN PUTRI ASSALAFIAT II">Pesantren Putri Assalafiat II</SelectItem>
              <SelectItem value="PESANTREN PUTRI ASSALAFIAT III">Pesantren Putri Assalafiat III</SelectItem>
              <SelectItem value="PESANTREN PUTRI ASSALAFIAT IV">Pesantren Putri Assalafiat IV</SelectItem>
              <SelectItem value="PESANTREN PUTRI ASSALAFIAT V">Pesantren Putri Assalafiat V</SelectItem>
              <SelectItem value="TIDAK MUKIM DI PESANTREN">Tidak Mukim di Pesantren</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Asrama / Komplek</Label>
          <Input value={formData?.asrama || ""} onChange={(e) => handleChange("asrama", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: Komplek Al-Ghazali" disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nomor Kamar</Label>
          <Input value={formData?.kamar || ""} onChange={(e) => handleChange("kamar", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: 01 / A.1" disabled={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Program Tambahan</Label>
          <Select value={formData?.program || "none"} onValueChange={(v) => handleChange("program", v === "none" ? "" : v)} disabled={isLoading}>
            <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Pilih Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-amber-600 font-medium">Belum Ditentukan</SelectItem>
              <SelectItem value="MADRASAH DINIYAH ASSALAFIE">Madrasah Diniyah Assalafie</SelectItem>
              <SelectItem value="MADRASAH AL-HIKAMUS SALAFIYAH PUTRI">Madrasah Al-Hikamus Salafiyah Putri</SelectItem>
              <SelectItem value="METODE AUZAN LIL BANIN">Metode Auzan Lil Banin</SelectItem>
              <SelectItem value="METODE AUZAN LIL BANAT">Metode Auzan Lil Banat</SelectItem>
              <SelectItem value="METODE ILHAMQU LIL BANIN">Metode Ilhamqu Lil Banin</SelectItem>
              <SelectItem value="METODE ILHAMQU LIL BANAT">Metode Ilhamqu Lil Banat</SelectItem>
              <SelectItem value="TAHFIDZ AL-QUR'AN REGULER">Tahfidz Al-Qur'an Reguler</SelectItem>
              <SelectItem value="TIDAK IKUT PROGRAM">Tidak Ikut Program</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kelas Program</Label>
          <Input value={formData?.kelas_program || ""} onChange={(e) => handleChange("kelas_program", e.target.value)} className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" placeholder="Contoh: 1 Ula / 2 Wustho" disabled={isLoading} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Keaktifan</Label>
          <Select value={formData?.status || "ACTIVE"} onValueChange={(v) => handleChange("status", v)} disabled={isLoading}>
            <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE" className="font-bold text-emerald-600">Aktif Belajar</SelectItem>
              <SelectItem value="NON AKTIF" className="font-medium text-slate-600">Non-Aktif / Cuti</SelectItem>
              <SelectItem value="PINDAH" className="font-medium text-amber-600">Pindah / Mutasi</SelectItem>
              <SelectItem value="ALUMNI" className="font-medium text-blue-600">Lulus (Alumni)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}