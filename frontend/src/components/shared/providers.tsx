// LOKASI: src/components/shared/providers.tsx
"use client"; // <--- WAJIB ADA DI BARIS PERTAMA

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Gunakan useState agar QueryClient tetap stabil selama siklus hidup aplikasi
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            //  FIX 1: Data dianggap segar selama 5 menit (mengurangi beban server)
            staleTime: 5 * 60 * 1000, 
            
            //  FIX 2: Cegah spam tembakan API saat user pindah/buka tab browser lain
            refetchOnWindowFocus: false, 
            
            //  FIX 3: Jika API gagal, hanya coba ulang 1 kali (defaultnya 3 kali dan bikin lag)
            retry: 1, 
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}