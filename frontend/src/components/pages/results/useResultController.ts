// LOKASI: src/components/pages/results/useResultController.ts
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { classService } from "@/services/class.service";
import { examService } from "@/services/exam.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { apiClient as api } from "@/lib/axios";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useResultController() {
  const { user } = useAuthStore() as any;
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [activeTab, setActiveTab] = useState<"mapel" | "wali" | "rapor" | "ujian">("mapel");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Reset pencarian & paginasi setiap kali pindah tab
  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [activeTab]);

  // --- DATA FETCHING ---
  
  // 1. Fetch Assignments (Untuk Tab Rekap Guru Mapel)
  const { data: assignmentsData, isLoading: loadingAssignments, isFetching: fetchingAssignments } = useQuery({
    queryKey: ["teacher-assignments", user?.id],
    queryFn: async () => {
      const res = await api.get("/academic/assignments", { params: { limit: 1000 } });
      return res.data;
    },
    enabled: isMounted, // Selalu aktifkan untuk mengecek kepemilikan data di awal
  });

  // 2. Fetch Classes (Untuk Tab Wali Kelas & Rapor)
  const { data: classesData, isLoading: loadingClasses, isFetching: fetchingClasses } = useQuery({
    queryKey: ["homeroom-classes", user?.id],
    queryFn: () => classService.getAll(), 
    enabled: isMounted, // Selalu aktifkan agar kita tahu apakah user ini Wali Kelas atau bukan
  });

  // 3. Fetch Finished Sessions (Untuk Tab Hasil Per Sesi Ujian)
  const { data: sessionData, isLoading: loadingSessions, isFetching: fetchingSessions } = useQuery({
    queryKey: ["finished-sessions", page, limit, debouncedSearch],
    queryFn: () => examService.getSessions({
      status: "FINISHED", 
      page,
      limit,
      search: debouncedSearch,
    }),
    enabled: isMounted && activeTab === "ujian",
  });

  // --- PEMROSESAN DATA LOKAL ---
  const rawAssignments = useMemo(() => assignmentsData?.data || (Array.isArray(assignmentsData) ? assignmentsData : []), [assignmentsData]);
  const rawClasses = useMemo(() => classesData?.data || (Array.isArray(classesData) ? classesData : []), [classesData]);

  //  LOGIKA RBAC: Cek apakah user saat ini terdaftar sebagai wali kelas di salah satu rombel
  // Ini digunakan untuk menyembunyikan/menampilkan Tab di UI
  const isHomeroomTeacher = useMemo(() => {
    return rawClasses.some((c: any) => c.teacher_id === user?.id);
  }, [rawClasses, user?.id]);

  // Filter pencarian untuk Penugasan
  const filteredAssignments = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return rawAssignments.filter((a: any) =>
      a.subject?.name?.toLowerCase().includes(term) ||
      a.teacher?.full_name?.toLowerCase().includes(term) ||
      a.class?.name?.toLowerCase().includes(term)
    );
  }, [rawAssignments, debouncedSearch]);
  
  // Filter pencarian untuk Kelas (Hanya tampilkan kelas perwalian jika bukan Admin)
  const filteredClasses = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"].includes(user?.role);
    
    return rawClasses.filter((c: any) => {
      const matchesSearch = c.name?.toLowerCase().includes(term);
      const isOwner = c.teacher_id === user?.id;
      return isAdmin ? matchesSearch : (matchesSearch && isOwner);
    });
  }, [rawClasses, debouncedSearch, user?.role, user?.id]);

  const getPaginated = (arr: any[]) => arr.slice((page - 1) * limit, page * limit);

  // --- PERHITUNGAN TOTAL ---
  const getTotalItems = () => {
    if (activeTab === "mapel") return filteredAssignments.length;
    if (activeTab === "wali" || activeTab === "rapor") return filteredClasses.length;
    return sessionData?.total || 0;
  };

  const getTotalPages = () => {
    if (activeTab === "mapel") return Math.ceil(filteredAssignments.length / limit) || 1;
    if (activeTab === "wali" || activeTab === "rapor") return Math.ceil(filteredClasses.length / limit) || 1;
    return sessionData?.total_pages || 1;
  };

  return {
    isMounted,
    user,
    isHomeroomTeacher, //  Di-export agar ResultFilters bisa memfilter Tab
    state: { activeTab, setActiveTab, search, setSearch, page, setPage, limit, setLimit },
    data: {
      mapel: getPaginated(filteredAssignments),
      classes: getPaginated(filteredClasses),
      sessions: sessionData?.data || [],
      
      totalItems: getTotalItems(),
      totalPages: getTotalPages(),
      
      isLoading: loadingAssignments || loadingClasses || loadingSessions,
      isFetching: fetchingAssignments || fetchingClasses || fetchingSessions,
    }
  };
}