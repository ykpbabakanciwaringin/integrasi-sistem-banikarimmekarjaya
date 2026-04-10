// LOKASI: src/components/pages/questions/useQuestionController.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionService } from "@/services/question.service";
import { subjectService } from "@/services/subject.service";
import { institutionService } from "@/services/institution.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";
import { QuestionBank } from "@/types/question";

// --- HELPER DEBOUNCE ---
// Mencegah server dibombardir request saat admin mengetik cepat di kolom pencarian
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useQuestionController() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userInstId = user?.institution_id || "";

  // ============================================================================
  // 1. MANAJEMEN STATE FILTER & PAGINASI
  // ============================================================================
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [filterInst, setFilterInst] = useState<string>(isSuperAdmin ? "all" : userInstId);
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // State untuk fitur Batch & Laporan
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingList, setIsExportingList] = useState(false);

  // [PENYEMPURNAAN UX]: Referensi untuk melacak perubahan lembaga
  const prevInstRef = useRef(filterInst);

  // [PENYEMPURNAAN UX]: Reset halaman & Sinkronisasi Filter Dinamis
  useEffect(() => {
    // 1. Selalu kembalikan ke Halaman 1 jika ada perubahan parameter pencarian/limit
    setPage(1);

    // 2. Jika filter Lembaga berubah, reset filter Mata Pelajaran agar tidak terjadi "Data Kosong" akibat bentrok id
    if (prevInstRef.current !== filterInst) {
      setFilterSubject("all");
      prevInstRef.current = filterInst;
    }
  }, [limit, debouncedSearch, filterInst, filterSubject]);

  // ============================================================================
  // 2. MANAJEMEN STATE MODAL (UI)
  // ============================================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<QuestionBank | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ============================================================================
  // 3. FETCHING DATA (React Query)
  // ============================================================================
  const { data: responseData, isLoading, isFetching } = useQuery({
    queryKey: ["question-packets", page, limit, debouncedSearch, filterInst, filterSubject],
    queryFn: () => questionService.getAll({
        page,
        limit,
        search: debouncedSearch,
        institution_id: filterInst !== "all" ? filterInst : undefined,
        subject_id: filterSubject !== "all" ? filterSubject : undefined,
    }),
    enabled: isMounted,
  });

  const { data: institutionsData } = useQuery({
    queryKey: ["institutions-list"],
    queryFn: () => institutionService.getAllPaginated({ limit: 100 }),
    enabled: isSuperAdmin && isMounted,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects-list", filterInst],
    queryFn: () => subjectService.getAllSubjects({
        institution_id: filterInst !== "all" ? filterInst : undefined,
        limit: 100,
    }),
    enabled: isMounted,
  });

  const institutions = institutionsData?.data || institutionsData || [];
  const subjects = subjectsData?.data || [];
  const packets = responseData?.data || [];
  const totalData = responseData?.total || 0;
  const totalPages = Math.ceil(totalData / limit) || 1;

  // ============================================================================
  // 4. MUTASI DATA
  // ============================================================================
  const createMutation = useMutation({
    mutationFn: (data: Partial<QuestionBank>) => questionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-packets"] });
      setIsModalOpen(false);
      toast.success("Paket soal berhasil dibuat");
    },
    onError: (error: any) => toast.error(error.message || "Gagal membuat paket soal"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<QuestionBank> & { id: string }) => {
      const { id, ...payload } = data;
      return questionService.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-packets"] });
      setIsModalOpen(false);
      setEditData(null);
      toast.success("Paket soal berhasil diperbarui");
    },
    onError: (error: any) => toast.error(error.message || "Gagal memperbarui paket soal"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-packets"] });
      setDeleteId(null);
      toast.success("Paket soal berhasil dihapus dari daftar");
    },
    onError: (error: any) => toast.error(error.message || "Gagal menghapus paket soal"),
  });

  // ============================================================================
  // 5. HANDLERS
  // ============================================================================
  const handleOpenCreate = useCallback(() => {
    setEditData(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((packet: QuestionBank) => {
    setEditData(packet);
    setIsModalOpen(true);
  }, []);

  const handleOpenDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      setIsExporting(true);
      let instName = "";
      if (filterInst !== "all") {
        const selectedInst = institutions.find((inst: any) => inst.id === filterInst);
        if (selectedInst) instName = selectedInst.name;
      } else if (!isSuperAdmin) {
        const selectedInst = institutions.find((inst: any) => inst.id === userInstId);
        if (selectedInst) instName = selectedInst.name;
      }

      await questionService.exportExcel({
        institution_id: filterInst !== "all" ? filterInst : undefined,
        subject_id: filterSubject !== "all" ? filterSubject : undefined,
        search: debouncedSearch,
      }, instName);

      toast.success("Berhasil mengunduh Backup Bank Soal");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh file ZIP Excel");
    } finally {
      setIsExporting(false);
    }
  }, [filterInst, filterSubject, debouncedSearch, institutions, isSuperAdmin, userInstId]);

  const handleExportPdf = useCallback(async () => {
    try {
      setIsExportingPdf(true);
      let instName = "";
      if (filterInst !== "all") {
        const selectedInst = institutions.find((inst: any) => inst.id === filterInst);
        if (selectedInst) instName = selectedInst.name;
      } else if (!isSuperAdmin) {
        const selectedInst = institutions.find((inst: any) => inst.id === userInstId);
        if (selectedInst) instName = selectedInst.name;
      }

      await questionService.exportPDF({
        institution_id: filterInst !== "all" ? filterInst : undefined,
        subject_id: filterSubject !== "all" ? filterSubject : undefined,
        search: debouncedSearch,
      }, instName);

      toast.success("Berhasil mengunduh Arsip PDF Bank Soal");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh file ZIP PDF");
    } finally {
      setIsExportingPdf(false);
    }
  }, [filterInst, filterSubject, debouncedSearch, institutions, isSuperAdmin, userInstId]);

  // FITUR BATCH IMPORT & EXPORT LIST
  const handleOpenBatchModal = useCallback(() => setIsBatchModalOpen(true), []);

  const handleDownloadBatchTemplate = useCallback(async () => {
    try {
      await questionService.downloadBatchTemplate();
      toast.success("Template berhasil diunduh");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh template");
    }
  }, []);

  const handleImportBatch = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      const res = await questionService.importBatchPackets(file);
      toast.success(res.message || "Berhasil mengimpor paket soal");
      queryClient.invalidateQueries({ queryKey: ["question-packets"] });
      setIsBatchModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Gagal mengimpor file");
    } finally {
      setIsImporting(false);
    }
  }, [queryClient]);

  const handleExportList = useCallback(async () => {
    setIsExportingList(true);
    try {
      let instName = "";
      if (isSuperAdmin && filterInst !== "all") {
        const selectedInst = institutions.find((inst: any) => inst.id === filterInst);
        if (selectedInst) instName = selectedInst.name;
      } else if (!isSuperAdmin) {
        const selectedInst = institutions.find((inst: any) => inst.id === userInstId);
        if (selectedInst) instName = selectedInst.name;
      }

      await questionService.exportPacketList({
        institution_id: filterInst !== "all" ? filterInst : undefined,
        subject_id: filterSubject !== "all" ? filterSubject : undefined,
        search: debouncedSearch,
      }, instName);

      toast.success("Berhasil mengunduh laporan daftar paket soal");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh laporan");
    } finally {
      setIsExportingList(false);
    }
  }, [filterInst, filterSubject, debouncedSearch, institutions, isSuperAdmin, userInstId]);

  return {
    isMounted,
    auth: { isSuperAdmin, userInstId, user },
    state: {
      page, setPage,
      limit, setLimit,
      searchInput, setSearchInput,
      filterInst, setFilterInst,
      filterSubject, setFilterSubject,
      isExporting,
      isExportingPdf,
      isImporting,      
      isExportingList   
    },
    modals: {
      isModalOpen, setIsModalOpen,
      editData, setEditData,
      deleteId, setDeleteId,
      isBatchModalOpen, setIsBatchModalOpen 
    },
    data: {
      packets, totalData, totalPages,
      institutions, subjects,
      isLoading: isLoading || isFetching
    },
    mutations: {
      createMutation, updateMutation, deleteMutation
    },
    handlers: {
      handleOpenCreate, 
      handleOpenEdit, 
      handleOpenDelete,
      handleExportExcel, 
      handleExportPdf,
      handleOpenBatchModal,        
      handleDownloadBatchTemplate, 
      handleImportBatch,           
      handleExportList             
    }
  };
}