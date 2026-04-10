// LOKASI: src/components/pages/results/classes/useClassLegerController.ts
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { reportService } from "@/services/report.service";

// --- CUSTOM HOOK DEBOUNCE (Mencegah lag saat ngetik) ---
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useClassLegerController() {
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // --- STATE PAGINASI & PENCARIAN ---
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // --- STATE LOKAL AUTO-SAVE ---
  // Menyimpan perubahan S/I/A dan Catatan di memori sebelum dilempar ke database
  const [localReports, setLocalReports] = useState<Record<string, any>>({});

  //  FETCH DATA MASSAL DARI BACKEND
  const { data: legerData, isLoading, isFetching } = useQuery({
    queryKey: ["class-leger", id],
    queryFn: () => reportService.getClassLeger(id),
    enabled: !!id,
  });

  //  SINKRONISASI STATE LOKAL DENGAN DATA BACKEND
  useEffect(() => {
    if (legerData?.students) {
      const initialReports: Record<string, any> = {};
      legerData.students.forEach((s: any) => {
        initialReports[s.student_id] = {
          sick: s.attendance?.sick || 0,
          permission: s.attendance?.permission || 0,
          absent: s.attendance?.absent || 0,
          note: s.attendance?.note || "",
          is_promoted: s.attendance?.is_promoted ?? true,
        };
      });
      setLocalReports(initialReports);
    }
  }, [legerData]);

  //  MUTASI AUTO-SAVE (Berjalan di latar belakang)
  const saveMutation = useMutation({
    mutationFn: (payload: any) => reportService.inputReport(payload),
    onSuccess: () => {
      // Kita invalidate secara senyap, tidak perlu memunculkan toast sukses
      // agar layar guru tidak dipenuhi notifikasi saat auto-save berjalan
      queryClient.invalidateQueries({ queryKey: ["class-leger", id] });
    },
    onError: () => toast.error("Gagal menyimpan perubahan. Cek koneksi Anda."),
  });

  // --- PEMROSESAN DATA (SEARCH & PAGINATION) ---
  const filteredStudents = useMemo(() => {
    if (!legerData?.students) return [];
    return legerData.students.filter((s: any) =>
      s.student_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.username.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [legerData, debouncedSearch]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // Reset ke halaman 1 jika sedang mencari
  useEffect(() => { setPage(1); }, [debouncedSearch, limit]);

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredStudents.slice(start, start + limit);
  }, [filteredStudents, page, limit]);

  // --- HANDLERS ---

  // 1. Menangani ketikan user di tabel (Update state lokal saja, sangat cepat)
  const handleLocalChange = useCallback((studentId: string, field: string, value: any) => {
    setLocalReports((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  }, []);

  // 2. Menembak API ketika user memindahkan kursor (onBlur) atau menekan Enter
  const handleSaveRow = useCallback((studentId: string) => {
    const report = localReports[studentId];
    if (!report) return;

    saveMutation.mutate({
      student_id: studentId,
      class_id: id,
      sick: Number(report.sick),
      permission: Number(report.permission),
      absent: Number(report.absent),
      note: report.note,
      is_promoted: report.is_promoted,
    });
  }, [localReports, id, saveMutation]);

  // 3. Ekspor PDF
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Leger_Kelas_${legerData?.class_info?.name || "Laporan"}`,
  });

  return {
    isMounted,
    refs: { printRef },
    data: {
      classInfo: legerData?.class_info,
      subjectList: legerData?.subject_list || [],
      students: paginatedStudents,
      totalItems,
      totalPages,
      isLoading,
      isFetching,
    },
    state: {
      search, setSearch,
      page, setPage,
      limit, setLimit,
      localReports,
    },
    handlers: {
      handleLocalChange,
      handleSaveRow,
      handlePrint,
    },
  };
}