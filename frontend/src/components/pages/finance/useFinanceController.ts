// LOKASI: src/components/pages/finance/useFinanceController.ts
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "@/services/finance.service";
import { toast } from "sonner";
import { FinanceBilling, ProcessPaymentInput } from "@/types/finance";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useFinanceController() {
  const [isMounted, setIsMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"tagihan" | "buku-besar" | "import">("tagihan");

  // --- 1. STATES FILTER & PAGINASI ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("ALL");
  
  const [filterCategoryType, setFilterCategoryType] = useState<string>("ALL");
  const [filterPondok, setFilterPondok] = useState<string>("ALL");
  const [filterSekolah, setFilterSekolah] = useState<string>("ALL");
  const [filterProgram, setFilterProgram] = useState<string>("ALL"); //  Diselaraskan jadi Program

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus, filterCategoryId, filterPondok, filterSekolah, filterProgram, filterCategoryType]);

  // --- 2. STATES MODAL ---
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isRukhsohOpen, setIsRukhsohOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<FinanceBilling | null>(null);

  // --- 3. FETCHING DATA ---
  const { data: filterOptions } = useQuery({
    queryKey: ["financeFilterOptions"],
    queryFn: () => financeService.getFilterOptions(),
    enabled: isMounted,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["billings", page, limit, debouncedSearch, filterStatus, filterCategoryId, filterCategoryType, filterPondok, filterSekolah, filterProgram],
    queryFn: () => financeService.getBillings({
      page,
      limit,
      search: debouncedSearch,
      status: filterStatus !== "ALL" ? filterStatus : undefined,
      category_id: filterCategoryId !== "ALL" ? filterCategoryId : undefined,
      category_type: filterCategoryType !== "ALL" ? filterCategoryType : undefined,
      pondok: filterPondok !== "ALL" ? filterPondok : undefined,
      sekolah: filterSekolah !== "ALL" ? filterSekolah : undefined,
      program: filterProgram !== "ALL" ? filterProgram : undefined, //  Diselaraskan
    }),
    enabled: isMounted,
  });

  const billings = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["financeSummary", debouncedSearch, filterStatus, filterCategoryId, filterCategoryType, filterPondok, filterSekolah, filterProgram],
    queryFn: () => financeService.getFinanceSummary({
      search: debouncedSearch,
      status: filterStatus !== "ALL" ? filterStatus : undefined,
      category_id: filterCategoryId !== "ALL" ? filterCategoryId : undefined,
      category_type: filterCategoryType !== "ALL" ? filterCategoryType : undefined,
      pondok: filterPondok !== "ALL" ? filterPondok : undefined,
      sekolah: filterSekolah !== "ALL" ? filterSekolah : undefined,
      program: filterProgram !== "ALL" ? filterProgram : undefined, //  Diselaraskan
    }),
    enabled: isMounted,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["financeCategories"],
    queryFn: () => financeService.getCategories(),
    enabled: isMounted,
  });

  // --- 4. MUTATIONS ---
  const paymentMutation = useMutation({
    mutationFn: (payload: ProcessPaymentInput) => financeService.processPayment(payload),
    onSuccess: () => {
      toast.success("Pembayaran berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
      setIsPaymentOpen(false);
      setSelectedBilling(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memproses pembayaran");
    }
  });

  return {
    isMounted,
    state: {
      activeTab, setActiveTab,
      page, setPage,
      limit, setLimit,
      search, setSearch,
      filterStatus, setFilterStatus,
      filterCategoryId, setFilterCategoryId,
      filterCategoryType, setFilterCategoryType,
      filterPondok, setFilterPondok,
      filterSekolah, setFilterSekolah,
      filterProgram, setFilterProgram, //  Diselaraskan
    },
    modals: {
      isPaymentOpen, setIsPaymentOpen,
      isImportOpen, setIsImportOpen,
      isRukhsohOpen, setIsRukhsohOpen,
      selectedBilling, setSelectedBilling,
    },
    data: {
      billings, 
      totalItems, 
      totalPages, 
      isLoading: isLoading || isFetching,
      summary: summaryData, 
      isSummaryLoading,
      categories,
      //  Sesuaikan JSON dari backend (jika di backend diganti programs)
      filterOptions: filterOptions || { pondoks: [], sekolahs: [], programs: [] }, 
    },
    mutations: {
      paymentMutation
    }
  };
}