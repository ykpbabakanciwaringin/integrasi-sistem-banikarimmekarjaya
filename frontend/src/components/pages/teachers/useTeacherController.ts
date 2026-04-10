// LOKASI: src/components/pages/teachers/useTeacherController.ts
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherService } from "@/services/teacher.service";
import { institutionService } from "@/services/institution.service";
import { accountService } from "@/services/account.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";
import { useTeacherPrint } from "./use-teacher-print";

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

// --- NILAI DEFAULT FORMULIR ---
export const defaultTeacherForm = {
  full_name: "", nik: "", nip: "", position: "GURU MAPEL",
  username: "", password: "", gender: "L", birth_place: "",
  birth_date: "", phone_number: "", email: "", institution_id: "", status: "ACTIVE",
};

export function useTeacherController() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  const userInstId = user?.enrollments?.[0]?.institution_id || (user as any)?.institution_id || "";
  const userInstName = user?.enrollments?.[0]?.institution?.name || (user as any)?.institution?.name || "Lembaga Anda";

  // ============================================================================
  // 1. MANAJEMEN STATE FILTER & PAGINASI
  // ============================================================================
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PENDING">("ACTIVE");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); 
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [filterInstId, setFilterInstId] = useState(isSuperAdmin ? "ALL" : userInstId);
  const [filterGender, setFilterGender] = useState("ALL");
  const [filterPosition, setFilterPosition] = useState("ALL");
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Reset halaman ke-1 jika filter berubah
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [activeTab, debouncedSearch, filterInstId, filterGender, filterPosition, limit]);

  // ============================================================================
  // 2. MANAJEMEN STATE MODAL (UI)
  // ============================================================================
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(defaultTeacherForm);

  // ============================================================================
  // 3. FETCHING DATA (React Query)
  // ============================================================================
  
  // A. Fetch Semua Guru (Utama)
  const { data: teachersData, isLoading, isFetching } = useQuery({
    queryKey: ["teachers_all", { page, limit, debouncedSearch, filterInstId, filterGender, filterPosition, activeTab }],
    queryFn: () => teacherService.getAll({ 
      page, limit, search: debouncedSearch, 
      institution_id: filterInstId !== "ALL" ? filterInstId : undefined, 
      gender: filterGender !== "ALL" ? filterGender : undefined, 
      position: filterPosition !== "ALL" ? filterPosition : undefined, 
      status: activeTab 
    }),
    enabled: isMounted,
  });

  // B. Fetch Lencana (Badge) Menunggu Verifikasi
  const { data: pendingData } = useQuery({
    queryKey: ["teachers_pending_count", filterInstId],
    queryFn: () => teacherService.getAll({ 
      page: 1, limit: 1, status: "PENDING", 
      institution_id: filterInstId !== "ALL" ? filterInstId : undefined 
    }),
    enabled: isMounted,
  });

  // C. Fetch Master Data Lembaga
  const { data: instData } = useQuery({
    queryKey: ["institutions_list"],
    queryFn: () => institutionService.getAllPaginated({ limit: 1000 }),
    enabled: isSuperAdmin && isMounted,
  });

  const institutions = instData?.data || instData || [];
  const teachers = teachersData?.data || [];
  const totalItems = teachersData?.total || 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pendingCount = pendingData?.total || 0;

  // ============================================================================
  // 4. HOOK PENCETAKAN KARTU
  // ============================================================================
  const printHook = useTeacherPrint(teachers, selectedIds, () => setSelectedIds([]));

  // ============================================================================
  // 5. MUTASI DATA (Ubah/Hapus/Tambah ke Database)
  // ============================================================================
  
  // A. Simpan Data (Tambah/Edit)
  const saveMutation = useMutation({
    mutationFn: async ({ data, photo }: { data: any; photo: File | null }) => {
      const payload = { ...data };
      if (!isSuperAdmin) payload.institution_id = userInstId;

      if (isEditMode && selectedTeacher) return teacherService.update(selectedTeacher.id, payload, photo || undefined);
      return teacherService.create(payload, photo || undefined);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teachers_all"], refetchType: "all" });
      await queryClient.invalidateQueries({ queryKey: ["teachers_pending_count"], refetchType: "all" });
      handleCloseForm();
      toast.success(isEditMode ? "Data guru berhasil diperbarui" : "Guru baru berhasil ditambahkan");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menyimpan data guru"),
  });

  // B. Hapus Permanen
  const deleteMutation = useMutation({
    mutationFn: teacherService.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teachers_all"], refetchType: "all" });
      setDeleteId(null);
      setSelectedIds([]);
      toast.success("Data guru berhasil dihapus secara permanen");
    },
  });

  // C. Verifikasi Akun (Optimistic-like)
  const verifyMutation = useMutation({
    mutationFn: async (id: string) => accountService.update(id, { is_active: true }),
    onMutate: (id) => setActivatingId(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teachers_all"], refetchType: "all" });
      await queryClient.invalidateQueries({ queryKey: ["teachers_pending_count"], refetchType: "all" });
      toast.success("Akun guru berhasil diverifikasi dan diaktifkan!");
    },
    onSettled: () => setActivatingId(null)
  });

  // ============================================================================
  // 6. HANDLERS (Fungsi UI Berkinerja Tinggi dengan useCallback)
  // ============================================================================

  const handleAddClick = useCallback(() => {
    setFormData({ ...defaultTeacherForm, institution_id: isSuperAdmin ? "" : userInstId });
    setIsEditMode(false);
    setIsFormOpen(true);
  }, [isSuperAdmin, userInstId]);

  const handleEditClick = useCallback((item: any) => {
    const instId = item.enrollments?.[0]?.institution_id || item.institution_id || "";
    let bDate = item.profile?.birth_date && !item.profile.birth_date.startsWith("0001") ? item.profile.birth_date.split("T")[0] : "";

    setFormData({
      ...defaultTeacherForm, 
      ...item.profile,
      nik: item.profile?.nik || "", 
      nip: item.profile?.n_ip || item.profile?.nip || "",
      position: item.enrollments?.[0]?.position || "GURU MAPEL",
      username: item.username, 
      institution_id: instId, 
      birth_date: bDate,
    });
    setSelectedTeacher(item);
    setIsEditMode(true);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setTimeout(() => {
      setFormData(defaultTeacherForm);
      setIsEditMode(false);
      setSelectedTeacher(null);
    }, 300);
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      toast.loading("Memproses dokumen Excel...", { id: "export-excel" });
      await teacherService.exportExcel({
        institution_id: filterInstId !== "ALL" ? filterInstId : undefined,
        gender: filterGender !== "ALL" ? filterGender : undefined,
        position: filterPosition !== "ALL" ? filterPosition : undefined,
        search: debouncedSearch,
        status: activeTab
      });
      toast.success("Dokumen Excel berhasil diunduh!", { id: "export-excel" });
    } catch (error) {
      toast.error("Gagal mengunduh dokumen Excel.", { id: "export-excel" });
    }
  }, [filterInstId, filterGender, filterPosition, debouncedSearch, activeTab]);

  const handleExportPdf = useCallback(async () => {
    try {
      toast.loading("Mempersiapkan data guru format PDF...", { id: "export-pdf" });
      await teacherService.exportPdf({
        institution_id: filterInstId !== "ALL" ? filterInstId : undefined,
        gender: filterGender !== "ALL" ? filterGender : undefined,
        position: filterPosition !== "ALL" ? filterPosition : undefined,
        search: debouncedSearch,
        status: activeTab
      });
      toast.success("Data Guru format PDF berhasil diunduh!", { id: "export-pdf" });
    } catch (error) {
      toast.error("Gagal mengunduh data guru format PDF.", { id: "export-pdf" });
    }
  }, [filterInstId, filterGender, filterPosition, debouncedSearch, activeTab]);

  return {
    isMounted,
    auth: { isSuperAdmin, userInstId, userInstName },
    
    // States untuk filter dan UI
    state: {
      activeTab, setActiveTab,
      page, setPage,
      limit, setLimit,
      search, setSearch,
      filterInstId, setFilterInstId,
      filterGender, setFilterGender,
      filterPosition, setFilterPosition,
      selectedIds, setSelectedIds,
      activatingId
    },

    // State untuk Modals
    modals: {
      isFormOpen, setIsFormOpen,
      isDetailOpen, setIsDetailOpen,
      isImportOpen, setIsImportOpen,
      selectedTeacher, setSelectedTeacher,
      isEditMode,
      deleteId, setDeleteId,
      formData, setFormData
    },

    // Data balikan dari API
    data: {
      teachers, totalItems, totalPages, pendingCount,
      institutions,
      isLoading, isFetching
    },

    // Aksi / Mutasi
    mutations: { saveMutation, deleteMutation, verifyMutation },
    
    // Handlers yang sudah dioptimasi
    handlers: { handleAddClick, handleEditClick, handleCloseForm, handleExportExcel, handleExportPdf },
    
    // Hook Cetak
    print: printHook,
    queryClient
  };
}