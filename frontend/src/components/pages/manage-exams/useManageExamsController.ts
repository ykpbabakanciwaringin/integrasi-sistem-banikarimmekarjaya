// LOKASI: src/app/dashboard/manage-exams/useManageExamsController.ts
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examService } from "@/services/exam.service";
import { institutionService } from "@/services/institution.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";
import { ExamEvent } from "@/types/exam";

// Helper Debounce (Mencegah request API beruntun saat mengetik pencarian)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useManageExamsController() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userRole = user?.role || "";
  const userInstId = user?.enrollments?.[0]?.institution_id || (user as any)?.institution_id || "";

  // --- 1. STATE FILTER & PAGINASI ---
  const [activeTab, setActiveTab] = useState("ALL"); 
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); 
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [filterInstId, setFilterInstId] = useState(isSuperAdmin ? "ALL" : userInstId);

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, filterInstId, limit]);

  // --- 2. STATE MODAL & UI ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExamEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [downloadingSEBId, setDownloadingSEBId] = useState<string | null>(null);

  // --- 3. FETCHING DATA DENGAN SMART POLLING ---
  const { data: eventsData, isLoading, isFetching } = useQuery({
    queryKey: ["exam_events", { page, limit, debouncedSearch, filterInstId, activeTab }],
    queryFn: () => {
      const params: any = { page, limit, search: debouncedSearch };
      if (filterInstId !== "ALL") params.institution_id = filterInstId;
      if (activeTab !== "ALL") params.is_active = activeTab === "true";
      return examService.getEvents(params);
    },
    // [PENYEMPURNAAN KINERJA]: Auto-refresh berhenti sementara saat admin membuka Form Dialog 
    // agar ketikan tidak berkedip dan server tidak kelebihan beban.
    refetchInterval: isFormOpen ? false : 15000, 
    enabled: isMounted,
  });

  const { data: instData } = useQuery({
    queryKey: ["institutions_list"],
    queryFn: () => institutionService.getAllPaginated({ limit: 100 }),
    enabled: isSuperAdmin && isMounted,
  });

  const institutions = instData?.data || instData || [];
  const events = eventsData?.data || [];
  const totalItems = eventsData?.total || 0;
  const totalPages = eventsData?.total_pages || Math.ceil(totalItems / limit) || 1;

  // --- 4. MUTASI (AKSI) ---
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      if (!isSuperAdmin) payload.institution_id = userInstId;

      if (isEditMode && selectedEvent) return examService.updateEvent(selectedEvent.id, payload);
      return examService.createEvent(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exam_events"] });
      handleCloseForm();
      toast.success(isEditMode ? "Data kegiatan ujian diperbarui" : "Kegiatan ujian baru berhasil dibuat");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menyimpan kegiatan ujian"),
  });

  const deleteMutation = useMutation({
    mutationFn: examService.deleteEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exam_events"] });
      setDeleteId(null);
      toast.success("Kegiatan ujian berhasil dihapus permanen");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menghapus kegiatan ujian")
  });

  // --- 5. HANDLERS ---
  const handleAddClick = useCallback(() => {
    if (userRole === "TEACHER") return;
    setIsEditMode(false);
    setSelectedEvent(null);
    setIsFormOpen(true);
  }, [userRole]);

  const handleEditClick = useCallback((item: ExamEvent) => {
    if (userRole === "TEACHER") return;
    setSelectedEvent(item);
    setIsEditMode(true);
    setIsFormOpen(true);
  }, [userRole]);

  const handleDeleteClick = useCallback((id: string) => {
    if (userRole === "TEACHER") return;
    setDeleteId(id);
  }, [userRole]);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setTimeout(() => {
      setIsEditMode(false);
      setSelectedEvent(null);
    }, 300); // Memberi waktu animasi modal menutup sebelum state dikosongkan
  }, []);

  const handleDownloadSEB = useCallback(async (eventId: string) => {
    try {
      setDownloadingSEBId(eventId);
      await examService.downloadSEBConfig(eventId);
      toast.success("File konfigurasi SEB berhasil diunduh");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh file SEB");
    } finally {
      setDownloadingSEBId(null);
    }
  }, []);

  // Mencegah skeleton loading berkedip jika data sebenarnya sedang di-fetch ulang di background
  const isTransitioning = isFetching && events.length === 0;

  return {
    isMounted,
    auth: { isSuperAdmin, userRole, userInstId },
    state: { activeTab, setActiveTab, page, setPage, limit, setLimit, search, setSearch, filterInstId, setFilterInstId },
    modals: { isFormOpen, setIsFormOpen, isEditMode, selectedEvent, deleteId, setDeleteId, downloadingSEBId },
    data: { events, institutions, totalItems, totalPages, isLoading: isLoading || isTransitioning, isFetching },
    mutations: { saveMutation, deleteMutation },
    handlers: { handleAddClick, handleEditClick, handleDeleteClick, handleCloseForm, handleDownloadSEB }
  };
}