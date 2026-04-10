// LOKASI: src/components/pages/results/exams/useExamResultController.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { examService } from "@/services/exam.service";
import { toast } from "sonner";

// --- CUSTOM HOOKS ---
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// --- CONTROLLER UTAMA ---
export function useExamResultController() {
  const { id: sessionId } = useParams() as { id: string };
  const router = useRouter();
  
  // 1. MOUNT STATE
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // 2. PAGINATION & FILTER STATE
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterGender, setFilterGender] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");

  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  
  // 3. EXPORT STATE
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBeritaAcara, setIsExportingBeritaAcara] = useState(false);

  // Reset halaman ke 1 setiap kali filter berubah
  useEffect(() => { 
    setPage(1); 
  }, [debouncedSearch, filterStatus, filterClass, filterGender, filterSubject, limit]);

  // 4. DATA FETCHING (React Query)
  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ["exam-session-detail", sessionId],
    queryFn: () => examService.getSessionDetail(sessionId),
    enabled: isMounted && !!sessionId,
  });

  const { data: rawResults, isLoading: loadingResults, isFetching } = useQuery({
    queryKey: ["exam-results", sessionId],
    queryFn: () => examService.getExamResults(sessionId),
    enabled: isMounted && !!sessionId,
    refetchInterval: 30000, 
  });

  // 5. DATA PROCESSING & MEMOIZATION
  const results = Array.isArray(rawResults) ? rawResults : [];
  
  const uniqueClasses = useMemo(() => 
    Array.from(new Set(results.map(r => r.student?.profile?.class?.name).filter(Boolean))).sort(), 
  [results]);
  
  const uniqueGenders = useMemo(() => 
    Array.from(new Set(results.map(r => r.student?.profile?.gender).filter(Boolean))).sort(), 
  [results]);
  
  const uniqueSubjects = useMemo(() => 
    Array.from(new Set(results.map(r => r.subject_name || r.subject?.name).filter(Boolean))).sort(), 
  [results]);

  const filteredResults = useMemo(() => {
    return results.filter((item: any) => {
      // Pencarian Text
      const matchSearch = 
        item.student_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        item.student_username?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Filter Status
      const matchStatus = filterStatus === "ALL" 
        ? true 
        : filterStatus === "DONE" 
          ? item.exam_status !== "BELUM UJIAN" 
          : item.exam_status === filterStatus;
      
      // Filter Atribut Lainnya
      const matchClass = filterClass === "ALL" ? true : item.student?.profile?.class?.name === filterClass;
      const matchGender = filterGender === "ALL" ? true : item.student?.profile?.gender === filterGender;
      const matchSubject = filterSubject === "ALL" ? true : (item.subject_name || item.subject?.name) === filterSubject;
      
      return matchSearch && matchStatus && matchClass && matchGender && matchSubject;
    });
  }, [results, debouncedSearch, filterStatus, filterClass, filterGender, filterSubject]);

  const paginatedResults = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredResults.slice(start, start + limit);
  }, [filteredResults, page, limit]);

  const totalItems = filteredResults.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // Analitik & Statistik Kartu Atas
  const stats = useMemo(() => {
    const doneExams = filteredResults.filter((r) => r.exam_status !== "BELUM UJIAN" && r.exam_status !== "WORKING");
    
    if (doneExams.length === 0) {
      return { max: 0, min: 0, avg: 0, done: 0, total: filteredResults.length };
    }
    
    const scores = doneExams.map((r) => r.final_score || 0);
    return { 
      max: Math.max(...scores), 
      min: Math.min(...scores), 
      avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1), 
      done: doneExams.length, 
      total: filteredResults.length 
    };
  }, [filteredResults]);

  // 6. ACTION HANDLERS
  const handleBack = useCallback(() => {
    router.push("/dashboard/results?tab=ujian");
  }, [router]);

  const handleExportExcel = useCallback(async () => {
    if (isExportingExcel) return;
    
    try {
      setIsExportingExcel(true); 
      toast.loading("Mempersiapkan Excel...", { id: "export-excel" });
      
      await examService.downloadExamResultsExcel(sessionId);
      
      toast.success("Excel berhasil diunduh!", { id: "export-excel" });
    } catch (error) { 
      toast.error("Gagal mengunduh Excel.", { id: "export-excel" }); 
    } finally { 
      setIsExportingExcel(false); 
    }
  }, [sessionId, isExportingExcel]);

  const handleExportPdf = useCallback(async () => {
    if (isExportingPdf) return;
    
    try {
      setIsExportingPdf(true); 
      toast.loading("Mempersiapkan PDF...", { id: "export-pdf" });
      
      await examService.downloadExamResultsPDF(sessionId);
      
      toast.success("PDF berhasil diunduh!", { id: "export-pdf" });
    } catch (error) { 
      toast.error("Gagal mengunduh PDF.", { id: "export-pdf" }); 
    } finally { 
      setIsExportingPdf(false); 
    }
  }, [sessionId, isExportingPdf]);

  const handleExportBeritaAcara = useCallback(async () => {
    if (isExportingBeritaAcara) return;
    
    try {
      setIsExportingBeritaAcara(true); 
      toast.loading("Menyusun Berita Acara...", { id: "export-ba" });
      
      await examService.downloadBeritaAcaraPDF(sessionId); 
      
      toast.success("Berita Acara berhasil diunduh!", { id: "export-ba" });
    } catch (error) { 
      toast.error("Gagal mengunduh Berita Acara.", { id: "export-ba" }); 
    } finally { 
      setIsExportingBeritaAcara(false); 
    }
  }, [sessionId, isExportingBeritaAcara]);

  // 7. RETURN VALUE UNTUK VIEW
  return {
    isMounted,
    state: { 
      page, setPage, 
      limit, setLimit, 
      search, setSearch, 
      filterStatus, setFilterStatus, 
      filterClass, setFilterClass, 
      filterGender, setFilterGender, 
      filterSubject, setFilterSubject 
    },
    modals: { 
      selectedParticipant, setSelectedParticipant 
    },
    data: { 
      sessionData, 
      paginatedResults, 
      totalItems, 
      totalPages, 
      stats, 
      uniqueClasses, 
      uniqueGenders, 
      uniqueSubjects, 
      isLoading: loadingSession || loadingResults, 
      isFetching 
    },
    exportState: { 
      isExportingExcel, 
      isExportingPdf, 
      isExportingBeritaAcara 
    },
    handlers: { 
      handleBack, 
      handleExportExcel, 
      handleExportPdf, 
      handleExportBeritaAcara 
    }
  };
}