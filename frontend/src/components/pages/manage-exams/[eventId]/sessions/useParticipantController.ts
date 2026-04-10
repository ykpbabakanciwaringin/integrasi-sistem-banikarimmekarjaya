// LOKASI: src/components/pages/manage-exams/[eventId]/sessions/useParticipantController.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";

import { examService } from "@/services/exam.service";
import { classService } from "@/services/class.service";
import { questionService } from "@/services/question.service";
import { useParticipantPrint } from "@/components/pages/manage-exams/[eventId]/sessions/use-participant-print";

// --- HELPER DEBOUNCE ---
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useParticipantController() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const { user } = useAuthStore();
  const userRole = user?.role || "";
  const isTeacher = userRole === "TEACHER";

  const eventId = params.eventId as string;
  const sessionId = params.sessionId as string;

  // ============================================================================
  // 1. MANAJEMEN STATE FILTER & PAGINASI (URL SYNC)
  // ============================================================================
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const filterStatus = searchParams.get("status") || "ALL";
  const filterGender = searchParams.get("gender") || "ALL";
  const filterClassId = searchParams.get("class_id") || "ALL";
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 500);

  const updateQueryParams = useCallback((newParams: Record<string, string | number>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === "" || value === "ALL") current.delete(key);
      else current.set(key, String(value));
    });
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete("search");
    current.delete("status");
    current.delete("gender");
    current.delete("class_id");
    current.set("page", "1");
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!isMounted) return;
    const currentUrlSearch = searchParams.get("search") || "";
    if (debouncedSearch !== currentUrlSearch) {
      updateQueryParams({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, isMounted, searchParams, updateQueryParams]);

  // ============================================================================
  // 2. MANAJEMEN STATE MODAL (UI) & SELECTION
  // ============================================================================
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false); 
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false); 
  const [isBulkGenerateOpen, setIsBulkGenerateOpen] = useState(false); 
  
  const [editingData, setEditingData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null); 
  const [resetId, setResetId] = useState<string | null>(null);
  const [generatePassId, setGeneratePassId] = useState<string | null>(null); 
  const [detailData, setDetailData] = useState<any>(null); 
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Logika pengecekan apakah ada modal yang sedang terbuka
  const isAnyModalOpen = isAddOpen || isImportOpen || isPrintModalOpen || 
    isPhotoDialogOpen || isBulkGenerateOpen || !!editingData || 
    !!deleteId || !!resetId || !!generatePassId || !!detailData;

  // ============================================================================
  // 3. HOOK PENCETAKAN KARTU
  // ============================================================================
  const printHook = useParticipantPrint(
    selectedIds, 
    () => { setSelectedIds([]); setIsPrintModalOpen(false); }
  );

  // ============================================================================
  // 4. FETCHING DATA (React Query)
  // ============================================================================
  const { data: sessionRes, isLoading: isSessionLoading } = useQuery({ 
    queryKey: ["session-detail", sessionId], 
    queryFn: () => examService.getSessionDetail(sessionId), 
    enabled: isMounted && !!sessionId 
  });
  const sessionDetail = sessionRes?.data || sessionRes;
  const institutionId = sessionDetail?.institution_id || user?.institution_id || "";

  const { data: participantsRes, isLoading: isParticipantsLoading, isFetching } = useQuery({
    queryKey: ["session-participants", sessionId, page, limit, debouncedSearch, filterStatus, filterGender, filterClassId],
    queryFn: () => {
      const queryParams: any = { page, limit, search: debouncedSearch };
      if (filterStatus !== "ALL") queryParams.status = filterStatus;
      if (filterGender !== "ALL") queryParams.gender = filterGender;
      if (filterClassId !== "ALL") queryParams.class_id = filterClassId;
      return examService.getSessionParticipants(sessionId, queryParams);
    },
    // [PENYEMPURNAAN KINERJA]: Smart Polling (Berhenti saat modal terbuka)
    refetchInterval: isAnyModalOpen ? false : 20000,
    enabled: isMounted && !!sessionId,
  });

  const { data: classes = [] } = useQuery({ 
    queryKey: ["classes-list", institutionId], 
    queryFn: async () => { 
      const res: any = await classService.getAll({ limit: 500, institution_id: institutionId }); 
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []); 
    }, 
    enabled: isMounted && !!institutionId 
  });
  
  const { data: questionBanks = [] } = useQuery({ 
    queryKey: ["question-banks-list", institutionId], 
    queryFn: async () => { 
      const res: any = await questionService.getAll({ limit: 500, institution_id: institutionId }); 
      return Array.isArray(res) ? res : (res?.data?.data || res?.data || []); 
    }, 
    enabled: isMounted && !!institutionId 
  });

  const participants = participantsRes?.data || [];
  const totalItems = participantsRes?.total || 0;
  const totalPages = participantsRes?.total_pages || 1;
  const isTransitioning = isFetching && (!participantsRes?.data || participantsRes?.data?.length === 0);

  // ============================================================================
  // 5. MUTASI DATA
  // ============================================================================
  const addBulkMutation = useMutation({ 
    // [PERBAIKAN FASE MULTI-MAPEL]: Menggunakan qbankIds sebagai Array
    mutationFn: (data: { studentIds: string[], qbankIds: string[] }) => 
      examService.addBulkParticipants(sessionId, data.studentIds, data.qbankIds), 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["session-participants"] }); 
      queryClient.invalidateQueries({ queryKey: ["session-detail"] }); 
      toast.success("Peserta berhasil ditambahkan ke dalam sesi ujian."); 
      setIsAddOpen(false); 
    }
  });
  
  const importMutation = useMutation({ 
    mutationFn: (file: File) => examService.importParticipants(sessionId, file), 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["session-participants"] }); 
      queryClient.invalidateQueries({ queryKey: ["session-detail"] }); 
      toast.success("Data peserta berhasil diimpor!"); 
      setIsImportOpen(false); 
    }
  });
  
  const bulkUploadPhotoMutation = useMutation({ 
    mutationFn: (file: File) => examService.bulkUploadPhotos(file), 
    onSuccess: (res: any) => { 
      toast.success(`Berhasil mengunggah ${res?.data?.count || 'beberapa'} foto siswa`); 
      queryClient.invalidateQueries({ queryKey: ["session-participants"] }); 
      setIsPhotoDialogOpen(false); 
    }, 
    onError: (err: any) => toast.error(err.message || "Gagal mengunggah foto massal")
  });

  const editMutation = useMutation({ 
    mutationFn: (payload: any) => examService.updateParticipant(sessionId, editingData.student_id, payload), 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["session-participants"] }); 
      toast.success("Data peserta berhasil diperbarui."); 
      setEditingData(null); 
    }
  });
  
  const deleteMutation = useMutation({ 
    mutationFn: (id: string) => examService.removeParticipantWithSession(sessionId, id), 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["session-participants"] }); 
      queryClient.invalidateQueries({ queryKey: ["session-detail"] }); 
      toast.success("Peserta telah dikeluarkan dari sesi."); 
      setDeleteId(null); 
    }
  });
  
  const resetPasswordMutation = useMutation({ 
    mutationFn: (id: string) => examService.resetStudentLogin(sessionId, id), 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["session-participants"] }); 
      toast.success("Sesi login perangkat siswa berhasil direset."); 
      setResetId(null); 
    }
  });
  
  const bulkGeneratePassMutation = useMutation({ 
    mutationFn: (ids: string[]) => examService.generateBulkStudentPassword(sessionId, ids), 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["session-participants"] }); 
      toast.success(`${selectedIds.length} sandi baru berhasil dibuat secara massal!`); 
      setIsBulkGenerateOpen(false); 
      setSelectedIds([]); 
    }, 
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal membuat sandi massal")
  });

  // ============================================================================
  // 6. HANDLERS
  // ============================================================================

  const handleDownloadTemplate = async () => {
    const toastId = toast.loading("Meracik format Excel, mohon tunggu...");
    try {
      await examService.downloadParticipantTemplate(sessionId as string);
      toast.success("Format berhasil diunduh! Silakan periksa folder Download Anda.", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh format Excel", { id: toastId });
    }
  };
  
  const handleDownloadPhotoReference = async () => { 
    try { 
      await examService.downloadPhotoReference(sessionId); 
      toast.success("Dokumen acuan penamaan foto berhasil diunduh."); 
    } catch (err: any) { 
      toast.error(err.message || "Gagal mengunduh dokumen acuan."); 
    } 
  };
  
  const handleSelectAll = (checked: boolean) => { 
    if (checked && participantsRes?.data) { 
      setSelectedIds(participantsRes.data.map((p: any) => p.student_id)); 
    } else { 
      setSelectedIds([]); 
    } 
  };
  
  const handleSelect = (id: string, checked: boolean) => { 
    if (checked) { 
      setSelectedIds(prev => [...prev, id]); 
    } else { 
      setSelectedIds(prev => prev.filter(item => item !== id)); 
    } 
  };

  const executePrint = (mode: "single" | "a4") => {
    setIsPrintModalOpen(false);
    printHook.startPrintProcess(sessionId, mode);
  };

  return {
    isMounted,
    auth: { userRole, isTeacher },
    params: { eventId, sessionId, institutionId },
    
    state: {
      page, limit, search, setSearch,
      filterStatus, filterGender, filterClassId,
      selectedIds, setSelectedIds
    },

    modals: {
      isAddOpen, setIsAddOpen,
      isImportOpen, setIsImportOpen,
      isPrintModalOpen, setIsPrintModalOpen,
      isPhotoDialogOpen, setIsPhotoDialogOpen,
      isBulkGenerateOpen, setIsBulkGenerateOpen,
      editingData, setEditingData,
      deleteId, setDeleteId,
      resetId, setResetId,
      generatePassId, setGeneratePassId,
      detailData, setDetailData
    },

    data: {
      sessionDetail, participants, totalItems, totalPages,
      classes, questionBanks,
      isSessionLoading, isParticipantsLoading, isTransitioning, isFetching
    },

    mutations: {
      addBulkMutation, importMutation, bulkUploadPhotoMutation,
      editMutation, deleteMutation, resetPasswordMutation, bulkGeneratePassMutation
    },

    handlers: {
      updateQueryParams, handleClearFilters,
      handleDownloadTemplate, handleDownloadPhotoReference,
      handleSelectAll, handleSelect, executePrint
    },

    print: printHook,
    router
  };
}