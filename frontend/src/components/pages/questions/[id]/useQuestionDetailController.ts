// LOKASI: src/components/pages/questions/[id]/useQuestionDetailController.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionService } from "@/services/question.service";
import { toast } from "sonner";
import { QuestionBank } from "@/types/question";

export function useQuestionDetailController(packetId: string) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const queryClient = useQueryClient();

  // ============================================================================
  // 1. MANAJEMEN STATE UI & PAGINASI
  // ============================================================================
  const [activeTab, setActiveTab] = useState("editor");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ============================================================================
  // 2. MANAJEMEN STATE MODAL
  // ============================================================================
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ============================================================================
  // 3. FETCHING DATA DETAIL PAKET (React Query)
  // ============================================================================
  const { data: packetDetail, isLoading: isPacketLoading } = useQuery({
    queryKey: ["question-packet-detail", packetId],
    queryFn: async () => {
      const res = await questionService.getDetail(packetId);
      // [PENYEMPURNAAN KRUSIAL]: Mencegah error "Undefined Query Data"
      // Jika res tidak terdefinisi, kembalikan null agar React Query tidak crash
      return res ?? null; 
    },
    enabled: isMounted && !!packetId,
  });

  // Ekstraksi butir soal dari detail paket
  const items = useMemo(() => {
    return packetDetail?.items || [];
  }, [packetDetail]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Menghitung total bobot skor dari seluruh butir soal
  const totalScore = useMemo(() => {
    return items.reduce((acc: number, curr: any) => acc + (curr.score_weight || 0), 0);
  }, [items]);

  // [PENYEMPURNAAN UX]: Auto-koreksi Paginasi saat data dihapus
  // Jika user menghapus item terakhir di halaman 3, otomatis pindah ke halaman 2
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, totalPages, currentPage]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  // ============================================================================
  // 4. MUTASI DATA
  // ============================================================================
  const saveItemMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.id) {
        // [PERBAIKAN FATAL]: Wajib menyertakan parent_id (packetId) agar Backend tidak mengembalikan error 400 Bad Request
        return questionService.updateItem(data.id, { ...data, parent_id: packetId });
      }
      return questionService.createItem({ ...data, parent_id: packetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-packet-detail", packetId] });
      setIsFormOpen(false);
      toast.success("Butir soal berhasil disimpan");
    },
    onError: (error: any) => toast.error(error.message || "Gagal menyimpan butir soal"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => questionService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-packet-detail", packetId] });
      setDeleteId(null);
      toast.success("Butir soal berhasil dihapus dari paket");
    },
    onError: (error: any) => toast.error(error.message || "Gagal menghapus soal"),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => {
        return questionService.importQuestions(file, packetId); 
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["question-packet-detail", packetId] });
      setIsImportOpen(false);
      toast.success(res.message || `Berhasil mengimpor ${res.count || "beberapa"} soal dari Excel`);
    },
    onError: (error: any) => toast.error(error.message || "Gagal mengimpor soal dari Excel"),
  });

  // ============================================================================
  // 5. HANDLERS
  // ============================================================================
  const handleOpenAdd = useCallback(() => {
    setSelectedItem(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: any) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  return {
    isMounted,
    state: {
      activeTab, setActiveTab,
      currentPage, setCurrentPage,
      itemsPerPage, setItemsPerPage,
    },
    modals: {
      isFormOpen, setIsFormOpen,
      isImportOpen, setIsImportOpen,
      selectedItem, setSelectedItem,
      deleteId, setDeleteId,
    },
    data: {
      packetDetail, items, currentItems,
      totalItems, totalPages, totalScore,
      isPacketLoading
    },
    mutations: {
      saveItemMutation, deleteItemMutation, importMutation
    },
    handlers: {
      handleOpenAdd, handleOpenEdit
    }
  };
}