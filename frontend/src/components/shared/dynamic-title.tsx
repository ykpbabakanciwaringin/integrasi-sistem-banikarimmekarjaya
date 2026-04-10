"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getPageTitleFromNav } from "@/config/dashboard-nav";
import { useAuthStore } from "@/stores/use-auth-store";

export function DynamicTitle() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const title = getPageTitleFromNav(pathname);
    
    // PERBAIKAN: Ambil nama lembaga, bukan ID-nya.
    // Kita gunakan fallback (||) untuk berjaga-jaga struktur data dari backend
    const institutionName = user?.institution_name || user?.institution?.name;
    
    // Jika nama lembaga ada, tampilkan. Jika tidak, cukup "YKP"
    const suffix = institutionName ? `${institutionName} YKP` : "YKP";
    
    document.title = `${title} | ${suffix}`;
  }, [pathname, user]);

  return null;
}