// LOKASI: src/components/pages/journals/attendance-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, CheckCircle2, MessageSquareHeart, CloudUpload, CloudOff, UserCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/use-auth-store";

import { journalService } from "@/services/journal.service";
import { studentService } from "@/services/student.service";

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journal: any | null;
}

export function AttendanceDialog({ open, onOpenChange, journal }: AttendanceDialogProps) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: "HADIR" | "SAKIT" | "IZIN" | "ALPA" | ""; note: string; behavior: string; synced?: boolean; sync_error?: string }>
  >({});
  
  const [isPrefilled, setIsPrefilled] = useState(false);

  const journalId = journal?.id;
  const classId = journal?.allocation?.class_id;

  //  LOGIKA SOP: DETEKSI KUNCI HARI INI & H+6
  const isTeacher = authUser?.role === "TEACHER";
  const isAdmin = authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN";

  const journalDate = dayjs(journal?.date).startOf('day');
  const today = dayjs().startOf('day');
  const diffDays = today.diff(journalDate, 'day');
  
  let sopLocked = false;
  let sopMessage = "";
  
  if (isTeacher && diffDays !== 0) {
    sopLocked = true;
    sopMessage = "SOP Terkunci: Guru hanya diizinkan mengisi absensi pada Hari-H jadwal. Silakan hubungi Admin.";
  } else if (isAdmin && (diffDays > 6 || diffDays < 0)) {
    sopLocked = true;
    sopMessage = "SOP Terkunci: Batas revisi khusus Admin (Maksimal H+6) telah berakhir.";
  }

  // Gabungkan dengan Lock Verifikasi
  const isVerified = journal?.status === "VERIFIED";
  const isLocked = isVerified || sopLocked; // Kunci mutlak

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students-by-class", classId],
    queryFn: async () => {
      const res = await studentService.getAll({ class_id: classId, limit: 1000 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: open && !!classId,
  });

  const { data: existingAttendances = [], isLoading: isLoadingAttendances } = useQuery({
    queryKey: ["attendances", journalId],
    queryFn: () => journalService.getAttendances(journalId),
    enabled: open && !!journalId,
  });

  useEffect(() => {
    if (!open) setIsPrefilled(false);
  }, [open]);

  useEffect(() => {
    if (open && !isPrefilled && !isLoadingStudents && !isLoadingAttendances && students.length > 0) {
      const records: any = {};
      if (existingAttendances.length > 0) {
        existingAttendances.forEach((att: any) => {
          records[att.student_id] = {
            status: att.status as "HADIR" | "SAKIT" | "IZIN" | "ALPA",
            note: att.note || "",
            behavior: att.behavior || "",
            synced: att.synced_to_third_party,
            sync_error: att.sync_error_message,
          };
        });
      } else {
        students.forEach((s: any) => {
          records[s.id] = { status: "", note: "", behavior: "" };
        });
      }
      setAttendanceRecords(records);
      setIsPrefilled(true); 
    }
  }, [open, isPrefilled, isLoadingStudents, isLoadingAttendances, students, existingAttendances]);

  const handleStatusChange = (studentId: string, status: "HADIR" | "SAKIT" | "IZIN" | "ALPA") => {
    if (isLocked) return;
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleTextChange = (studentId: string, field: "note" | "behavior", value: string) => {
    if (isLocked) return;
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const markAllPresent = () => {
    if (isLocked) return;
    const newRecords: any = { ...attendanceRecords };
    students.forEach((s: any) => {
      newRecords[s.id] = { ...newRecords[s.id], status: "HADIR" };
    });
    setAttendanceRecords(newRecords);
    toast.success("Semua siswa ditandai HADIR");
  };

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload = students.map((s: any) => ({
        student_id: s.id,
        status: attendanceRecords[s.id]?.status || "HADIR",
        note: attendanceRecords[s.id]?.note || "",
        behavior: attendanceRecords[s.id]?.behavior || "",
      }));
      return journalService.submitAttendances(journalId, payload);
    },
    onSuccess: () => {
      toast.success("Rekap absensi berhasil disimpan dan disinkronkan ke pusat!");
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      queryClient.invalidateQueries({ queryKey: ["attendances", journalId] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Gagal menyimpan absen"),
  });

  const isLoading = isLoadingStudents || isLoadingAttendances;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Users className="h-6 w-6 text-indigo-600" /> {isLocked ? "Detail Kehadiran Kelas" : "Pengisian Absensi Kelas"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {journal?.allocation?.subject?.name} — {journal?.allocation?.class?.name}
              </DialogDescription>
            </div>
            
            {/* Banner Gembok jika terkunci verifikasi atau terkunci SOP */}
            {isLocked ? (
              <div className="flex items-center text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">
                <Lock className="w-4 h-4 mr-2" /> Data Terkunci (View Only)
              </div>
            ) : (
              students.length > 0 && (
                <Button onClick={markAllPresent} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50">
                  <UserCheck className="h-4 w-4 mr-2" /> Tandai Semua Hadir
                </Button>
              )
            )}
          </div>

          {/*  TAMPILKAN PESAN KUNCI SOP JIKA AKTIF */}
          {sopLocked && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center">
              <Lock className="w-4 h-4 mr-2 shrink-0" />
              {sopMessage}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
          ) : (
            <div className="grid gap-3">
              {students.map((student: any, index: number) => {
                const record = attendanceRecords[student.id] || { status: "", note: "", behavior: "" };
                
                const statusOptions: Array<{ value: "HADIR" | "SAKIT" | "IZIN" | "ALPA"; label: string; activeClass: string }> = [
                  { value: "HADIR", label: "Hadir", activeClass: "bg-emerald-500 text-white border-emerald-600 shadow-inner" },
                  { value: "SAKIT", label: "Sakit", activeClass: "bg-amber-500 text-white border-amber-600 shadow-inner" },
                  { value: "IZIN", label: "Izin", activeClass: "bg-blue-500 text-white border-blue-600 shadow-inner" },
                  { value: "ALPA", label: "Alpa", activeClass: "bg-rose-500 text-white border-rose-600 shadow-inner" }
                ];

                return (
                  <div key={student.id} className={`bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${isLocked ? 'opacity-80' : 'shadow-sm hover:border-indigo-200'}`}>
                    <div className="flex-1 min-w-[200px] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          {student?.profile?.full_name || student?.full_name || student?.username || "-"}
                          {record.status !== "" && (
                            record.synced ? (
                              <span title="Terkirim ke Server PesantrenQu">
                                <CloudUpload className="h-4 w-4 text-emerald-500" />
                              </span>
                            ) : record.sync_error ? (
                              <span title={`Gagal Sync PesantrenQu: ${record.sync_error}`}>
                                <CloudOff className="h-4 w-4 text-rose-500 cursor-help" />
                              </span>
                            ) : null
                          )}
                        </div>
                        <div className="text-xs text-slate-500">NISN: {student?.nisn || student?.profile?.nisn || "-"}</div>
                      </div>
                    </div>

                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                      {statusOptions.map((opt) => {
                        const isActive = record.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            disabled={isLocked}
                            onClick={() => handleStatusChange(student.id, opt.value)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all disabled:cursor-not-allowed ${
                              isActive ? opt.activeClass : "text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-full md:w-auto mt-2 md:mt-0">
                      <div className="relative group">
                        <MessageSquareHeart className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                          disabled={isLocked}
                          placeholder="Catatan sikap..."
                          className="h-9 text-sm pl-9 md:w-[220px] bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-indigo-500 disabled:opacity-60"
                          value={record.behavior}
                          onChange={(e) => handleTextChange(student.id, "behavior", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t border-slate-100 shrink-0 z-10">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isLocked ? "Tutup" : "Batal"}
          </Button>
          {!isLocked && (
            <Button
              className="bg-[#047857] hover:bg-[#065f46] shadow-md"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || students.length === 0}
            >
              {submitMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Simpan Rekap Kehadiran
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}