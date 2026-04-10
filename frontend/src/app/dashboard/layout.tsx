// LOKASI: src/app/dashboard/layout.tsx
"use client";

import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Footer } from "@/components/dashboard/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      {/* 1. SIDEBAR (Warna Emerald 950 sesuai skrip Anda) */}
      <aside className="hidden md:block w-72 flex-shrink-0 z-50 shadow-xl">
        <Sidebar />
      </aside>

      {/* 2. MAIN WRAPPER */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header Dashboard (Sticky & Glassmorphism) */}
        <Header />

        {/* Content Area - Menghilangkan p-6 agar tidak double padding */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          {/* Container ini yang mengatur lebar maksimal konten */}
          <div className="w-full max-w-[1600px] mx-auto min-h-full flex flex-col">
            <div className="flex-1 p-4 md:p-8">{children}</div>

            {/* Footer di dalam scroll agar rapi */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
