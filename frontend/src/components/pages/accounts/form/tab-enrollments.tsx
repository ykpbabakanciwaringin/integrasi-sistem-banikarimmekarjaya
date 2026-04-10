import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Building2, Trash2 } from "lucide-react";
import { RoleDisplayMap, UserRole } from "@/types/user";

export function TabEnrollments({ activeAccountDetail, deletedEnrollmentIds, setDeletedEnrollmentIds, institutions, onAddEnrollment, onDeleteEnrollment, isLoading, isEnrollmentLoading }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInst, setSelectedInst] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("GURU MAPEL");

  const displayEnrollments = (activeAccountDetail?.enrollments || []).filter((en: any) => !deletedEnrollmentIds.includes(en.id));

  const handleInstantDelete = (enrollId: string) => {
    if (onDeleteEnrollment) {
      setDeletedEnrollmentIds((prev: any) => [...prev, enrollId]);
      onDeleteEnrollment(enrollId);
    }
  };

  const handleInternalAddEnrollment = () => {
    if (selectedInst && selectedRole && onAddEnrollment) {
      onAddEnrollment(selectedInst, selectedRole, selectedPosition);
      setSelectedInst(""); setSelectedRole(""); setSelectedPosition("GURU MAPEL"); setShowAddForm(false); 
    }
  };

  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Daftar Penugasan</h4>
        {!showAddForm && (
          <Button variant="outline" size="sm" className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm" onClick={() => setShowAddForm(true)} disabled={isLoading || isEnrollmentLoading}>
            <Plus className="h-3 w-3 mr-1" /> Tambah
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {displayEnrollments.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-sm text-slate-500 bg-slate-50">Belum ada penugasan lembaga.</div>
        ) : (
          displayEnrollments.map((en: any, idx: number) => (
            <div key={en.id || idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-white border border-slate-100 rounded-full flex items-center justify-center shrink-0 shadow-sm"><Building2 className="h-4 w-4 text-slate-400" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{en.institution?.name || "Lembaga"}</p>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 border border-slate-200 bg-white px-1.5 py-0.5 rounded">{RoleDisplayMap[en.role as UserRole] || en.role}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded uppercase">{en.position || "Staff"}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => handleInstantDelete(en.id)} disabled={isLoading || isEnrollmentLoading}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))
        )}
      </div>

      {showAddForm && (
        <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Sekolah / Unit</Label><Select value={selectedInst} onValueChange={setSelectedInst} disabled={isEnrollmentLoading || isLoading}><SelectTrigger className="bg-white border-emerald-200 shadow-sm"><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{institutions.map((i:any) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Akses Sistem</Label><Select value={selectedRole} onValueChange={setSelectedRole} disabled={isEnrollmentLoading || isLoading}><SelectTrigger className="bg-white border-emerald-200 shadow-sm"><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{Object.entries(RoleDisplayMap).filter(([k]) => k !== "SUPER_ADMIN").map(([k, v]) => (<SelectItem key={k} value={k}>{v as string}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Jabatan Fisik</Label><Select value={selectedPosition} onValueChange={setSelectedPosition} disabled={isEnrollmentLoading || isLoading}><SelectTrigger className="bg-white border-emerald-200 shadow-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SISWA">Siswa</SelectItem><SelectItem value="GURU MAPEL">Guru Mapel</SelectItem><SelectItem value="WALI KELAS">Wali Kelas</SelectItem><SelectItem value="KEPALA MADRASAH">Kepala Madrasah</SelectItem><SelectItem value="WAKA KURIKULUM">Waka Bid Kurikulum</SelectItem><SelectItem value="KEPALA STAFF TU">Kepala Staff TU</SelectItem><SelectItem value="TATA USAHA">Tata Usaha</SelectItem><SelectItem value="BENDAHARA">Bendahara</SelectItem><SelectItem value="GURU PIKET">Guru Piket</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex justify-end pt-2 border-t border-emerald-100 mt-2 gap-2">
            <Button size="sm" variant="ghost" className="text-emerald-700 hover:bg-emerald-100" onClick={() => setShowAddForm(false)}>Batal</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={handleInternalAddEnrollment} disabled={isEnrollmentLoading || !selectedInst || !selectedRole}>{isEnrollmentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Simpan</Button>
          </div>
        </div>
      )}
    </div>
  );
}