// LOKASI: src/app/dashboard/manage-exams/[eventId]/monitor/[sessionId]/useMonitorController.ts
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { examService } from "@/services/exam.service";

// Helper Debounce untuk pencarian
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useMonitorController(sessionId: string) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const queryClient = useQueryClient();

  // --- 1. STATE FILTER & PAGINASI ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Reset halaman jika filter berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus, limit]);

  // --- 2. STATE MODAL & DIALOG ---
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
  const [actionState, setActionState] = useState<{
    isOpen: boolean;
    type: "RESET" | "BLOCK" | "FINISH" | null;
    participant: any | null;
  }>({ isOpen: false, type: null, participant: null });

  const [galleryState, setGalleryState] = useState<{ isOpen: boolean; participant: any | null }>({
    isOpen: false,
    participant: null
  });

  const closeActionModal = useCallback(() => {
    setActionState({ isOpen: false, type: null, participant: null });
  }, []);

  // --- 3. FETCHING DATA (Polling 10 Detik) ---
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["exam-session", sessionId],
    queryFn: () => examService.getSessionDetail(sessionId),
    enabled: !!sessionId && isMounted,
    refetchInterval: 10000,
  });

  const { data: participantsData, isLoading: participantsLoading, isFetching: participantsFetching } = useQuery({
    queryKey: ["monitor-participants", sessionId, page, limit, debouncedSearch, filterStatus],
    queryFn: () => examService.getSessionParticipants(sessionId, {
      page,
      limit,
      search: debouncedSearch,
      status: filterStatus === "ALL" ? undefined : filterStatus,
    }),
    refetchInterval: 10000,
    enabled: !!sessionId && isMounted,
  });

  // --- 4. MUTASI (AKSI) ---
  const toggleSessionMutation = useMutation({
    mutationFn: () => {
      if (sessionData?.is_active) return examService.stopSession(sessionId);
      return examService.resumeSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["monitor-participants", sessionId] });
      toast.success(sessionData?.is_active ? "Akses ujian dijeda secara darurat!" : "Ujian dilanjutkan kembali!");
      setIsToggleDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Gagal mengubah status ujian"),
  });

  const resetMutation = useMutation({
    mutationFn: (studentId: string) => examService.resetStudentLogin(sessionId, studentId),
    onSuccess: () => {
      toast.success("Login siswa berhasil di-reset. Siswa bisa login kembali.");
      queryClient.invalidateQueries({ queryKey: ["monitor-participants"] });
      closeActionModal();
    },
    onError: (err: any) => toast.error(err.message || "Gagal mereset login"),
  });

  const toggleBlockMutation = useMutation({
    mutationFn: (studentId: string) => examService.toggleBlockStudent(sessionId, studentId),
    onSuccess: () => {
      const isCurrentlyBlocked = actionState.participant?.status === "BLOCKED";
      toast.success(isCurrentlyBlocked ? "Blokir dibuka!" : "Siswa berhasil diblokir!");
      queryClient.invalidateQueries({ queryKey: ["monitor-participants"] });
      closeActionModal();
    },
    onError: (err: any) => toast.error(err.message || "Gagal mengubah status blokir"),
  });

  const forceFinishMutation = useMutation({
    mutationFn: (studentId: string) => examService.forceFinishStudent(sessionId, studentId),
    onSuccess: () => {
      toast.success("Ujian siswa berhasil diakhiri paksa.");
      queryClient.invalidateQueries({ queryKey: ["monitor-participants"] });
      closeActionModal();
    },
    onError: (err: any) => toast.error(err.message || "Gagal mengakhiri ujian"),
  });

  return {
    isMounted,
    state: { page, setPage, limit, setLimit, search, setSearch, filterStatus, setFilterStatus },
    modals: { isToggleDialogOpen, setIsToggleDialogOpen, actionState, setActionState, closeActionModal, galleryState, setGalleryState },
    data: { 
      sessionData, sessionLoading, 
      participants: participantsData?.data || [], 
      totalItems: participantsData?.total || 0, 
      totalPages: participantsData?.total_pages || 1, 
      participantsLoading, participantsFetching 
    },
    mutations: { toggleSessionMutation, resetMutation, toggleBlockMutation, forceFinishMutation }
  };
}