// LOKASI: src/components/pages/manage-exams/[eventId]/useExamSessionController.ts
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Stores & Services
import { useAuthStore } from "@/stores/use-auth-store";
import { examService } from "@/services/exam.service";
import { subjectService } from "@/services/subject.service";
import { teacherService } from "@/services/teacher.service";
import { apiClient } from "@/lib/axios";

// Custom Hooks
import { useParticipantPrint } from "./use-participant-print";

// =======================================================================
// UTILITY HOOK: DEBOUNCE
// =======================================================================
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// =======================================================================
// MAIN CONTROLLER HOOK
// =======================================================================
export function useExamSessionController() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const eventId = params.eventId as string;
  const { user } = useAuthStore();
  const role = user?.role || "";

  // =======================================================================
  // 1. STATE MANAGEMENT TAB UTAMA & URL SYNC
  // =======================================================================
  const [mainTab, setMainTab] = useState("sessions"); // "sessions" | "participants"

  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [limit, setLimit] = useState(parseInt(searchParams.get("limit") || "25", 10));
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "ALL");
  const [filterSubject, setFilterSubject] = useState(searchParams.get("subject") || "ALL");
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const debouncedSearch = useDebounce(search, 500);

  // Sync state ke URL parameter agar filter bisa di-share atau direfresh
  const updateQueryParams = useCallback((newParams: Record<string, string | number>) => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    const beforeStr = currentParams.toString();

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === "" || value === "ALL") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(value));
      }
    });

    const afterStr = currentParams.toString();

    if (beforeStr !== afterStr) {
      router.push(`${pathname}?${afterStr}`, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (!isMounted) return;
    updateQueryParams({
      search: debouncedSearch,
      status: activeTab,
      subject: filterSubject,
      page,
      limit,
    });
  }, [debouncedSearch, activeTab, filterSubject, page, limit, isMounted, updateQueryParams]);

  // Reset page ke 1 jika filter berubah
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, activeTab, filterSubject, limit]);

  // =======================================================================
  // 2. STATE MANAJEMEN MODAL & UI
  // =======================================================================
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // STATE BARU: Menyimpan pesan detail error dari file Excel
  const [detailErrors, setDetailErrors] = useState<string[]>([]);

  // Hook Print otomatis "ALL"
  const printHook = useParticipantPrint(["ALL"], () => {});

  // =======================================================================
  // 3. REACT QUERY: FETCHING DATA DENGAN SMART POLLING
  // =======================================================================
  const { data: eventDetail, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["exam-event-detail", eventId],
    queryFn: () => examService.getEventDetail(eventId),
    enabled: isMounted && !!eventId,
  });

  const institutionId = useMemo(() => {
    if (role === "SUPER_ADMIN" && eventDetail?.institution_id) return eventDetail.institution_id;
    return user?.institution_id || eventDetail?.institution_id || "";
  }, [role, eventDetail?.institution_id, user?.institution_id]);

  const institutionName = useMemo(() => {
    return eventDetail?.institution?.name || "Lembaga Pendidikan";
  }, [eventDetail?.institution?.name]);

  const { data: sessionsData, isLoading: isLoadingSessions, isFetching } = useQuery({
    queryKey: ["exam-sessions", eventId, page, limit, debouncedSearch, activeTab, filterSubject],
    queryFn: () => {
      const queryParams: any = { exam_event_id: eventId, page, limit, search: debouncedSearch };
      if (activeTab !== "ALL") queryParams.status = activeTab;
      if (filterSubject !== "ALL") queryParams.subject = filterSubject;
      return examService.getSessions(queryParams);
    },
    enabled: isMounted && !!eventId,
    // [PENYEMPURNAAN KINERJA]: Menghentikan polling saat ada Modal Form terbuka
    refetchInterval: isFormOpen || isImportOpen ? false : 15000,
  });

  // Fetch Peserta Unik di Level Event (Hanya berjalan jika tab Participants aktif)
  const { data: eventParticipantsRaw, isLoading: isLoadingParticipants, refetch: refetchParticipants } = useQuery({
    queryKey: ["event-participants", eventId],
    queryFn: () => examService.downloadEventExamCards(eventId),
    enabled: isMounted && !!eventId && mainTab === "participants",
  });

  // Ekstraksi Array Aman
  let eventParticipants: any[] = [];
  if (Array.isArray(eventParticipantsRaw)) {
    eventParticipants = eventParticipantsRaw;
  } else if (eventParticipantsRaw && Array.isArray((eventParticipantsRaw as any).data)) {
    eventParticipants = (eventParticipantsRaw as any).data;
  }

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects", institutionId],
    queryFn: async () => {
      const res: any = await subjectService.getAllSubjects({ limit: 500, institution_id: institutionId });
      return Array.isArray(res) ? res : res?.data?.data || res?.data || [];
    },
    enabled: isMounted && role !== "TEACHER" && !!institutionId,
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers", institutionId],
    queryFn: async () => {
      const res: any = await teacherService.getAll({ limit: 500, institution_id: institutionId });
      return Array.isArray(res) ? res : res?.data?.data || res?.data || [];
    },
    enabled: isMounted && role !== "TEACHER" && !!institutionId,
  });

  const sessions = sessionsData?.data || [];
  const totalItems = sessionsData?.total || 0;
  const totalPages = sessionsData?.total_pages || 1;
  const subjects = subjectsData || [];
  const teachers = teachersData || [];

  // =======================================================================
  // 4. REACT QUERY: MUTATIONS
  // =======================================================================
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditMode && selectedSession) return examService.updateSession(selectedSession.id, data);
      return examService.createSession(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["exam-event-detail"] });
      toast.success(isEditMode ? "Sesi ujian berhasil diperbarui!" : "Sesi ujian baru berhasil dibuat!");
      handleCloseForm();
    },
    onError: (err: any) => toast.error(err.message || "Gagal menyimpan sesi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => examService.deleteSession(id),
    onSuccess: () => {
      toast.success("Jadwal sesi berhasil dihapus permanen");
      queryClient.invalidateQueries({ queryKey: ["exam-sessions", eventId] });
      queryClient.invalidateQueries({ queryKey: ["exam-event-detail"] });
      setDeleteId(null);
    },
    onError: (error: any) =>
      toast.error("Gagal Menghapus", { description: error?.response?.data?.error || error.message }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (session: any) => {
      if (session.is_active) return examService.stopSession(session.id);
      return examService.resumeSession(session.id);
    },
    onSuccess: (_, variables) => {
      toast.success("Status Sesi Berubah", {
        description: variables.is_active ? "Sesi dihentikan (Non-Aktif)" : "Sesi diaktifkan kembali",
      });
      queryClient.invalidateQueries({ queryKey: ["exam-sessions", eventId] });
    },
    onError: (error: any) =>
      toast.error("Gagal mengubah status", { description: error?.response?.data?.error || error.message }),
  });

  // [PERBAIKAN]: Menangkap dan Meneruskan Detail Error Excel
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      if (role === "SUPER_ADMIN" && institutionId) {
        formData.append("institution_id", institutionId);
      }
      const res = await apiClient.post(`/exams/events/${eventId}/sessions/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onMutate: () => {
      // Bersihkan error lama sebelum mulai mengunggah file baru
      setDetailErrors([]); 
    },
    onSuccess: (data: any) => {
      toast.success("Import Berhasil", { description: `${data.count} Jadwal berhasil ditambahkan` });
      queryClient.invalidateQueries({ queryKey: ["exam-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["exam-event-detail"] });
      setDetailErrors([]);
      setIsImportOpen(false);
    },
    onError: (error: any) => {
      const errData = error?.response?.data;
      const mainError = errData?.message || errData?.error || error.message || "Gagal mengimpor file";
      
      // Mendukung response 'detail_errors' (backend baru) atau 'errors' (backend lama)
      const specificErrors = errData?.detail_errors || errData?.errors;

      if (specificErrors && Array.isArray(specificErrors) && specificErrors.length > 0) {
        // Jika ada detail error per baris, simpan ke state untuk UI Modal
        setDetailErrors(specificErrors);
        toast.error("Gagal memproses file", { 
          description: "Silakan periksa detail peringatan pada form impor." 
        });
        // PENTING: Jangan tutup modal (setIsImportOpen) agar user bisa membaca error-nya
      } else {
        // Jika error umum (misal: server down, template salah total)
        toast.error("Gagal Import Jadwal", { description: mainError });
        setIsImportOpen(false); // Aman untuk ditutup karena tidak ada detail
      }
    },
  });

  // =======================================================================
  // 5. HANDLERS
  // =======================================================================
  const handleAddClick = useCallback(() => {
    if (role === "TEACHER") return;
    setSelectedSession(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  }, [role]);

  const handleEditClick = useCallback(
    (sessionData: any) => {
      if (role === "TEACHER") return;
      setSelectedSession(sessionData);
      setIsEditMode(true);
      setIsFormOpen(true);
    },
    [role]
  );

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setTimeout(() => {
      setSelectedSession(null);
      setIsEditMode(false);
    }, 300);
  }, []);

  const handleDownloadTemplate = async () => {
    const toastId = toast.loading("Meracik template jadwal dinamis, mohon tunggu...");
    try {
      await examService.downloadSessionTemplate(institutionId as string, eventId);
      toast.success("Template jadwal berhasil diunduh!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh template", { id: toastId });
    }
  };

  const handleExportData = async (type: "excel" | "pdf") => {
    try {
      const toastId = toast.loading(`Mempersiapkan file ${type.toUpperCase()}...`);
      const res = await apiClient.get(`/exams/events/${eventId}/sessions/export/${type}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Data_Jadwal_Sesi_${eventId.substring(0, 5)}.${type === "excel" ? "xlsx" : "pdf"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.dismiss(toastId);
      toast.success(`Berhasil mengunduh ${type.toUpperCase()}`);
    } catch (error) {
      toast.error(`Gagal mengunduh data ${type.toUpperCase()}`);
    }
  };

  const handlePrintCards = useCallback(
    (mode: "a4" | "single") => {
      printHook.startPrintProcess(eventId, mode, "event");
    },
    [eventId, printHook]
  );

  return {
    isMounted,
    auth: { role, institutionId, institutionName },

    state: {
      mainTab, setMainTab,
      page, setPage, limit, setLimit,
      search, setSearch, activeTab, setActiveTab,
      filterSubject, setFilterSubject,
    },

    modals: {
      isFormOpen, setIsFormOpen,
      isImportOpen, setIsImportOpen,
      selectedSession, setSelectedSession,
      isEditMode,
      deleteId, setDeleteId,
      // Ekspos state detail error ke komponen UI
      detailErrors, setDetailErrors,
    },

    data: {
      eventId, eventDetail, isLoadingEvent,
      sessions, totalItems, totalPages,
      isLoadingSessions: isLoadingSessions || isFetching,
      subjects, teachers,
      eventParticipants, isLoadingParticipants, refetchParticipants,
    },

    mutations: { saveMutation, deleteMutation, toggleStatusMutation, importMutation },

    handlers: {
      handleAddClick, handleEditClick, handleCloseForm,
      handleDownloadTemplate, handleExportData, handlePrintCards,
    },

    print: printHook,
  };
}