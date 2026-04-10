// LOKASI: src/components/pages/students/useStudentController.ts
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentService } from "@/services/student.service";
import { classService } from "@/services/class.service";
import { institutionService } from "@/services/institution.service";
import { accountService } from "@/services/account.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";
import { User } from "@/types/user";
import { useStudentPrint } from "./use-student-print";

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
export const defaultStudentForm = {
  full_name: "", nisn: "", nik: "", username: "", password: "",
  gender: "L", birth_place: "", birth_date: "", phone_number: "",
  institution_id: "", class_id: "none", status: "ACTIVE",
  pondok: "none", asrama: "", kamar: "", program: "none", kelas_program: "",
  father_name: "", mother_name: "", guardian_phone: "",
  address: "", village: "", subdistrict: "", regency: "", province: ""
};

export function useStudentController() {
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
  const [filterClassId, setFilterClassId] = useState("ALL");
  const [filterGender, setFilterGender] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Reset halaman ke-1 jika filter berubah
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [activeTab, debouncedSearch, filterInstId, filterClassId, filterGender, filterStatus, limit]);

  // ============================================================================
  // 2. MANAJEMEN STATE MODAL (UI)
  // ============================================================================
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(defaultStudentForm);

  // ============================================================================
  // 3. FETCHING DATA (React Query)
  // ============================================================================
  
  // A. Fetch Semua Siswa (Utama)
  const { data: studentsData, isLoading, isFetching } = useQuery({
    queryKey: ["students_all", { page, limit, debouncedSearch, filterInstId, filterClassId, filterGender, filterStatus, activeTab }],
    queryFn: () => {
      const params: any = { page, limit, search: debouncedSearch, status: activeTab };
      if (filterInstId !== "ALL") params.institution_id = filterInstId;
      if (filterClassId !== "ALL") params.class_id = filterClassId;
      if (filterGender !== "ALL") params.gender = filterGender;
      if (filterStatus !== "ALL") params.academic_status = filterStatus;
      return studentService.getAll(params);
    },
    //  PERBAIKAN: Menghapus refetchInterval untuk mencegah DDoS internal
    enabled: isMounted,
  });

  // B. Fetch Lencana (Badge) Menunggu Verifikasi
  const { data: pendingData } = useQuery({
    queryKey: ["students_pending_count", filterInstId],
    queryFn: () => {
      const params: any = { page: 1, limit: 1, status: "PENDING" };
      if (filterInstId !== "ALL") params.institution_id = filterInstId;
      return studentService.getAll(params);
    },
    //  PERBAIKAN: Menghapus refetchInterval untuk mencegah DDoS internal
    enabled: isMounted,
  });

  // C. Fetch Master Data Lembaga & Kelas
  const { data: instData } = useQuery({
    queryKey: ["institutions_list"],
    queryFn: () => institutionService.getAllPaginated({ limit: 100 }),
    enabled: isSuperAdmin && isMounted,
  });

  const { data: classesData } = useQuery({
    queryKey: ["classes_list", filterInstId],
    queryFn: () => classService.getAll({ 
      institution_id: filterInstId !== "ALL" ? filterInstId : undefined,
      limit: 500
    }),
    enabled: isMounted && (filterInstId !== "ALL" || !isSuperAdmin),
  });

  const institutions = instData?.data || instData || [];
  const classes = classesData?.data || [];
  const students = studentsData?.data || [];
  const totalItems = studentsData?.total || 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const pendingCount = pendingData?.total || 0;

  // ============================================================================
  // 4. HOOK PENCETAKAN KARTU
  // ============================================================================
  const printHook = useStudentPrint(students, selectedIds, () => setSelectedIds([]));

  // ============================================================================
  // 5. MUTASI DATA (Ubah/Hapus/Tambah ke Database)
  // ============================================================================
  
  // A. Simpan Data (Tambah/Edit)
  const saveMutation = useMutation({
    mutationFn: async ({ data, photo }: { data: any; photo: File | null }) => {
      const payload = { ...data };
      if (!isSuperAdmin) payload.institution_id = userInstId;
      if (payload.class_id === "none") payload.class_id = null;
      if (payload.pondok === "none") payload.pondok = "TIDAK MUKIM";
      if (payload.program === "none") payload.program = "TIDAK IKUT PROGRAM";

      if (isEditMode && selectedStudent) return studentService.update(selectedStudent.id, payload, photo || undefined);
      return studentService.create(payload, photo || undefined);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students_all"], refetchType: "all" });
      await queryClient.invalidateQueries({ queryKey: ["students_pending_count"], refetchType: "all" });
      handleCloseForm();
      toast.success(isEditMode ? "Data siswa berhasil diperbarui" : "Siswa baru berhasil ditambahkan");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Gagal menyimpan data siswa"),
  });

  // B. Hapus Permanen
  const deleteMutation = useMutation({
    mutationFn: studentService.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students_all"], refetchType: "all" });
      setDeleteId(null);
      setSelectedIds([]);
      toast.success("Data siswa berhasil dihapus secara permanen");
    },
  });

  // C. Verifikasi Akun (Optimistic-like)
  const verifyMutation = useMutation({
    mutationFn: async (id: string) => accountService.update(id, { is_active: true }),
    onMutate: (id) => setActivatingId(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students_all"], refetchType: "all" });
      await queryClient.invalidateQueries({ queryKey: ["students_pending_count"], refetchType: "all" });
      toast.success("Akun siswa berhasil diverifikasi dan diaktifkan!");
    },
    onSettled: () => setActivatingId(null)
  });

  // ============================================================================
  // 6. HANDLERS (Fungsi UI Berkinerja Tinggi dengan useCallback)
  // ============================================================================

  const handleAddClick = useCallback(() => {
    setFormData({ ...defaultStudentForm, institution_id: isSuperAdmin ? "" : userInstId });
    setIsEditMode(false);
    setIsFormOpen(true);
  }, [isSuperAdmin, userInstId]);

  const handleEditClick = useCallback((item: any) => {
    const instId = item.enrollments?.[0]?.institution_id || item.institution_id || "";
    let bDate = item.profile?.birth_date && !item.profile.birth_date.startsWith("0001") ? item.profile.birth_date.split("T")[0] : "";

    setFormData({
      ...defaultStudentForm, 
      ...item.profile,
      username: item.username, 
      institution_id: instId, 
      birth_date: bDate,
      class_id: item.profile?.class_id || "none",
      pondok: item.profile?.pondok && item.profile.pondok !== "TIDAK MUKIM" ? item.profile.pondok : "none",
      program: item.profile?.program && item.profile.program !== "TIDAK IKUT PROGRAM" ? item.profile.program : "none",
    });
    setSelectedStudent(item);
    setIsEditMode(true);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setTimeout(() => {
      setFormData(defaultStudentForm);
      setIsEditMode(false);
      setSelectedStudent(null);
    }, 300);
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      toast.loading("Memproses dokumen Excel...", { id: "export-excel" });
      await studentService.exportExcel({
        institution_id: filterInstId !== "ALL" ? filterInstId : undefined,
        class_id: filterClassId !== "ALL" ? filterClassId : undefined,
        gender: filterGender !== "ALL" ? filterGender : undefined,
        academic_status: filterStatus !== "ALL" ? filterStatus : undefined,
        search: debouncedSearch,
        status: activeTab
      });
      toast.success("Dokumen Excel berhasil diunduh!", { id: "export-excel" });
    } catch (error) {
      toast.error("Gagal mengunduh dokumen Excel.", { id: "export-excel" });
    }
  }, [filterInstId, filterClassId, filterGender, filterStatus, debouncedSearch, activeTab]);

  const handleExportPdf = useCallback(async () => {
    try {
      toast.loading("Mempersiapkan data siswa format PDF...", { id: "export-pdf" });
      await studentService.exportPdf({
        institution_id: filterInstId !== "ALL" ? filterInstId : undefined,
        class_id: filterClassId !== "ALL" ? filterClassId : undefined,
        gender: filterGender !== "ALL" ? filterGender : undefined,
        academic_status: filterStatus !== "ALL" ? filterStatus : undefined,
        search: debouncedSearch,
        status: activeTab
      });
      toast.success("Data Siswa format PDF berhasil diunduh!", { id: "export-pdf" });
    } catch (error) {
      toast.error("Gagal mengunduh data siswa format PDF.", { id: "export-pdf" });
    }
  }, [filterInstId, filterClassId, filterGender, filterStatus, debouncedSearch, activeTab]);

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
      filterClassId, setFilterClassId,
      filterGender, setFilterGender,
      filterStatus, setFilterStatus,
      selectedIds, setSelectedIds,
      activatingId
    },

    // State untuk Modals
    modals: {
      isFormOpen, setIsFormOpen,
      isDetailOpen, setIsDetailOpen,
      isImportOpen, setIsImportOpen,
      selectedStudent, setSelectedStudent,
      isEditMode,
      deleteId, setDeleteId,
      formData, setFormData
    },

    // Data balikan dari API
    data: {
      students, totalItems, totalPages, pendingCount,
      institutions, classes,
      isLoading, isFetching
    },

    // Aksi / Mutasi
    mutations: {
      saveMutation,
      deleteMutation,
      verifyMutation
    },

    // Handlers yang sudah dioptimasi
    handlers: {
      handleAddClick,
      handleEditClick,
      handleCloseForm,
      handleExportExcel,
      handleExportPdf,
    },

    // Hook Cetak
    print: printHook,
    queryClient // Dieskpor agar page.tsx bisa memaksa refresh saat import sukses
  };
}