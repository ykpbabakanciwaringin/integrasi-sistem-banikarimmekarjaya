import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { reportService } from "@/services/report.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function useRaporController() {
  const { id } = useParams() as { id: string };
  const { user } = useAuthStore() as any;
  const printRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // --- STATE PENCARIAN & PAGINASI ---
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12); // Default 12 kartu per halaman (Grid 3x4 atau 4x3)

  //  AMBIL DATA LEGER (Sumber data utama rapor)
  const { data: legerData, isLoading, isError } = useQuery({
    queryKey: ["class-rapor-data", id],
    queryFn: () => reportService.getClassLeger(id),
    enabled: !!id,
  });

  // --- LOGIKA OTORISASI (Role Guard) ---
  const isAuthorized = useMemo(() => {
    if (!legerData?.class_info) return true; // Tunggu data sampai
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"].includes(user?.role);
    const isOwner = user?.id === legerData.class_info.teacher_id;
    return isAdmin || isOwner;
  }, [legerData, user]);

  // --- FILTERING & PAGINASI LOKAL ---
  const filteredStudents = useMemo(() => {
    if (!legerData?.students) return [];
    return legerData.students.filter((s: any) =>
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [legerData, search]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredStudents.slice(start, start + limit);
  }, [filteredStudents, page, limit]);

  // Reset page saat mencari
  useEffect(() => { setPage(1); }, [search, limit]);

  // --- HANDLERS ---
  const handlePrintAll = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Rapor_Massal_${legerData?.class_info?.name || "Kelas"}`,
  });

  const todayStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale });

  return {
    isMounted,
    isAuthorized,
    refs: { printRef },
    state: {
      search, setSearch,
      page, setPage,
      limit, setLimit,
    },
    data: {
      classInfo: legerData?.class_info,
      subjectList: legerData?.subject_list || [],
      students: paginatedStudents, // Data yang sudah dipaginasi
      allStudents: filteredStudents, // Untuk keperluan cetak massal
      totalItems,
      totalPages,
      isLoading,
      isError,
      todayStr,
    },
    handlers: {
      handlePrintAll,
    },
  };
}