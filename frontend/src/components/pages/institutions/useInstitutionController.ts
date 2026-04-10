// LOKASI: src/components/pages/institutions/useInstitutionController.ts
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { institutionService } from "@/services/institution.service";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";
import { toPng, toJpeg } from "html-to-image";
import { api } from "@/lib/axios";

// --- HELPER DEBOUNCE ---
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const defaultForm = {
  code: "",
  name: "",
  foundation_name: "",
  category: "FORMAL",
  level_code: "SMA/MA/SMK/SEDERAJAT",
  address_city: "",
  address_detail: "",
  contact_phone: "",
  contact_email: "",
  website: "",
  header1: "",
  header2: "",
  is_pq_integration_enabled: false,
  pq_partner_key: "",
};

export function useInstitutionController() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const queryClient = useQueryClient();
  const { user: currentUser, setUser } = useAuthStore();

  // ============================================================================
  // 1. MANAJEMEN STATE FILTER & PENCARIAN DINAMIS
  // ============================================================================
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    category: "ALL",
    level_code: "ALL",
    is_pq_active: "ALL",
  });

  // Reset page ke-1 jika filter berubah
  useEffect(() => {
    setFilter((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, filter.category, filter.level_code, filter.is_pq_active]);

  // ============================================================================
  // 2. MANAJEMEN STATE MODAL (UI)
  // ============================================================================
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPreviewKopOpen, setIsPreviewKopOpen] = useState(false);

  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(defaultForm);
  const [importFile, setImportFile] = useState<File | null>(null);

  // ============================================================================
  // 3. FETCHING DATA (React Query)
  // ============================================================================
  const { data: result, isLoading } = useQuery({
    queryKey: ["institutions", { ...filter, search: debouncedSearch }],
    queryFn: () => {
      const params: any = {
        page: filter.page,
        limit: filter.limit,
        search: debouncedSearch,
      };
      return institutionService.getAllPaginated(params);
    },
    enabled: isMounted,
  });

  const rawData = result?.data || [];
  
  // Client-side filtering sesuai kode lama, dengan penambahan filter is_pq_active
  const displayData = rawData.filter((item: any) => {
    const matchCategory = filter.category === "ALL" || item.category === filter.category;
    const matchLevel = filter.level_code === "ALL" || item.level_code === filter.level_code;
    const matchPq = filter.is_pq_active === "ALL" 
      ? true 
      : filter.is_pq_active === "TRUE" 
        ? item.is_pq_integration_enabled 
        : !item.is_pq_integration_enabled;
    return matchCategory && matchLevel && matchPq;
  });

  const meta = {
    page: filter.page,
    limit: filter.limit,
    total: filter.category !== "ALL" || filter.level_code !== "ALL" || filter.is_pq_active !== "ALL" ? displayData.length : (result?.total || 0),
    total_pages: result?.total_pages || 1,
  };

  // ============================================================================
  // 4. MUTASI DATA
  // ============================================================================
  const saveMutation = useMutation({
    mutationFn: async ({ data, logo }: { data: any; logo: File | null }) => {
      if (isEditMode && selectedInstitution) {
        return await institutionService.update(selectedInstitution.id, data, logo || undefined);
      }
      return await institutionService.create(data, logo || undefined);
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ["institutions"] });
      const updatedInst = res.data;
      if (isEditMode && updatedInst && currentUser && currentUser.institution_id === updatedInst.id) {
        setUser({ ...currentUser, institution_name: updatedInst.name });
      }
      toast.success(isEditMode ? "Data lembaga berhasil diperbarui" : "Lembaga baru berhasil ditambahkan");
      handleCloseForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || err.message || "Terjadi kesalahan"),
  });

  const deleteMutation = useMutation({
    mutationFn: institutionService.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["institutions"] });
      setDeleteId(null);
      toast.success("Lembaga berhasil dihapus secara permanen");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || err.message || "Gagal menghapus data"),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => institutionService.importInstitutions(file),
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({ queryKey: ["institutions"] });
      setIsImportOpen(false);
      setImportFile(null);
      toast.success(`Import Sukses! ${data.total_imported || 0} data masuk.`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || err.message || "Gagal import data"),
  });

  // ============================================================================
  // 5. HANDLERS UI
  // ============================================================================
  const handleEdit = useCallback((item: any) => {
    setFormData({
      ...defaultForm,
      ...item,
    });
    (formData as any).logo_url = item.logo_url;
    setSelectedInstitution(item);
    setIsEditMode(true);
    setIsFormOpen(true);
  }, [formData]);

  const handleCreate = useCallback(() => {
    setFormData(defaultForm);
    setSelectedInstitution(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setTimeout(() => {
      setFormData(defaultForm);
      setIsEditMode(false);
      setSelectedInstitution(null);
    }, 300);
  }, []);

  const handleExportImage = useCallback(async (format: 'png' | 'jpg') => {
    const element = document.getElementById('kop-surat-area');
    if (!element) return;
    try {
      toast.loading(`Sedang memproses ${format.toUpperCase()}...`, { id: "export-kop" });
      const options = { 
        quality: 1, 
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        fetchRequestInit: { mode: 'no-cors' as RequestMode } 
      };
      
      const dataUrl = format === 'png' ? await toPng(element, options) : await toJpeg(element, options);
      const link = document.createElement('a');
      
      const institutionName = selectedInstitution?.name || 'Lembaga';
      link.download = `Kop Surat ${institutionName}.${format}`;
      
      link.href = dataUrl;
      link.click();
      toast.success(`${format.toUpperCase()} berhasil diunduh!`, { id: "export-kop" });
    } catch (err) {
      toast.error("Gagal mengekspor gambar", { id: "export-kop" });
    }
  }, [selectedInstitution]);

  // ============================================================================
  // 6. FUNGSI EXPORT DATA (EXCEL & PDF)
  // ============================================================================
  const handleExportListExcel = useCallback(async () => {
    try {
      toast.loading("Menyiapkan file Excel...", { id: "export-inst-list" });
      
      const response = await api.get('/institutions/export/excel', {
        params: { search: searchInput },
        responseType: 'blob', 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Data_Lembaga.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success("Excel berhasil diunduh!", { id: "export-inst-list" });
    } catch (error) {
      toast.error("Gagal mengunduh file Excel", { id: "export-inst-list" });
    }
  }, [searchInput]);

  const handleExportListPdf = useCallback(async () => {
    try {
      toast.loading("Menyiapkan file PDF...", { id: "export-inst-list" });
      
      const response = await api.get('/institutions/export/pdf', {
        params: { search: searchInput },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Data_Lembaga.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success("PDF berhasil diunduh!", { id: "export-inst-list" });
    } catch (error) {
      toast.error("Gagal mengunduh file PDF", { id: "export-inst-list" });
    }
  }, [searchInput]);
  
  return {
    isMounted,
    state: { filter, setFilter, searchInput, setSearchInput },
    modals: { 
      isFormOpen, setIsFormOpen, 
      isDetailOpen, setIsDetailOpen, 
      isImportOpen, setIsImportOpen, 
      isPreviewKopOpen, setIsPreviewKopOpen,
      selectedInstitution, setSelectedInstitution,
      isEditMode,
      deleteId, setDeleteId,
      formData, setFormData,
      importFile, setImportFile
    },
    data: { displayData, meta, isLoading },
    mutations: { saveMutation, deleteMutation, importMutation },
    handlers: { 
      handleCreate, 
      handleEdit, 
      handleCloseForm, 
      handleExportImage,
      handleExportListExcel, 
      handleExportListPdf    
    }
  };
}