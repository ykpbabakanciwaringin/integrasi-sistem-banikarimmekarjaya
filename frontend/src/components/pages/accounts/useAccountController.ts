import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/use-auth-store";
import { accountService } from "@/services/account.service";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { AccountFilter, User, AccountPayload } from "@/types/user";

// --- HELPER DEBOUNCE ---
// Standar yang sama dengan halaman siswa untuk mencegah spam request
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useAccountController() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const queryClient = useQueryClient();
  const { user: currentUser, setUser: setCurrentUser } = useAuthStore();

  // ============================================================================
  // 1. MANAJEMEN STATE FILTER & PAGINASI
  // ============================================================================
  const [filter, setFilter] = useState<AccountFilter>({
    page: 1, limit: 10, search: "", role: "ALL", 
    institution_id: "ALL", status: "ACTIVE", gender: "ALL", position: "ALL",
  });
  
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sinkronisasi debounced search ke filter
  useEffect(() => {
    setFilter((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // ============================================================================
  // 2. MANAJEMEN STATE MODAL (UI)
  // ============================================================================
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // ============================================================================
  // 3. FETCHING DATA (React Query)
  // ============================================================================
  const { data: accountsData, isLoading: isAccountsLoading, isFetching } = useQuery({
    queryKey: ["accounts_all", filter],
    queryFn: () => accountService.getAll({
      ...filter, page: filter.page || 1, limit: filter.limit || 10, search: filter.search || "",
    }),
    enabled: isMounted,
  });

  const { data: pendingData } = useQuery({
    queryKey: ["accounts_pending_count"],
    queryFn: () => accountService.getAll({ page: 1, limit: 1, status: "PENDING", search: "" }),
    enabled: isMounted,
  });

  const { data: institutionsData } = useQuery({
    queryKey: ["institutions_list_all"],
    queryFn: async () => {
      const res = await apiClient.get("/institutions?limit=100");
      return res.data.data || [];
    },
    enabled: isMounted,
  });

  const accounts = accountsData?.data || [];
  const meta = { 
    page: accountsData?.page || filter.page, 
    limit: accountsData?.limit || filter.limit, 
    total: accountsData?.total || 0, 
    total_pages: accountsData?.total_pages || 1 
  };
  const pendingCount = pendingData?.total || 0;
  const institutions = institutionsData || [];

  // ============================================================================
  // 4. MUTASI DATA
  // ============================================================================
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<AccountPayload>) => {
      if (isEditMode && selectedAccount) return await accountService.update(selectedAccount.id, payload);
      return await accountService.create(payload);
    },
    onSuccess: async (res, payload) => {
      await queryClient.invalidateQueries({ queryKey: ["accounts_all"], refetchType: "all" });
      await queryClient.invalidateQueries({ queryKey: ["accounts_pending_count"], refetchType: "all" });
      
      if (!isEditMode && payload.is_active === false) {
        toast.success("Akun didaftarkan dan masuk ke antrean Menunggu Verifikasi.");
      } else {
        toast.success(isEditMode ? "Akun berhasil diperbarui!" : "Akun baru berhasil dibuat!");
      }

      // Update state auth jika user mengedit akunnya sendiri
      if (isEditMode && selectedAccount?.id === currentUser?.id && res.user) {
        const updatedUser = res.user;
        const cacheBustedAvatar = updatedUser.profile?.image ? `${updatedUser.profile.image}?t=${Date.now()}` : currentUser?.profile?.image;
        setCurrentUser({ ...currentUser, ...updatedUser, profile: { ...updatedUser.profile, image: cacheBustedAvatar } } as User);
      }
      setIsFormOpen(false);
    },
    onError: (error: any) => toast.error(`Gagal menyimpan: ${error.message}`),
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => await accountService.update(id, { is_active: true }),
    onMutate: (id) => setActivatingId(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts_all"], refetchType: "all" });
      await queryClient.invalidateQueries({ queryKey: ["accounts_pending_count"], refetchType: "all" });
      toast.success("Akun berhasil diverifikasi dan diaktifkan!");
    },
    onError: (error: any) => toast.error(`Gagal mengaktifkan: ${error.message}`),
    onSettled: () => setActivatingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts_all"], refetchType: "all" });
      await queryClient.invalidateQueries({ queryKey: ["accounts_pending_count"], refetchType: "all" });
      toast.success("Akun berhasil dihapus permanen");
      setDeleteId(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Mutasi Penugasan (Enrollments)
  const addEnrollmentMutation = useMutation({
    mutationFn: (data: { instId: string; role: string; position: string }) => 
      accountService.addEnrollment(selectedAccount!.id, { institution_id: data.instId, role: data.role, position: data.position }),
    onSuccess: async (res, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["accounts_all"] });
      setSelectedAccount((prev) => {
        if (!prev) return prev;
        const instName = institutions.find((i: any) => i.id === variables.instId)?.name || "Lembaga";
        const newEnrollment = {
          id: res?.data?.id || res?.id || `temp-${Date.now()}`, 
          user_id: prev.id,
          institution_id: variables.instId,
          role: variables.role,
          position: variables.position,
          institution: { id: variables.instId, name: instName }
        };
        return { ...prev, enrollments: [...(prev.enrollments || []), newEnrollment] };
      });
      toast.success("Penugasan lembaga berhasil ditambahkan");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) => accountService.deleteEnrollment(selectedAccount!.id, enrollmentId),
    onSuccess: async (_, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: ["accounts_all"] });
      setSelectedAccount((prev) => {
        if (!prev) return prev;
        return { ...prev, enrollments: prev.enrollments?.filter(en => en.id !== deletedId) };
      });
      toast.success("Penugasan lembaga berhasil dihapus");
    },
    onError: (error: any) => toast.error(error.message),
  });

  // ============================================================================
  // 5. HANDLERS
  // ============================================================================
  const handleOpenCreate = useCallback(() => { 
    setSelectedAccount(null); setIsEditMode(false); setIsFormOpen(true); 
  }, []);
  
  const handleOpenEdit = useCallback((account: User) => { 
    setSelectedAccount(account); setIsEditMode(true); setIsFormOpen(true); 
  }, []);
  
  const handleOpenDetail = useCallback((account: User) => { 
    setSelectedAccount(account); setIsDetailOpen(true); 
  }, []);

  return {
    isMounted,
    currentUser,
    state: {
      filter, setFilter,
      searchInput, setSearchInput,
      activatingId
    },
    modals: {
      isFormOpen, setIsFormOpen,
      isDetailOpen, setIsDetailOpen,
      isEditMode,
      selectedAccount, setSelectedAccount,
      deleteId, setDeleteId
    },
    data: {
      accounts, meta, pendingCount, institutions,
      isAccountsLoading, isFetching
    },
    mutations: {
      saveMutation, activateMutation, deleteMutation,
      addEnrollmentMutation, deleteEnrollmentMutation
    },
    handlers: {
      handleOpenCreate, handleOpenEdit, handleOpenDetail
    }
  };
}