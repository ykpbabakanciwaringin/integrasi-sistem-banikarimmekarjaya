// LOKASI: src/components/pages/results/subjects/useSubjectResultController.ts
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
//  HAPUS: useReactToPrint tidak lagi digunakan
import { subjectService } from "@/services/subject.service";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// --- CUSTOM HOOK DEBOUNCE (Mencegah lag saat mengetik pencarian) ---
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useSubjectResultController() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // --- STATE EKSPOR DOKUMEN ---
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // --- STATE FILTER & PAGINASI TABEL ---
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Reset halaman saat filter berubah
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, limit]);

  // --- STATE DIALOG KKM ---
  const [isKKMDialogOpen, setIsKKMDialogOpen] = useState(false);
  const [tempKKM, setTempKKM] = useState<number>(0);

  // --- DATA FETCHING DARI GOLANG API ---
  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["assignment-detail", id],
    queryFn: () => subjectService.getAssignmentDetail(id),
    enabled: isMounted && !!id,
  });

  const { data: rawGrades, isLoading: loadingGrades, isFetching: fetchingGrades } = useQuery({
    queryKey: ["assignment-grades", id],
    queryFn: () => subjectService.getAssignmentGrades(id),
    enabled: isMounted && !!id,
  });

  // Sinkronisasi nilai KKM dari API ke state form lokal
  useEffect(() => {
    if (detail?.kkm !== undefined) {
      setTempKKM(detail.kkm);
    }
  }, [detail]);

  const grades = Array.isArray(rawGrades) ? rawGrades : [];
  const kkm = detail?.kkm || 75;

  // --- MUTASI: UPDATE KKM ---
  const updateKKMMutation = useMutation({
    mutationFn: (newKKM: number) => subjectService.updateKKM(id, newKKM),
    onSuccess: () => {
      toast.success("Standard KKM berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["assignment-detail", id] });
      setIsKKMDialogOpen(false);
    },
    onError: () => toast.error("Gagal memperbarui KKM. Silakan coba lagi."),
  });

  // --- PEMROSESAN DATA (Pencarian, Filter, Pengurutan) ---
  const processedData = useMemo(() => {
    const filtered = grades.filter((item: any) => {
      const matchesSearch =
        item.student_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.student_username?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesStatus =
        statusFilter === "ALL" ? true :
        statusFilter === "DONE" ? item.exam_status !== "BELUM UJIAN" :
        item.exam_status === "BELUM UJIAN";
      
      return matchesSearch && matchesStatus;
    });
    // Urutkan berdasarkan nama (A-Z)
    return filtered.sort((a: any, b: any) => a.student_name.localeCompare(b.student_name));
  }, [grades, debouncedSearch, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return processedData.slice(start, start + limit);
  }, [processedData, page, limit]);

  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // --- ANALITIK STATISTIK KARTU ---
  const stats = useMemo(() => {
    if (grades.length === 0) return { max: 0, min: 0, avg: 0, pass: 0, fail: 0 };
    const doneExams = grades.filter((g) => g.exam_status !== "BELUM UJIAN");
    if (doneExams.length === 0) return { max: 0, min: 0, avg: 0, pass: 0, fail: 0 };
    
    const scores = doneExams.map((g) => g.final_score);
    return {
      max: Math.max(...scores),
      min: Math.min(...scores),
      avg: (scores.reduce((a, b) => a + b, 0) / doneExams.length).toFixed(1),
      pass: doneExams.filter((g) => g.final_score >= kkm).length,
      fail: doneExams.filter((g) => g.final_score < kkm).length,
    };
  }, [grades, kkm]);

  // --- HANDLERS (Aksi Tombol) ---
  const handleBack = useCallback(() => router.push("/dashboard/results?tab=mapel"), [router]);

  //  SIMPLIFIKASI EXPORT EXCEL
  const handleExportExcel = useCallback(async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    const tid = toast.loading("Menyiapkan dokumen Excel...");
    try {
      // Sekarang langsung memanggil service yang sudah menggunakan downloadBlob
      await subjectService.downloadRekap(id);
      toast.success("Excel Berhasil Diunduh", { id: tid });
    } catch (err) {
      toast.error("Gagal mengunduh Excel.", { id: tid });
    } finally {
      setIsExportingExcel(false);
    }
  }, [id, isExportingExcel]);

  //  FIX TOTAL: handlePrint Sekarang Mengambil PDF Resmi dari Backend
  const handlePrint = useCallback(async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    const tid = toast.loading("Menyiapkan dokumen PDF resmi...");
    try {
      // Memanggil fungsi baru di service untuk mengambil PDF dari Backend
      await subjectService.downloadRekapPDF(id, detail?.subject_name || 'Mapel');
      toast.success("Dokumen PDF berhasil diunduh!", { id: tid });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh PDF resmi.", { id: tid });
    } finally {
      setIsExportingPdf(false);
    }
  }, [id, detail, isExportingPdf]);

  const todayStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale });

  return {
    isMounted,
    refs: { printRef },
    
    tableState: {
      search, setSearch,
      statusFilter, setStatusFilter,
      page, setPage,
      limit, setLimit
    },
    
    kkmState: {
      isKKMDialogOpen, setIsKKMDialogOpen,
      tempKKM, setTempKKM,
      updateKKMMutation
    },
    
    data: { 
      id, detail, kkm, grades,
      paginatedData, totalItems, totalPages,
      stats, todayStr, 
      isLoading: loadingDetail || loadingGrades,
      isFetching: fetchingGrades
    },
    
    exportState: { isExportingExcel, isExportingPdf },
    handlers: { handleBack, handleExportExcel, handlePrint }
  };
}