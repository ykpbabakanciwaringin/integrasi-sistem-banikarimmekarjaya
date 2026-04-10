// LOKASI: src/components/pages/teachers/form/tab-academic.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TabAcademicProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  institutions: any[];
  isSuperAdmin: boolean;
  userInstName: string;
  isLoading?: boolean;
}

export function TabAcademic({ formData, handleChange, institutions, isSuperAdmin, userInstName, isLoading }: TabAcademicProps) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nomor Induk Kependudukan (NIK) *</Label>
          <Input value={formData?.nik || ""} onChange={(e) => handleChange("nik", e.target.value)} placeholder="Masukkan 16 Digit NIK" className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NIP / NIG / NUPTK</Label>
          <Input value={formData?.nip || ""} onChange={(e) => handleChange("nip", e.target.value)} placeholder="Kosongkan jika tidak ada" className="h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm" disabled={isLoading} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lembaga Utama *</Label>
          {isSuperAdmin ? (
            <Select value={formData?.institution_id || ""} onValueChange={(v) => handleChange("institution_id", v)} disabled={isLoading}>
              <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Pilih Lembaga" /></SelectTrigger>
              <SelectContent>
                {institutions?.map((inst: any) => (
                  <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
             <Input value={userInstName} disabled className="h-10 border-slate-200 bg-slate-50 text-slate-500 font-semibold shadow-sm" />
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jabatan Utama *</Label>
          <Select value={formData?.position || "GURU MAPEL"} onValueChange={(v) => handleChange("position", v)} disabled={isLoading}>
            <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger>
            <SelectContent>
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
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mt-2">
         <p className="text-[11px] text-slate-500 leading-relaxed text-center font-medium">
           <span className="font-bold text-slate-700">Catatan:</span> Penugasan lebih dari 1 lembaga (Multi-Lembaga) dapat diatur secara spesifik melalui menu Manajemen Akun setelah guru ini berhasil ditambahkan.
         </p>
      </div>
    </div>
  );
}